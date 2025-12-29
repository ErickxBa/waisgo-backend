import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from './Models/route.entity';
import { RouteStop } from './Models/route-stop.entity';
import { Driver } from '../drivers/Models/driver.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/Enums/audit-actions.enum';
import { AuditResult } from '../audit/Enums/audit-result.enum';
import { EstadoRutaEnum } from './Enums/estado-ruta.enum';
import { EstadoConductorEnum } from '../drivers/Enums/estado-conductor.enum';

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    @InjectRepository(Route)
    private readonly routeRepo: Repository<Route>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepo: Repository<RouteStop>,
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Buscar rutas disponibles
   */
  async searchRoutes(
    filters: any,
    limit: number = 20,
    offset: number = 0,
  ): Promise<any> {
    const query = this.routeRepo
      .createQueryBuilder('route')
      .where('route.estado = :estado', { estado: EstadoRutaEnum.ACTIVA })
      .andWhere('route.asientosDisponibles >= :asientos', {
        asientos: filters.asientos || 1,
      })
      .leftJoinAndSelect('route.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('driver.vehicles', 'vehicles')
      .skip(offset)
      .take(limit);

    if (filters.origen) {
      query.andWhere('route.origen = :origen', {
        origen: filters.origen,
      });
    }

    if (filters.destinoBase) {
      query.andWhere('route.destinoBase ILIKE :destino', {
        destino: `%${filters.destinoBase}%`,
      });
    }

    if (filters.fecha) {
      query.andWhere('route.fecha = :fecha', {
        fecha: filters.fecha,
      });
    }

    const [routes, total] = await query.getManyAndCount();

    return {
      routes: routes.map((route) => this.formatRoute(route)),
      total,
    };
  }

  /**
   * Obtener ruta por ID
   */
  async getRouteById(routeId: string): Promise<any> {
    const route = await this.routeRepo.findOne({
      where: { id: routeId },
      relations: ['driver', 'driver.user', 'driver.user.profile', 'driver.vehicles', 'stops'],
    });

    if (!route) {
      throw new NotFoundException('Ruta no encontrada');
    }

    return this.formatRoute(route);
  }

  /**
   * Obtener mis rutas (conductor)
   */
  async getMyRoutes(
    userId: string,
    estado?: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<any> {
    const driver = await this.driverRepo.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Conductor no encontrado');
    }

    const query = this.routeRepo
      .createQueryBuilder('route')
      .where('route.driverId = :driverId', { driverId: driver.id })
      .leftJoinAndSelect('route.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('driver.vehicles', 'vehicles')
      .skip(offset)
      .take(limit);

    if (estado) {
      query.andWhere('route.estado = :estado', { estado });
    } else {
      query.andWhere('route.estado != :cancelada', { cancelada: EstadoRutaEnum.CANCELADA });
    }

    const [routes, total] = await query.getManyAndCount();

    return {
      routes: routes.map((route) => this.formatRoute(route)),
      total,
    };
  }

  /**
   * Crear una nueva ruta
   */
  async createRoute(userId: string, data: any): Promise<any> {
    const driver = await this.driverRepo.findOne({
      where: { userId },
      relations: ['user', 'user.profile', 'vehicles'],
    });

    if (!driver) {
      throw new NotFoundException('Conductor no encontrado');
    }

    if (driver.estado !== EstadoConductorEnum.APROBADO) {
      throw new BadRequestException('El conductor no está aprobado');
    }

    const route = this.routeRepo.create({
      driverId: driver.id,
      origen: data.origen,
      fecha: data.fecha,
      horaSalida: data.horaSalida,
      destinoBase: data.destinoBase,
      asientosTotales: data.asientosTotales,
      asientosDisponibles: data.asientosTotales,
      estado: EstadoRutaEnum.ACTIVA,
    });

    await this.routeRepo.save(route);

    // Auditar
    await this.auditService.logEvent({
      action: AuditAction.ROUTE_CREATED,
      userId,
      result: AuditResult.SUCCESS,
    });

    return this.formatRoute(route);
  }

  /**
   * Actualizar una ruta
   */
  async updateRoute(routeId: string, userId: string, data: any): Promise<any> {
    const route = await this.routeRepo.findOne({
      where: { id: routeId },
      relations: ['driver'],
    });

    if (!route) {
      throw new NotFoundException('Ruta no encontrada');
    }

    if (route.driver.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta ruta',
      );
    }

    if (data.asientosTotales !== undefined) {
      route.asientosTotales = data.asientosTotales;
      route.asientosTotales = data.asientosTotales;
      // Recalcular disponibles
      const booked = route.asientosTotales - route.asientosDisponibles;
      route.asientosDisponibles = Math.max(0, data.asientosTotales - booked);
    }
    if (data.destinoBase) route.destinoBase = data.destinoBase;
    if (data.mensaje) route.mensaje = data.mensaje;

    await this.routeRepo.save(route);

    // Auditar
    await this.auditService.logEvent({
      action: AuditAction.ROUTE_UPDATED,
      userId,
      result: AuditResult.SUCCESS,
    });

    return this.formatRoute(route);
  }

  /**
   * Cancelar una ruta
   */
  async cancelRoute(
    routeId: string,
    userId: string,
    razon?: string,
  ): Promise<any> {
    const route = await this.routeRepo.findOne({
      where: { id: routeId },
      relations: ['driver'],
    });

    if (!route) {
      throw new NotFoundException('Ruta no encontrada');
    }

    if (route.driver.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para cancelar esta ruta');
    }

    route.estado = EstadoRutaEnum.CANCELADA;
    route.mensaje = razon || null;
    await this.routeRepo.save(route);

    // Auditar
    await this.auditService.logEvent({
      action: AuditAction.ROUTE_CANCELLED_DRIVER,
      userId,
      result: AuditResult.SUCCESS,
      metadata: { routeId, razon },
    });

    return {
      message: 'Ruta cancelada',
    };
  }

  /**
   * Obtener rutas cercanas
   */
  async getNearbyRoutes(
    origen: string,
    limit: number = 20,
  ): Promise<any> {
    const routes = await this.routeRepo
      .createQueryBuilder('route')
      .where('route.estado = :estado', { estado: EstadoRutaEnum.ACTIVA })
      .andWhere('route.origen = :origen', { origen })
      .leftJoinAndSelect('route.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('driver.vehicles', 'vehicles')
      .orderBy('route.fecha', 'ASC')
      .addOrderBy('route.horaSalida', 'ASC')
      .take(limit)
      .getMany();

    return {
      routes: routes.map((route) => this.formatRoute(route)),
    };
  }

  /**
   * Matching de rutas por origen y destino
   */
  async matchRoutes(
    origen: string,
    destinoBase: string,
    fecha?: string,
  ): Promise<any> {
    const query = this.routeRepo
      .createQueryBuilder('route')
      .where('route.estado = :estado', { estado: EstadoRutaEnum.ACTIVA })
      .andWhere('route.origen = :origen', { origen })
      .andWhere('route.destinoBase ILIKE :destino', {
        destino: `%${destinoBase}%`,
      })
      .leftJoinAndSelect('route.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('driver.vehicles', 'vehicles');

    if (fecha) {
      query.andWhere('route.fecha = :fecha', { fecha });
    }

    const routes = await query
      .orderBy('route.fecha', 'ASC')
      .addOrderBy('route.horaSalida', 'ASC')
      .take(10)
      .getMany();

    return {
      routes: routes.map((route) => this.formatRoute(route)),
    };
  }

  /**
   * Formatear ruta para respuesta
   */
  private formatRoute(route: Route): any {
    const vehicle = route.driver?.vehicles?.[0];
    return {
      id: route.id,
      origen: route.origen,
      fecha: route.fecha,
      horaSalida: route.horaSalida,
      destinoBase: route.destinoBase,
      conductor: route.driver
        ? {
            id: route.driver.id,
            nombre: route.driver.user?.profile?.nombre,
            apellido: route.driver.user?.profile?.apellido,
            calificacion: route.driver.user?.profile?.ratingPromedio || 0,
            foto: route.driver.user?.profile?.fotoPerfilUrl,
            vehiculo: vehicle
              ? {
                  id: vehicle.id,
                  marca: vehicle.marca,
                  modelo: vehicle.modelo,
                  color: vehicle.color,
                  placa: vehicle.placa,
                  asientosDisponibles: vehicle.asientosDisponibles,
                }
              : null,
          }
        : null,
      asientosDisponibles: route.asientosDisponibles,
      asientosTotales: route.asientosTotales,
      estado: route.estado,
      mensaje: route.mensaje,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
    };
  }
}
