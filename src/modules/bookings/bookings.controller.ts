import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Roles, User } from '../common/Decorators';
import { RolUsuarioEnum } from '../auth/Enum';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, VerifyOtpDto } from './Dto';
import type { JwtPayload, AuthContext } from '../common/types';

@ApiTags('Bookings')
@ApiBearerAuth('access-token')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  private getAuthContext(req: Request): AuthContext {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.ip || req.socket?.remoteAddress || 'unknown';

    return {
      ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    };
  }

  /* ================= PASAJERO ================= */

  @Roles(RolUsuarioEnum.PASAJERO)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear reserva en una ruta' })
  @ApiResponse({ status: 201, description: 'Reserva creada y confirmada.' })
  @ApiResponse({ status: 400, description: 'Pasajero bloqueado o ruta llena.' })
  @ApiResponse({ status: 404, description: 'Ruta no encontrada.' })
  async createBooking(
    @User() user: JwtPayload,
    @Body() dto: CreateBookingDto,
    @Req() req: Request,
  ) {
    return this.bookingsService.createBooking(
      user.sub,
      dto,
      this.getAuthContext(req),
    );
  }

  @Roles(RolUsuarioEnum.PASAJERO)
  @Get('my')
  @ApiOperation({ summary: 'Obtener mis reservas como pasajero' })
  @ApiResponse({ status: 200, description: 'Listado de reservas.' })
  async getMyBookings(
    @User() user: JwtPayload,
    @Query('estado') estado?: string,
  ) {
    return this.bookingsService.getMyBookings(user.sub, estado);
  }

  @Roles(RolUsuarioEnum.PASAJERO)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una reserva' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Detalle de la reserva.' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' })
  async getBookingById(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.getBookingById(user.sub, id);
  }

  @Roles(RolUsuarioEnum.PASAJERO)
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una reserva' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Reserva cancelada.' })
  @ApiResponse({ status: 400, description: 'No se puede cancelar.' })
  async cancelBooking(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.bookingsService.cancelBooking(
      user.sub,
      id,
      this.getAuthContext(req),
    );
  }

  @Roles(RolUsuarioEnum.PASAJERO)
  @Get(':id/map')
  @ApiOperation({ summary: 'Obtener coordenadas del mapa de la ruta' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Coordenadas de la ruta.' })
  @ApiResponse({ status: 403, description: 'Reserva no activa, sin acceso.' })
  async getBookingMap(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.getBookingMap(user.sub, id);
  }

  /* ================= CONDUCTOR ================= */

  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Get('route/:routeId')
  @ApiOperation({ summary: 'Obtener pasajeros confirmados de una ruta' })
  @ApiParam({ name: 'routeId', description: 'ID de la ruta' })
  @ApiResponse({ status: 200, description: 'Listado de pasajeros.' })
  async getBookingsByRoute(
    @User() user: JwtPayload,
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ) {
    return this.bookingsService.getBookingsByRoute(user.sub, routeId);
  }

  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Marcar pasajero como llegado a destino' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Pasajero marcado como llegado.' })
  async completeBooking(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.bookingsService.completeBooking(
      user.sub,
      id,
      this.getAuthContext(req),
    );
  }

  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Patch(':id/no-show')
  @ApiOperation({ summary: 'Marcar pasajero como NO_SHOW' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Pasajero marcado como NO_SHOW.' })
  @ApiResponse({ status: 400, description: 'Aun no han pasado 30 minutos.' })
  async markNoShow(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.bookingsService.markNoShow(
      user.sub,
      id,
      this.getAuthContext(req),
    );
  }

  /* ================= VALIDACION OTP ================= */

  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Post(':id/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar OTP del pasajero' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'OTP validado correctamente.' })
  @ApiResponse({ status: 400, description: 'OTP invalido o ya usado.' })
  async verifyOtp(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
  ) {
    return this.bookingsService.verifyOtp(
      user.sub,
      id,
      dto.otp,
      this.getAuthContext(req),
    );
  }
}
