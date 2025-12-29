import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './Models/driver.entity';
import { Vehicle } from './Models/vehicle.entity';
import { UserProfile } from '../business/Models/user-profile.entity';
import { BusinessUser } from '../business/Models/business-user.entity';
import { DriverDocument } from './Models/driver-document.entity';
import { EstadoConductorEnum } from './Enums/estado-conductor.enum';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/Enums/audit-actions.enum';
import { AuditResult } from '../audit/Enums/audit-result.enum';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepo: Repository<UserProfile>,
    @InjectRepository(BusinessUser)
    private readonly businessUserRepo: Repository<BusinessUser>,
    @InjectRepository(DriverDocument)
    private readonly driverDocumentRepo: Repository<DriverDocument>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Obtener perfil del conductor
   */
  async getProfile(userId: string): Promise<any> {
    const driver = await this.driverRepo.findOne({
      where: { userId },
      relations: ['user', 'user.profile', 'vehicles', 'documents'],
    });

    if (!driver) {
      throw new NotFoundException('Conductor no encontrado');
    }

    const profile = driver.user?.profile;

    return {
      id: driver.id,
      userId: driver.userId,
      nombre: profile?.nombre,
      apellido: profile?.apellido,
      email: driver.user?.email,
      celular: profile?.celular,
      alias: driver.user?.alias,
      foto: profile?.fotoPerfilUrl,
      calificacion: profile?.ratingPromedio || 0,
      verificado: driver.estado === EstadoConductorEnum.APROBADO,
      estado: driver.estado,
      vehiculo: driver.vehicles && driver.vehicles.length > 0
        ? {
            id: driver.vehicles[0].id,
            marca: driver.vehicles[0].marca,
            modelo: driver.vehicles[0].modelo,
            color: driver.vehicles[0].color,
            placa: driver.vehicles[0].placa,
            asientos: driver.vehicles[0].asientosDisponibles,
          }
        : null,
      paypalEmail: driver.paypalEmail,
      viajesTotales: profile?.totalViajes || 0,
      createdAt: driver.createdAt,
    };
  }

  /**
   * Obtener información de un conductor por ID
   */
  async getDriverById(driverId: string): Promise<any> {
    const driver = await this.driverRepo.findOne({
      where: { id: driverId },
      relations: ['user', 'user.profile', 'vehicles'],
    });

    if (!driver) {
      throw new NotFoundException('Conductor no encontrado');
    }

    const profile = driver.user?.profile;

    return {
      id: driver.id,
      nombre: profile?.nombre,
      apellido: profile?.apellido,
      alias: driver.user?.alias,
      calificacion: profile?.ratingPromedio || 0,
      foto: profile?.fotoPerfilUrl,
      vehiculo: driver.vehicles && driver.vehicles.length > 0
        ? {
            marca: driver.vehicles[0].marca,
            modelo: driver.vehicles[0].modelo,
            color: driver.vehicles[0].color,
            placa: driver.vehicles[0].placa,
            asientos: driver.vehicles[0].asientosDisponibles,
          }
        : null,
      verificado: driver.estado === EstadoConductorEnum.APROBADO,
      createdAt: driver.createdAt,
    };
  }

  /**
   * Actualizar perfil del conductor
   */
  async updateProfile(userId: string, data: Record<string, any>): Promise<any> {
    const driver = await this.driverRepo.findOne({
      where: { userId },
      relations: ['user', 'user.profile'],
    });

    if (!driver) {
      throw new NotFoundException('Conductor no encontrado');
    }

    // Actualizar datos del perfil
    if (driver.user?.profile) {
      if (data.alias) driver.user.alias = data.alias;
      if (data.foto) driver.user.profile.fotoPerfilUrl = data.foto;
      
      await this.businessUserRepo.save(driver.user);
      await this.userProfileRepo.save(driver.user.profile);
    }

    // Actualizar datos del conductor
    if (data.paypalEmail) {
      driver.paypalEmail = data.paypalEmail;
      await this.driverRepo.save(driver);
    }

    return this.getProfile(userId);
  }

  /**
   * Crear solicitud para ser conductor
   */
  async createDriverRequest(userId: string, data: any): Promise<any> {
    const existingDriver = await this.driverRepo.findOne({
      where: { userId },
    });

    if (existingDriver) {
      throw new BadRequestException('El usuario ya es conductor');
    }

    const businessUser = await this.businessUserRepo.findOne({
      where: { id: userId },
    });

    if (!businessUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Crear registro de conductor
    const driver = this.driverRepo.create({
      userId,
      estado: EstadoConductorEnum.PENDIENTE,
      paypalEmail: data.paypalEmail || '',
    });

    await this.driverRepo.save(driver);

    // Crear vehículo si se proporciona
    if (data.vehiculo) {
      const vehicle = this.vehicleRepo.create({
        driverId: driver.id,
        marca: data.vehiculo.marca,
        modelo: data.vehiculo.modelo,
        color: data.vehiculo.color,
        placa: data.vehiculo.placa,
        asientosDisponibles: data.vehiculo.asientos || 4,
      });

      await this.vehicleRepo.save(vehicle);
    }

    // Auditar
    await this.auditService.logEvent({
      action: AuditAction.REGISTER,
      userId,
      result: AuditResult.SUCCESS,
    });

    return {
      message: 'Solicitud de conductor creada exitosamente',
      driverId: driver.id,
    };
  }

  /**
   * Obtener historial de viajes
   */
  async getTripHistory(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<any> {
    // Implementar query a tabla de bookings/rutas
    return {
      trips: [],
      total: 0,
    };
  }

  /**
   * Obtener estadísticas del conductor
   */
  async getStats(userId: string): Promise<any> {
    const driver = await this.driverRepo.findOne({
      where: { userId },
      relations: ['user.profile'],
    });

    if (!driver) {
      throw new NotFoundException('Conductor no encontrado');
    }

    const profile = driver.user?.profile;

    return {
      totalTrips: profile?.totalViajes || 0,
      totalEarnings: 0, // Campo no existe en entidad
      averageRating: profile?.ratingPromedio || 0,
      thisMonthEarnings: 0,
      cancelledTrips: 0,
    };
  }

  /**
   * Obtener disponibilidad del conductor
   */
  async getAvailability(userId: string): Promise<any> {
    const driver = await this.driverRepo.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Conductor no encontrado');
    }

    return {
      isAvailable: driver.estado === EstadoConductorEnum.APROBADO,
      status: driver.estado,
    };
  }

  /**
   * Actualizar disponibilidad del conductor
   */
  async updateAvailability(userId: string, isAvailable: boolean): Promise<any> {
    const driver = await this.driverRepo.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Conductor no encontrado');
    }

    // La disponibilidad en realidad está vinculada al estado
    // Solo cambiar si el conductor está aprobado
    if (driver.estado !== EstadoConductorEnum.APROBADO) {
      throw new BadRequestException('El conductor debe estar aprobado para cambiar su disponibilidad');
    }

    return {
      message: 'Disponibilidad actualizada',
      isAvailable,
      status: driver.estado,
    };
  }
}
