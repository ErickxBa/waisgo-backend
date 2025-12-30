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
} from '@nestjs/common';
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
import type { JwtPayload } from '../common/types';

@ApiTags('Bookings')
@ApiBearerAuth('access-token')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /* ================= PASAJERO ================= */

  /**
   * Crear una reserva en una ruta
   * - Valida que el pasajero no esté bloqueado por rating < 3.0
   * - Valida que no tenga deudas pendientes
   * - Genera OTP para validación al iniciar viaje
   * - Agrega stop intermedio si es necesario
   * - Recalcula orden de stops
   */
  @Roles(RolUsuarioEnum.PASAJERO)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear reserva en una ruta' })
  @ApiResponse({ status: 201, description: 'Reserva creada y confirmada.' })
  @ApiResponse({ status: 400, description: 'Pasajero bloqueado o ruta llena.' })
  @ApiResponse({ status: 404, description: 'Ruta no encontrada.' })
  async createBooking(@User() user: JwtPayload, @Body() dto: CreateBookingDto) {
    // TODO: Implementar lógica completa
    // 1. Validar que el pasajero no tenga rating < 3.0
    // 2. Validar que no tenga deudas pendientes de efectivo
    // 3. Validar que la ruta exista y tenga asientos disponibles
    // 4. Generar OTP de 6 dígitos
    // 5. Crear booking con estado CONFIRMADA
    // 6. Si hay pickup coords, agregar stop intermedio y recalcular orden
    // 7. Reducir asientos disponibles de la ruta
    return this.bookingsService.createBooking(user.sub, dto);
  }

  /**
   * Obtener mis reservas (pasajero)
   */
  @Roles(RolUsuarioEnum.PASAJERO)
  @Get('my')
  @ApiOperation({ summary: 'Obtener mis reservas como pasajero' })
  @ApiResponse({ status: 200, description: 'Listado de reservas.' })
  async getMyBookings(
    @User() user: JwtPayload,
    @Query('estado') estado?: string,
  ) {
    // TODO: Filtrar por estado si se proporciona
    return this.bookingsService.getMyBookings(user.sub, estado);
  }

  /**
   * Obtener detalle de una reserva
   */
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

  /**
   * Cancelar una reserva
   * - Aplica reglas de reversión según método de pago
   * - Si digital: reversión automática
   * - Si efectivo: libera la deuda pendiente
   */
  @Roles(RolUsuarioEnum.PASAJERO)
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una reserva' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Reserva cancelada.' })
  @ApiResponse({ status: 400, description: 'No se puede cancelar.' })
  async cancelBooking(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // TODO: Implementar lógica de cancelación
    // 1. Validar que la reserva pertenezca al pasajero
    // 2. Validar que no haya iniciado el viaje
    // 3. Aplicar política de cancelación (tiempo antes del viaje)
    // 4. Revertir pago si aplica
    // 5. Liberar asiento en la ruta
    return this.bookingsService.cancelBooking(user.sub, id);
  }

  /**
   * Obtener mapa de la ruta (solo si booking está activo)
   * - Si booking COMPLETADA/CANCELADA/NO_SHOW, no puede ver
   */
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
    // TODO: Validar que booking esté en estado CONFIRMADA
    // Si no, denegar acceso al mapa
    return this.bookingsService.getBookingMap(user.sub, id);
  }

  /* ================= CONDUCTOR ================= */

  /**
   * Obtener pasajeros de una ruta (conductor)
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Get('route/:routeId')
  @ApiOperation({ summary: 'Obtener pasajeros confirmados de una ruta' })
  @ApiParam({ name: 'routeId', description: 'ID de la ruta' })
  @ApiResponse({ status: 200, description: 'Listado de pasajeros.' })
  async getBookingsByRoute(
    @User() user: JwtPayload,
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ) {
    // TODO: Validar que la ruta pertenezca al conductor
    return this.bookingsService.getBookingsByRoute(user.sub, routeId);
  }

  /**
   * Marcar pasajero como llegado (completar booking)
   * - Cambia estado a COMPLETADA
   * - El pasajero ya no puede ver la ruta/mapa
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Marcar pasajero como llegado a destino' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Pasajero marcado como llegado.' })
  async completeBooking(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // TODO: Validar que el booking pertenezca a una ruta del conductor
    // Cambiar estado a COMPLETADA
    return this.bookingsService.completeBooking(user.sub, id);
  }

  /**
   * Marcar pasajero como NO_SHOW
   * - Solo después de 30 min de la hora de salida
   * - Conductor recibe 50% si era pago digital
   * - Pasajero queda con deuda si era efectivo
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Patch(':id/no-show')
  @ApiOperation({ summary: 'Marcar pasajero como NO_SHOW' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Pasajero marcado como NO_SHOW.' })
  @ApiResponse({ status: 400, description: 'Aún no han pasado 30 minutos.' })
  async markNoShow(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // TODO: Validar que hayan pasado 30 min desde hora de salida
    // Aplicar penalización al pasajero
    // Conductor recibe 50% si era pago digital
    return this.bookingsService.markNoShow(user.sub, id);
  }

  /* ================= VALIDACIÓN OTP ================= */

  /**
   * Verificar OTP del pasajero al iniciar viaje
   * - Marca otpUsado = true
   * - Permite iniciar viaje solo con pasajeros válidos
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Post(':id/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar OTP del pasajero' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'OTP validado correctamente.' })
  @ApiResponse({ status: 400, description: 'OTP inválido o ya usado.' })
  async verifyOtp(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyOtpDto,
  ) {
    // TODO: Validar OTP
    // Marcar otpUsado = true
    // Si es pago efectivo, confirmar recepción del pago
    return this.bookingsService.verifyOtp(user.sub, id, dto.otp);
  }
}
