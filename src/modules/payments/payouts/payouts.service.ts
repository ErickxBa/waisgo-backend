import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payout } from '../Models/payout.entity';
import { Payment } from '../Models/payment.entity';
import { EstadoPayoutEnum } from '../Enums';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
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
   * Obtener mis payouts (conductor)
   */
  async getMyPayouts(
    userId: string,
    status?: string,
  ): Promise<{ message: string; data?: Payout[] }> {
    // TODO:
    // 1. Obtener driver del userId
    // 2. Buscar payouts donde driverId = driver.id

    return {
      message: 'Historial de pagos al conductor.',
    };
  }

  /**
   * Obtener detalle de un payout
   */
  async getPayoutById(
    userId: string,
    payoutId: string,
  ): Promise<{ message: string; data?: Payout }> {
    // TODO:
    // 1. Buscar payout
    // 2. Validar que pertenece al conductor

    return {
      message: 'Detalle del payout.',
    };
  }

  /**
   * Generar payouts para un periodo
   */
  async generatePayouts(
    period: string,
  ): Promise<{ message: string; created?: number }> {
    // TODO:
    // 1. Buscar payments con status PAID del periodo sin payoutId
    // 2. Agrupar por conductor (booking -> route -> driver)
    // 3. Sumar montos por conductor
    // 4. Crear payout por conductor
    // 5. Asociar payments al payout creado

    return {
      message: 'Payouts generados para el periodo.',
    };
  }

  /**
   * Ejecutar payout por PayPal
   * - Llama a PayPal Payouts API
   */
  async executePaypalPayout(
    payoutId: string,
  ): Promise<{ message: string; paypalBatchId?: string }> {
    // TODO:
    // 1. Obtener payout y validar status PENDING
    // 2. Obtener PayPal email del conductor (driver.paypalEmail)
    // 3. Obtener access token de PayPal
    // 4. Llamar a PayPal Payouts API
    // 5. Guardar paypalBatchId
    // 6. Actualizar status a PAID si exitoso
    // 7. Incrementar attempts si falla

    return {
      message: 'Payout enviado por PayPal correctamente.',
    };
  }

  /**
   * Marcar payout como fallido
   */
  async failPayout(
    payoutId: string,
    reason?: string,
  ): Promise<{ message: string }> {
    // TODO:
    // 1. Buscar payout
    // 2. Actualizar status a FAILED
    // 3. Guardar lastError

    return {
      message: 'Payout marcado como fallido.',
    };
  }

  /**
   * Listado global de payouts
   */
  async getAllPayouts(
    page?: number,
    limit?: number,
    status?: string,
    period?: string,
  ): Promise<{ message: string; data?: Payout[]; total?: number }> {
    // TODO: Paginar con filtros

    return {
      message: 'Listado global de payouts.',
    };
  }
}
