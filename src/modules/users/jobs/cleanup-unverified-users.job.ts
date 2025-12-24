import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../Models/users.entity';
import { EstadoVerificacionEnum } from '../Enums/estado-ver.enum';

@Injectable()
export class CleanupUnverifiedUsersJob {
  private readonly logger = new Logger('CleanupUnverifiedUsersJob');

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanup() {
    this.logger.log('Iniciando limpieza de usuarios no verificados...');

    try {
      const days =
        this.configService.get<number>('CLEANUP_UNVERIFIED_DAYS') || 3;

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const result = await this.usersRepo.update(
        {
          estadoVerificacion: EstadoVerificacionEnum.NO_VERIFICADO,
          createdAt: LessThan(cutoff),
          isDeleted: false,
        },
        {
          isDeleted: true,
          deletedAt: new Date(),
        },
      );

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Limpieza completada: Se eliminaron ${result.affected} usuarios creados antes de ${cutoff.toISOString()}`,
        );
      } else {
        this.logger.log(
          'Limpieza completada: No se encontraron usuarios para eliminar.',
        );
      }
    } catch (error) {
      this.logger.error('Error durante el Cron Job de limpieza', error.stack);
    }
  }
}
