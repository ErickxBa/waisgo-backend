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
  ApiQuery,
} from '@nestjs/swagger';
import { Roles, User } from '../common/Decorators';
import { RolUsuarioEnum } from '../auth/Enum';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, CapturePaypalDto } from './Dto';
import type { JwtPayload, AuthContext } from '../common/types';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
  async createPayment(
    @User() user: JwtPayload,
    @Body() dto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    return this.paymentsService.createPayment(
      user.sub,
      dto,
      this.getAuthContext(req),
    );
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
    @Req() req: Request,
  ) {
    return this.paymentsService.createPaypalOrder(
      user.sub,
      id,
      this.getAuthContext(req),
    );
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
    @Req() req: Request,
  ) {
    // TODO:
    return this.paymentsService.capturePaypalOrder(
      user.sub,
      id,
      dto.paypalOrderId,
      this.getAuthContext(req),
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

  @Roles(RolUsuarioEnum.ADMIN)
  @Patch(':id/reverse')
  @ApiOperation({ summary: 'Revertir un pago' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Pago revertido.' })
  async reversePayment(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.paymentsService.reversePayment(
      id,
      user.sub,
      this.getAuthContext(req),
    );
  }
}
