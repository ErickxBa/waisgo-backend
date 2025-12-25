import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class OtpService {
  private readonly OTP_TTL = 15 * 60; // 15 minutos
  private readonly MAX_ATTEMPTS = 3;
  private readonly MAX_RESENDS = 3;

  constructor(private readonly redisService: RedisService) {}

  generateOtp(): string {
    return randomInt(100000, 999999).toString();
  }

  async sendOtp(
    userId: string,
  ): Promise<{ code: string; expiresInMinutes: number }> {
    const resendKey = `otp:verify:resend:${userId}`;
    const otpKey = `otp:verify:${userId}`;
    const attemptsKey = `otp:verify:attempts:${userId}`;

    const rawResendCount = await this.redisService.get(resendKey);
    const resendCount = Number(rawResendCount) || 0;

    if (resendCount >= this.MAX_RESENDS) {
      throw new ForbiddenException('Límite de reenvíos alcanzado');
    }

    const otp = this.generateOtp();

    await this.redisService.saveOtpSession(
      otpKey,
      otp,
      this.OTP_TTL,
      attemptsKey,
      resendKey,
      resendCount,
    );

    return {
      code: otp,
      expiresInMinutes: Math.floor(this.OTP_TTL / 60),
    };
  }

  async validateOtp(userId: string, code: string): Promise<void> {
    const otpKey = `otp:verify:${userId}`;
    const attemptsKey = `otp:verify:attempts:${userId}`;

    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp) {
      throw new BadRequestException('OTP expirado o inválido');
    }

    if (storedOtp !== code) {
      const attempts = await this.redisService.incr(attemptsKey);

      if (attempts >= this.MAX_ATTEMPTS) {
        await this.redisService.del(otpKey);
        throw new ForbiddenException('Demasiados intentos fallidos');
      }

      throw new BadRequestException('OTP incorrecto');
    }

    await this.redisService.del(otpKey, attemptsKey);
  }
}
