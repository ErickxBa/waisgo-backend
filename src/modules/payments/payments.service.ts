import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from './Models/payment.entity';
import { CreatePaymentDto } from './Dto';
import { EstadoPagoEnum, MetodoPagoEnum } from './Enums';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Obtener credenciales de PayPal
   */
  private getPayPalCredentials() {
    return {
      clientId: this.configService.get<string>('PAYPAL_CLIENT_ID'),
      clientSecret: this.configService.get<string>('PAYPAL_CLIENT_SECRET'),
      mode: this.configService.get<string>('PAYPAL_MODE', 'sandbox'),
    };
  }

  /**
   * Crear un pago
   */
  async createPayment(
    passengerId: string,
    dto: CreatePaymentDto,
  ): Promise<{ message: string; paymentId?: string }> {
    // TODO:
    // 1. Validar que el booking existe y pertenece al pasajero
    // 2. Validar que no existe ya un pago para ese booking
    // 3. Obtener monto del booking/ruta
    // 4. Crear payment con status PENDING

    return {
      message: 'Pago iniciado correctamente.',
    };
  }

  /**
   * Obtener mis pagos
   */
  async getMyPayments(
    passengerId: string,
    status?: string,
  ): Promise<{ message: string; data?: Payment[] }> {
    // TODO: Buscar pagos donde booking.passengerId = passengerId

    return {
      message: 'Listado de pagos del pasajero.',
    };
  }

  /**
   * Obtener detalle de un pago
   */
  async getPaymentById(
    passengerId: string,
    paymentId: string,
  ): Promise<{ message: string; data?: Payment }> {
    // TODO: Buscar y validar que pertenece al pasajero

    return {
      message: 'Detalle del pago.',
    };
  }

  /**
   * Crear orden de PayPal
   */
  async createPaypalOrder(
    passengerId: string,
    paymentId: string,
  ): Promise<{
    message: string;
    approvalUrl?: string;
    paypalOrderId?: string;
  }> {
    // TODO:
    // 1. Validar que el pago existe y pertenece al pasajero
    // 2. Validar que el método es PAYPAL
    // 3. Obtener access token de PayPal
    // 4. Crear orden en PayPal API
    // 5. Guardar paypalOrderId en el payment
    // 6. Retornar approvalUrl para redirect

    return {
      message: 'Orden PayPal creada correctamente.',
    };
  }

  /**
   * Capturar pago de PayPal
   * ⚠️ SIEMPRE validar con PayPal API
   */
  async capturePaypalOrder(
    passengerId: string,
    paymentId: string,
    paypalOrderId: string,
  ): Promise<{ message: string }> {
    // TODO:
    // 1. Validar que el pago existe y pertenece al pasajero
    // 2. Validar que el paypalOrderId coincide
    // 3. Llamar a PayPal API para capturar
    // 4. Validar respuesta (status = COMPLETED)
    // 5. Actualizar payment: status = PAID, paidAt = now, paypalCaptureId
    // 6. ⚠️ NUNCA confiar en el frontend, siempre validar con PayPal

    return {
      message: 'Pago PayPal capturado correctamente.',
    };
  }

  /**
   * Obtener pagos recibidos (conductor)
   */
  async getDriverPayments(
    driverId: string,
    status?: string,
  ): Promise<{ message: string; data?: Payment[] }> {
    // TODO:
    // 1. Obtener rutas del conductor
    // 2. Obtener bookings de esas rutas
    // 3. Obtener pagos de esos bookings

    return {
      message: 'Pagos recibidos por el conductor.',
    };
  }

  /**
   * Listado global de pagos (admin)
   */
  async getAllPayments(
    page?: number,
    limit?: number,
    status?: string,
  ): Promise<{ message: string; data?: Payment[]; total?: number }> {
    // TODO: Paginar todos los pagos con filtros

    return {
      message: 'Listado global de pagos.',
    };
  }

  /**
   * Revertir un pago
   */
  async reversePayment(paymentId: string): Promise<{ message: string }> {
    // TODO:
    // 1. Validar que el pago está en status PAID
    // 2. Si es PayPal, llamar a refund API
    // 3. Actualizar status a REVERSED
    // 4. Registrar reversedAt

    return {
      message: 'Pago revertido correctamente.',
    };
  }
}
