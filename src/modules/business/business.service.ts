import { StorageService } from './../storage/storage.service';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusinessUser } from './Models/business-user.entity';
import { UserProfile } from './Models/user-profile.entity';
import { Repository, EntityManager } from 'typeorm';
import { UpdateProfileDto } from './Dto';
import { ErrorMessages } from '../common/constants/error-messages.constant';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResult } from '../audit/Enums';
import type { AuthContext } from '../common/types';
import { generatePublicId } from '../common/utils/public-id.util';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(
    @InjectRepository(BusinessUser)
    private readonly businessUserRepo: Repository<BusinessUser>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    private readonly storageService: StorageService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private generateAlias(): string {
    const randomPart = Math.random().toString(16).slice(2, 8).toUpperCase();
    return `Pasajero${randomPart}`;
  }

  async createFromAuth(
    userId: string,
    data: {
      email: string;
      nombre: string;
      apellido: string;
      celular: string;
    },
  ): Promise<{ publicId: string; alias: string }> {
    const publicId = await generatePublicId(this.businessUserRepo, 'USR');
    const alias = this.generateAlias();
    const businessUser = this.businessUserRepo.create({
      id: userId,
      publicId,
      email: data.email,
      alias,
    });

    const profile = this.profileRepo.create({
      userId,
      nombre: data.nombre,
      apellido: data.apellido,
      celular: data.celular,
    });

    businessUser.profile = profile;

    await this.businessUserRepo.save(businessUser);

    this.logger.log(`Business user created: ${userId}`);

    return { publicId, alias };
  }

  /**
   * Crea un usuario de negocio usando un EntityManager (para transacciones)
   */
  async createFromAuthWithManager(
    manager: EntityManager,
    userId: string,
    data: {
      email: string;
      nombre: string;
      apellido: string;
      celular: string;
    },
  ): Promise<{ publicId: string; alias: string }> {
    const businessRepo = manager.getRepository(BusinessUser);
    const publicId = await generatePublicId(businessRepo, 'USR');
    const alias = this.generateAlias();
    const businessUser = manager.create(BusinessUser, {
      id: userId,
      publicId,
      email: data.email,
      alias,
    });

    const profile = manager.create(UserProfile, {
      userId,
      nombre: data.nombre,
      apellido: data.apellido,
      celular: data.celular,
    });

    businessUser.profile = profile;

    await manager.save(businessUser);

    this.logger.log(`Business user created with transaction: ${userId}`);

    return { publicId, alias };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    context?: AuthContext,
  ): Promise<{ message: string }> {
    const profile = await this.profileRepo.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(ErrorMessages.USER.PROFILE_NOT_FOUND);
    }

    // Solo actualizar campos que están presentes en el DTO
    if (dto.nombre !== undefined) {
      profile.nombre = dto.nombre;
    }
    if (dto.apellido !== undefined) {
      profile.apellido = dto.apellido;
    }
    if (dto.celular !== undefined) {
      profile.celular = dto.celular;
    }

    await this.profileRepo.save(profile);

    this.logger.log(`Profile updated for user: ${userId}`);

    await this.auditService.logEvent({
      action: AuditAction.PROFILE_UPDATE,
      userId,
      result: AuditResult.SUCCESS,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: { changes: dto },
    });

    return { message: ErrorMessages.USER.PROFILE_UPDATED };
  }

  async softDeleteUser(userId: string, context?: AuthContext): Promise<void> {
    const result = await this.businessUserRepo.update(
      { id: userId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
    );

    if (result.affected === 0) {
      this.logger.warn(`User not found or already deleted: ${userId}`);
    } else {
      this.logger.log(`User soft deleted: ${userId}`);

      await this.auditService.logEvent({
        action: AuditAction.ACCOUNT_DEACTIVATED,
        userId,
        result: AuditResult.SUCCESS,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
      });
    }
  }

  async getDisplayName(userId: string): Promise<string> {
    const user = await this.businessUserRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      return 'Usuario';
    }

    if (user.profile?.nombre) {
      const fullName =
        `${user.profile.nombre} ${user.profile.apellido ?? ''}`.trim();
      return fullName || 'Usuario';
    }

    if (user.alias) {
      return user.alias;
    }

    return 'Usuario';
  }

  async findByUserId(userId: string): Promise<BusinessUser | null> {
    return this.businessUserRepo.findOne({
      where: { id: userId, isDeleted: false },
      relations: ['profile'],
    });
  }

  async getMyProfile(userId: string) {
    const user = await this.businessUserRepo.findOne({
      where: { id: userId, isDeleted: false },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException(ErrorMessages.USER.NOT_FOUND);
    }

    if (!user.profile) {
      throw new NotFoundException(ErrorMessages.USER.PROFILE_NOT_FOUND);
    }

    const avatarUrl = user.profile.fotoPerfilUrl
      ? await this.storageService.getSignedUrl(
          this.config.getOrThrow('STORAGE_PROFILE_BUCKET'),
          user.profile.fotoPerfilUrl,
        )
      : await this.getDefaultAvatarUrl();

    return {
      id: user.id,
      publicId: user.publicId,
      alias: user.alias,
      email: user.email,
      nombre: user.profile.nombre,
      apellido: user.profile.apellido,
      celular: user.profile.celular,
      avatarUrl,
      rating: user.profile.ratingPromedio,
      totalViajes: user.profile.totalViajes,
    };
  }

  async updateProfilePhoto(
    userId: string,
    file: Express.Multer.File,
    context?: AuthContext,
  ): Promise<{ message: string }> {
    const profile = await this.profileRepo.findOne({ where: { userId } });

    if (!profile) {
      throw new NotFoundException(ErrorMessages.USER.PROFILE_NOT_FOUND);
    }

    const objectPath = await this.storageService.upload({
      bucket: this.config.getOrThrow('STORAGE_PROFILE_BUCKET'),
      folder: 'avatars',
      filename: `user-${userId}.jpg`,
      buffer: file.buffer,
      mimetype: file.mimetype,
    });

    profile.fotoPerfilUrl = objectPath;
    await this.profileRepo.save(profile);

    await this.auditService.logEvent({
      action: AuditAction.PROFILE_PHOTO_UPDATE,
      userId,
      result: AuditResult.SUCCESS,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: { objectPath },
    });

    return { message: ErrorMessages.USER.PROFILE_PHOTO_UPDATED };
  }

  private getDefaultAvatarUrl(): Promise<string> {
    return this.storageService.getSignedUrl(
      this.config.getOrThrow('STORAGE_PROFILE_BUCKET'),
      'avatars/default.jpg',
    );
  }
}
