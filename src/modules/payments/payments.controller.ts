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
  ApiQuery,
} from '@nestjs/swagger';
import { Roles, User } from '../common/Decorators';
import { RolUsuarioEnum } from '../auth/Enum';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, CapturePaypalDto } from './Dto';
import type { JwtPayload } from '../common/types';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /* ========== PASAJERO ========== */

  /**
   * Crear un pago para una reserva
   * - Si es PayPal/Tarjeta: inicia flujo de pago digital
   * - Si es efectivo: no crea pago, se valida con OTP al subir
   */
  @Roles(RolUsuarioEnum.PASAJERO)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear pago para una reserva' })
  @ApiResponse({ status: 201, description: 'Pago iniciado.' })
  @ApiResponse({ status: 400, description: 'Reserva inválida o ya pagada.' })
  async createPayment(@User() user: JwtPayload, @Body() dto: CreatePaymentDto) {
    // TODO:
    // 1. Validar que el booking pertenece al pasajero
    // 2. Validar que no existe ya un pago para ese booking
    // 3. Crear payment con status PENDING
    return this.paymentsService.createPayment(user.sub, dto);
  }

  /**
   * Obtener mis pagos como pasajero
   */
  @Roles(RolUsuarioEnum.PASAJERO)
  @Get('my')
  @ApiOperation({ summary: 'Obtener mis pagos como pasajero' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado',
  })
  @ApiResponse({ status: 200, description: 'Listado de pagos.' })
  async getMyPayments(
    @User() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.getMyPayments(user.sub, status);
  }

  /**
   * Obtener detalle de un pago
   */
  @Roles(RolUsuarioEnum.PASAJERO)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un pago' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Detalle del pago.' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado.' })
  async getPaymentById(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.getPaymentById(user.sub, id);
  }

  /* ========== PAYPAL ========== */

  /**
   * Crear orden de PayPal
   * - Crea orden en PayPal API
   * - Guarda paypalOrderId en el payment
   * - Retorna approvalUrl para el frontend
   */
  @Roles(RolUsuarioEnum.PASAJERO)
  @Post(':id/paypal/create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Crear orden de PayPal' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Orden PayPal creada.' })
  async createPaypalOrder(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // TODO:
    // 1. Validar que el pago pertenece al pasajero
    // 2. Llamar a PayPal API para crear orden
    // 3. Guardar paypalOrderId
    // 4. Retornar approvalUrl
    return this.paymentsService.createPaypalOrder(user.sub, id);
  }

  /**
   * Capturar orden de PayPal (después de aprobación del usuario)
   * - Verifica con PayPal API que el pago fue aprobado
   * - Actualiza status a PAID
   * - ⚠️ SIEMPRE valida con PayPal, NUNCA confiar en el frontend
   */
  @Roles(RolUsuarioEnum.PASAJERO)
  @Post(':id/paypal/capture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capturar pago de PayPal' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Pago capturado correctamente.' })
  @ApiResponse({ status: 400, description: 'Pago no aprobado por PayPal.' })
  async capturePaypalOrder(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CapturePaypalDto,
  ) {
    // TODO:
    // 1. Validar que el pago pertenece al pasajero
    // 2. Llamar a PayPal API para capturar
    // 3. Validar respuesta de PayPal (COMPLETED)
    // 4. Actualizar status a PAID y paidAt
    // 5. Guardar paypalCaptureId
    return this.paymentsService.capturePaypalOrder(
      user.sub,
      id,
      dto.paypalOrderId,
    );
  }

  /* ========== CONDUCTOR ========== */

  /**
   * Obtener pagos recibidos (para el conductor)
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Get('driver')
  @ApiOperation({ summary: 'Obtener pagos recibidos como conductor' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Pagos recibidos.' })
  async getDriverPayments(
    @User() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    // TODO: Obtener pagos de bookings en rutas del conductor
    return this.paymentsService.getDriverPayments(user.sub, status);
  }

  /* ========== ADMIN ========== */

  /**
   * Listado global de pagos
   */
  @Roles(RolUsuarioEnum.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Listado global de pagos' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Listado global.' })
  async getAllPayments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.getAllPayments(page, limit, status);
  }

  /**
   * Revertir un pago (admin)
   * - Reversión total o parcial
   * - Actualiza status a REVERSED
   */
  @Roles(RolUsuarioEnum.ADMIN)
  @Patch(':id/reverse')
  @ApiOperation({ summary: 'Revertir un pago' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Pago revertido.' })
  async reversePayment(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // TODO:
    // 1. Validar que el pago está en status PAID
    // 2. Si es PayPal, llamar a refund API
    // 3. Actualizar status a REVERSED
    // 4. Registrar reversedAt
    return this.paymentsService.reversePayment(id);
  }
}
