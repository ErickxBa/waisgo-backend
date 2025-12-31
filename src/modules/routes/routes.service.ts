import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';

import { Route } from './Models/route.entity';
import { RouteStop } from './Models/route-stop.entity';
import { CreateRouteDto, SearchRoutesDto, AddStopDto } from './Dto';
import { EstadoRutaEnum } from './Enums';
import { Driver } from '../drivers/Models/driver.entity';
import { Vehicle } from '../drivers/Models/vehicle.entity';
import { EstadoConductorEnum } from '../drivers/Enums/estado-conductor.enum';
import { UserProfile } from '../business/Models/user-profile.entity';
import { Booking } from '../bookings/Models/booking.entity';
import { EstadoReservaEnum } from '../bookings/Enums';
import { Payment } from '../payments/Models/payment.entity';
import { EstadoPagoEnum } from '../payments/Enums';
import { PaymentsService } from '../payments/payments.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResult } from '../audit/Enums';
import { ErrorMessages } from '../common/constants/error-messages.constant';
import type { AuthContext } from '../common/types';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly paymentsService: PaymentsService,
    private readonly auditService: AuditService,
  ) {}

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async ensureRouteAccess(
    route: Route,
    userId: string,
  ): Promise<void> {
    if (route.estado === EstadoRutaEnum.ACTIVA) {
      return;
    }

    if (route.driver?.userId && route.driver.userId === userId) {
      return;
    }

    const booking = await this.bookingRepository.findOne({
      where: { routeId: route.id, passengerId: userId },
    });

    if (!booking) {
      throw new NotFoundException(ErrorMessages.ROUTES.ROUTE_NOT_FOUND);
    }
  }

  private async getApprovedDriver(userId: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new ForbiddenException(ErrorMessages.DRIVER.NOT_A_DRIVER);
    }

    if (driver.estado !== EstadoConductorEnum.APROBADO) {
      throw new ForbiddenException(ErrorMessages.DRIVER.DRIVER_NOT_APPROVED);
    }

    return driver;
  }

  async createRoute(
    userId: string,
    dto: CreateRouteDto,
    context?: AuthContext,
  ): Promise<{ message: string; routeId?: string }> {
    const driver = await this.getApprovedDriver(userId);

    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(ErrorMessages.USER.PROFILE_NOT_FOUND);
    }

    if (profile.isBloqueadoPorRating || Number(profile.ratingPromedio) < 3) {
      throw new ForbiddenException(ErrorMessages.ROUTES.DRIVER_BLOCKED_LOW_RATING);
    }

    const activeVehicle = await this.vehicleRepository.findOne({
      where: { driverId: driver.id, isActivo: true },
      order: { createdAt: 'DESC' },
    });

    if (!activeVehicle) {
      throw new BadRequestException(ErrorMessages.ROUTES.NO_ACTIVE_VEHICLE);
    }

    if (dto.asientosTotales > activeVehicle.asientosDisponibles) {
      throw new BadRequestException(ErrorMessages.ROUTES.SEATS_EXCEED_VEHICLE);
    }

    if (!dto.precioPasajero || dto.precioPasajero <= 0) {
      throw new BadRequestException(ErrorMessages.ROUTES.ROUTE_PRICE_REQUIRED);
    }

    const route = this.routeRepository.create({
      driverId: driver.id,
      origen: dto.origen,
      fecha: dto.fecha,
      horaSalida: dto.horaSalida,
      destinoBase: dto.destinoBase.trim(),
      asientosTotales: dto.asientosTotales,
      asientosDisponibles: dto.asientosTotales,
      precioPasajero: dto.precioPasajero,
      estado: EstadoRutaEnum.ACTIVA,
      mensaje: dto.mensaje?.trim() || null,
      stops: dto.stops.map((stop, index) =>
        this.routeStopRepository.create({
          lat: stop.lat,
          lng: stop.lng,
          direccion: stop.direccion.trim(),
          orden: index + 1,
        }),
      ),
    });

    const savedRoute = await this.routeRepository.save(route);

    await this.auditService.logEvent({
      action: AuditAction.ROUTE_CREATED,
      userId,
      result: AuditResult.SUCCESS,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: { routeId: savedRoute.id },
    });

    return {
      message: ErrorMessages.ROUTES.ROUTE_CREATED,
      routeId: savedRoute.id,
    };
  }

  async getMyRoutes(
    userId: string,
    estado?: string,
  ): Promise<{ message: string; data?: Route[] }> {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException(ErrorMessages.DRIVER.NOT_A_DRIVER);
    }

    const whereClause: Record<string, unknown> = { driverId: driver.id };
    if (estado) {
      if (!Object.values(EstadoRutaEnum).includes(estado as EstadoRutaEnum)) {
        throw new BadRequestException(ErrorMessages.VALIDATION.INVALID_FORMAT('estado'));
      }
      whereClause.estado = estado;
    }

    const routes = await this.routeRepository.find({
      where: whereClause,
      relations: ['stops'],
      order: { createdAt: 'DESC' },
    });

    return {
      message: ErrorMessages.ROUTES.ROUTES_LIST_DRIVER,
      data: routes,
    };
  }

  async getAvailableRoutes(
    dto: SearchRoutesDto,
  ): Promise<{ message: string; data?: Route[] }> {
    const radiusKm = dto.radiusKm || 1;

    const whereClause: Record<string, unknown> = {
      estado: EstadoRutaEnum.ACTIVA,
      asientosDisponibles: MoreThan(0),
    };

    if (dto.fecha) {
      whereClause.fecha = dto.fecha;
    }

    const routes = await this.routeRepository.find({
      where: whereClause,
      relations: ['stops', 'driver', 'driver.user', 'driver.user.profile'],
    });

    const filtered = routes
      .map((route) => {
        const stops = route.stops || [];
        if (stops.length === 0) return null;

        const minDistance = Math.min(
          ...stops.map((stop) =>
            this.haversineDistance(
              dto.lat,
              dto.lng,
              Number(stop.lat),
              Number(stop.lng),
            ),
          ),
        );

        return minDistance <= radiusKm
          ? { route, distance: minDistance }
          : null;
      })
      .filter((item): item is { route: Route; distance: number } => Boolean(item))
      .sort((a, b) => a.distance - b.distance)
      .map((item) => item.route);

    return {
      message: ErrorMessages.ROUTES.ROUTES_LIST_AVAILABLE,
      data: filtered,
    };
  }

  async getRouteById(
    userId: string,
    routeId: string,
  ): Promise<{ message: string; data?: Route }> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['stops', 'driver', 'driver.user', 'driver.user.profile'],
    });

    if (!route) {
      throw new NotFoundException(ErrorMessages.ROUTES.ROUTE_NOT_FOUND);
    }

    await this.ensureRouteAccess(route, userId);

    return {
      message: ErrorMessages.ROUTES.ROUTE_DETAIL,
      data: route,
    };
  }

  async getRouteMap(
    userId: string,
    routeId: string,
  ): Promise<{ message: string; stops?: RouteStop[] }> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['driver'],
    });

    if (!route) {
      throw new NotFoundException(ErrorMessages.ROUTES.ROUTE_NOT_FOUND);
    }

    await this.ensureRouteAccess(route, userId);

    const stops = await this.routeStopRepository.find({
      where: { routeId },
      order: { orden: 'ASC' },
    });

    return {
      message: ErrorMessages.ROUTES.ROUTE_MAP,
      stops,
    };
  }

  async addRouteStop(
    userId: string,
    routeId: string,
    dto: AddStopDto,
    context?: AuthContext,
  ): Promise<{ message: string }> {
    const driver = await this.getApprovedDriver(userId);

    const route = await this.routeRepository.findOne({
      where: { id: routeId, driverId: driver.id },
      relations: ['stops'],
    });

    if (!route) {
      throw new NotFoundException(ErrorMessages.ROUTES.ROUTE_NOT_FOUND);
    }

    if (route.estado !== EstadoRutaEnum.ACTIVA) {
      throw new BadRequestException(ErrorMessages.ROUTES.ROUTE_NOT_ACTIVE);
    }

    const stops = (route.stops || []).sort((a, b) => a.orden - b.orden);
    let insertIndex = stops.length;

    if (stops.length > 1) {
      let bestExtraDistance = Number.POSITIVE_INFINITY;
      for (let i = 0; i < stops.length - 1; i += 1) {
        const current = stops[i];
        const next = stops[i + 1];
        const extra =
          this.haversineDistance(
            Number(current.lat),
            Number(current.lng),
            dto.lat,
            dto.lng,
          ) +
          this.haversineDistance(
            dto.lat,
            dto.lng,
            Number(next.lat),
            Number(next.lng),
          ) -
          this.haversineDistance(
            Number(current.lat),
            Number(current.lng),
            Number(next.lat),
            Number(next.lng),
          );

        if (extra < bestExtraDistance) {
          bestExtraDistance = extra;
          insertIndex = i + 1;
        }
      }
    }

    if (stops.length === 1) {
      insertIndex = 1;
    }

    const newOrder = insertIndex + 1;
    const updates = stops
      .filter((stop) => stop.orden >= newOrder)
      .map((stop) => ({ ...stop, orden: stop.orden + 1 }));

    if (updates.length > 0) {
      await this.routeStopRepository.save(updates);
    }

    const newStop = this.routeStopRepository.create({
      routeId,
      lat: dto.lat,
      lng: dto.lng,
      direccion: dto.direccion.trim(),
      orden: newOrder,
    });

    await this.routeStopRepository.save(newStop);

    await this.auditService.logEvent({
      action: AuditAction.ROUTE_UPDATED,
      userId,
      result: AuditResult.SUCCESS,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: { routeId, stopId: newStop.id },
    });

    return {
      message: ErrorMessages.ROUTES.ROUTE_STOP_ADDED,
    };
  }

  async cancelRoute(
    userId: string,
    routeId: string,
    context?: AuthContext,
  ): Promise<{ message: string }> {
    const driver = await this.getApprovedDriver(userId);

    const route = await this.routeRepository.findOne({
      where: { id: routeId, driverId: driver.id },
    });

    if (!route) {
      throw new NotFoundException(ErrorMessages.ROUTES.ROUTE_NOT_FOUND);
    }

    if (route.estado !== EstadoRutaEnum.ACTIVA) {
      throw new BadRequestException(ErrorMessages.ROUTES.ROUTE_NOT_ACTIVE);
    }

    route.estado = EstadoRutaEnum.CANCELADA;
    route.mensaje = ErrorMessages.ROUTES.ROUTE_CANCELLED;
    await this.routeRepository.save(route);

    await this.bookingRepository.update(
      { routeId, estado: In([EstadoReservaEnum.CONFIRMADA]) },
      { estado: EstadoReservaEnum.CANCELADA, cancelledAt: new Date() },
    );

    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.booking', 'booking')
      .where('booking.routeId = :routeId', { routeId })
      .andWhere('payment.status IN (:...statuses)', {
        statuses: [EstadoPagoEnum.PAID, EstadoPagoEnum.PENDING],
      })
      .getMany();

    for (const payment of payments) {
      if (payment.status === EstadoPagoEnum.PAID) {
        try {
          await this.paymentsService.reversePayment(payment.id, userId, context);
        } catch {
          payment.status = EstadoPagoEnum.FAILED;
          payment.failureReason = 'Refund failed after route cancel';
          await this.paymentRepository.save(payment);
        }
      } else if (payment.status === EstadoPagoEnum.PENDING) {
        payment.status = EstadoPagoEnum.FAILED;
        payment.failureReason = 'Route cancelled';
        payment.reversedAt = new Date();
        await this.paymentRepository.save(payment);
      }
    }

    await this.auditService.logEvent({
      action: AuditAction.ROUTE_CANCELLED_DRIVER,
      userId,
      result: AuditResult.SUCCESS,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: { routeId },
    });

    return {
      message: ErrorMessages.ROUTES.ROUTE_CANCELLED,
    };
  }

  async finalizeRoute(
    userId: string,
    routeId: string,
    context?: AuthContext,
  ): Promise<{ message: string }> {
    const driver = await this.getApprovedDriver(userId);

    const route = await this.routeRepository.findOne({
      where: { id: routeId, driverId: driver.id },
    });

    if (!route) {
      throw new NotFoundException(ErrorMessages.ROUTES.ROUTE_NOT_FOUND);
    }

    if (route.estado === EstadoRutaEnum.CANCELADA) {
      throw new BadRequestException(ErrorMessages.ROUTES.ROUTE_NOT_ACTIVE);
    }

    const pendingBookings = await this.bookingRepository.find({
      where: {
        routeId,
        estado: In([EstadoReservaEnum.CONFIRMADA, EstadoReservaEnum.CANCELADA]),
      },
    });

    if (pendingBookings.length > 0) {
      throw new BadRequestException(ErrorMessages.ROUTES.ROUTE_NOT_FINISHED);
    }

    route.estado = EstadoRutaEnum.FINALIZADA;
    await this.routeRepository.save(route);

    await this.auditService.logEvent({
      action: AuditAction.ROUTE_COMPLETED,
      userId,
      result: AuditResult.SUCCESS,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: { routeId },
    });

    return {
      message: ErrorMessages.ROUTES.ROUTE_FINALIZED,
    };
  }
}
