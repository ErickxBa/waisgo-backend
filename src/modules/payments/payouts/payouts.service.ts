import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { URLSearchParams } from 'url';

import { Payout } from '../Models/payout.entity';
import { Payment } from '../Models/payment.entity';
import { Driver } from '../../drivers/Models/driver.entity';
import { EstadoPayoutEnum, EstadoPagoEnum } from '../Enums';
import { AuditService } from '../../audit/audit.service';
import { AuditAction, AuditResult } from '../../audit/Enums';
import { ErrorMessages } from '../../common/constants/error-messages.constant';
import type { AuthContext } from '../../common/types';

type PaypalPayoutResponse = {
  batch_header?: {
    payout_batch_id?: string;
    batch_status?: string;
  };
};

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  private getPayPalCredentials() {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret =
      this.configService.get<string>('PAYPAL_CLIENT_SECRET') ||
      this.configService.get<string>('PAYPAL_SECRET');
    const baseUrl = this.configService.get<string>('PAYPAL_BASE_URL');

    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error('PayPal credentials are not configured');
    }

    return { clientId, clientSecret, baseUrl };
  }

  private async getPayPalAccessToken(): Promise<string> {
    const { clientId, clientSecret, baseUrl } = this.getPayPalCredentials();
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`PayPal token error: ${errorText}`);
      throw new BadRequestException(ErrorMessages.PAYMENTS.PAYMENT_FAILED);
    }

    const data = (await response.json()) as { access_token?: string };
    if (!data.access_token) {
      throw new BadRequestException(ErrorMessages.PAYMENTS.PAYMENT_FAILED);
    }

    return data.access_token;
  }

  private async paypalRequest<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const { baseUrl } = this.getPayPalCredentials();
    const accessToken = await this.getPayPalAccessToken();

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`PayPal request error: ${errorText}`);
      throw new BadRequestException(ErrorMessages.PAYMENTS.PAYMENT_FAILED);
    }

    return (await response.json()) as T;
  }

  async getMyPayouts(
    userId: string,
    status?: string,
  ): Promise<{ message: string; data?: Payout[] }> {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException(ErrorMessages.DRIVER.NOT_A_DRIVER);
    }

    const query = this.payoutRepository
      .createQueryBuilder('payout')
      .where('payout.driverId = :driverId', { driverId: driver.id })
      .orderBy('payout.createdAt', 'DESC');

    if (status) {
      if (!Object.values(EstadoPayoutEnum).includes(status as EstadoPayoutEnum)) {
        throw new BadRequestException(ErrorMessages.VALIDATION.INVALID_FORMAT('status'));
      }
      query.andWhere('payout.status = :status', { status });
    }

    const payouts = await query.getMany();

    return {
      message: ErrorMessages.PAYOUTS.PAYOUTS_LIST,
      data: payouts,
    };
  }

  async getPayoutById(
    userId: string,
    payoutId: string,
  ): Promise<{ message: string; data?: Payout }> {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException(ErrorMessages.DRIVER.NOT_A_DRIVER);
    }

    const payout = await this.payoutRepository.findOne({
      where: { id: payoutId, driverId: driver.id },
    });

    if (!payout) {
      throw new NotFoundException(ErrorMessages.PAYOUTS.PAYOUT_NOT_FOUND);
    }

    return {
      message: ErrorMessages.PAYOUTS.PAYOUT_DETAIL,
      data: payout,
    };
  }

  async generatePayouts(
    period: string,
    adminUserId?: string,
    context?: AuthContext,
  ): Promise<{ message: string; created?: number }> {
    const start = new Date(`${period}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(start.getUTCMonth() + 1);

    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('booking.route', 'route')
      .where('payment.status = :status', { status: EstadoPagoEnum.PAID })
      .andWhere('payment.payoutId IS NULL')
      .andWhere('payment.paidAt >= :start AND payment.paidAt < :end', {
        start,
        end,
      })
      .getMany();

    const grouped = new Map<string, { total: number; paymentIds: string[] }>();

    for (const payment of payments) {
      const driverId = payment.booking?.route?.driverId;
      if (!driverId) continue;

      const current = grouped.get(driverId) || { total: 0, paymentIds: [] };
      current.total += Number(payment.amount);
      current.paymentIds.push(payment.id);
      grouped.set(driverId, current);
    }

    let created = 0;

    await this.dataSource.transaction(async (manager) => {
      for (const [driverId, group] of grouped.entries()) {
        const payout = manager.create(Payout, {
          driverId,
          period,
          amount: Number(group.total.toFixed(2)),
          status: EstadoPayoutEnum.PENDING,
        });

        const savedPayout = await manager.save(payout);

        if (group.paymentIds.length > 0) {
          await manager.update(
            Payment,
            { id: In(group.paymentIds) },
            { payoutId: savedPayout.id },
          );
        }

        created += 1;
      }
    });

    if (adminUserId) {
      await this.auditService.logEvent({
        action: AuditAction.WITHDRAWAL_REQUESTED,
        userId: adminUserId,
        result: AuditResult.SUCCESS,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        metadata: { period, created },
      });
    }

    return {
      message: ErrorMessages.PAYOUTS.PAYOUTS_GENERATED,
      created,
    };
  }

  async executePaypalPayout(
    payoutId: string,
    adminUserId?: string,
    context?: AuthContext,
  ): Promise<{ message: string; paypalBatchId?: string }> {
    const payout = await this.payoutRepository.findOne({
      where: { id: payoutId },
      relations: ['driver'],
    });

    if (!payout) {
      throw new NotFoundException(ErrorMessages.PAYOUTS.PAYOUT_NOT_FOUND);
    }

    if (payout.status !== EstadoPayoutEnum.PENDING) {
      throw new BadRequestException(ErrorMessages.PAYOUTS.PAYOUT_NOT_PENDING);
    }

    if (Number(payout.amount) < 5) {
      throw new BadRequestException(ErrorMessages.PAYMENTS.MIN_WITHDRAWAL);
    }

    if (!payout.driver?.paypalEmail) {
      throw new BadRequestException(ErrorMessages.PAYMENTS.INVALID_PAYPAL_ACCOUNT);
    }

    try {
      const response = await this.paypalRequest<PaypalPayoutResponse>(
        'POST',
        '/v1/payments/payouts',
        {
          sender_batch_header: {
            sender_batch_id: `payout-${payout.id}-${Date.now()}`,
            email_subject: 'Tienes un nuevo payout',
          },
          items: [
            {
              recipient_type: 'EMAIL',
              receiver: payout.driver.paypalEmail,
              amount: {
                value: Number(payout.amount).toFixed(2),
                currency: 'USD',
              },
              note: 'Payout WasiGo',
              sender_item_id: payout.id,
            },
          ],
        },
      );

      payout.paypalBatchId = response.batch_header?.payout_batch_id ?? null;
      payout.attempts += 1;

      if (response.batch_header?.batch_status === 'SUCCESS') {
        payout.status = EstadoPayoutEnum.PAID;
        payout.paidAt = new Date();
      }

      await this.payoutRepository.save(payout);

      if (adminUserId) {
        await this.auditService.logEvent({
          action: AuditAction.WITHDRAWAL_COMPLETED,
          userId: adminUserId,
          result: AuditResult.SUCCESS,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: { payoutId: payout.id, paypalBatchId: payout.paypalBatchId },
        });
      }

      return {
        message: ErrorMessages.PAYOUTS.PAYOUT_SENT,
        paypalBatchId: payout.paypalBatchId ?? undefined,
      };
    } catch (error) {
      payout.attempts += 1;
      payout.status = EstadoPayoutEnum.FAILED;
      payout.lastError =
        error instanceof Error ? error.message : 'PayPal payout failed';
      await this.payoutRepository.save(payout);

      if (adminUserId) {
        await this.auditService.logEvent({
          action: AuditAction.WITHDRAWAL_FAILED,
          userId: adminUserId,
          result: AuditResult.FAILED,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: { payoutId: payout.id, error: payout.lastError },
        });
      }

      throw new BadRequestException(ErrorMessages.PAYMENTS.PAYMENT_FAILED);
    }
  }

  async failPayout(
    payoutId: string,
    reason?: string,
    adminUserId?: string,
    context?: AuthContext,
  ): Promise<{ message: string }> {
    const payout = await this.payoutRepository.findOne({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException(ErrorMessages.PAYOUTS.PAYOUT_NOT_FOUND);
    }

    payout.status = EstadoPayoutEnum.FAILED;
    payout.lastError = reason?.trim() || 'Marked as failed by admin';
    payout.attempts += 1;
    await this.payoutRepository.save(payout);

    if (adminUserId) {
      await this.auditService.logEvent({
        action: AuditAction.WITHDRAWAL_FAILED,
        userId: adminUserId,
        result: AuditResult.FAILED,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        metadata: { payoutId, reason: payout.lastError },
      });
    }

    return {
      message: ErrorMessages.PAYOUTS.PAYOUT_FAILED,
    };
  }

  async getAllPayouts(
    page?: number,
    limit?: number,
    status?: string,
    period?: string,
  ): Promise<{ message: string; data?: Payout[]; total?: number }> {
    const pageNumber = page ? Math.max(Number(page), 1) : 1;
    const pageSize = limit ? Math.min(Math.max(Number(limit), 1), 100) : 20;

    const query = this.payoutRepository
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.driver', 'driver')
      .orderBy('payout.createdAt', 'DESC')
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize);

    if (status) {
      if (!Object.values(EstadoPayoutEnum).includes(status as EstadoPayoutEnum)) {
        throw new BadRequestException(ErrorMessages.VALIDATION.INVALID_FORMAT('status'));
      }
      query.andWhere('payout.status = :status', { status });
    }

    if (period) {
      query.andWhere('payout.period = :period', { period });
    }

    const [payouts, total] = await query.getManyAndCount();

    return {
      message: ErrorMessages.PAYOUTS.PAYOUTS_LIST_ADMIN,
      data: payouts,
      total,
    };
  }
}
