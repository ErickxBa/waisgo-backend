import { SendVerificationEmailOptions } from './../mail/Dto/Send-VerificationEmail.dto';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { OtpService } from '../otp/otp.service';
import { MailService } from '../mail/mail.service';
import { EstadoVerificacionEnum } from '../auth/Enum/estado-ver.enum';
import { BusinessService } from '../business/business.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/Enums/audit-actions.enum';
import { AuditResult } from '../audit/Enums/audit-result.enum';
import { ErrorMessages } from '../common/constants/error-messages.constant';
import type { AuthContext } from '../common/types/auth-context.type';
import { validate as isUUID } from 'uuid';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly businessService: BusinessService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Valida que el userId sea un UUID válido
   */
  private validateUserId(userId: string): void {
    const validate = isUUID as unknown as (str: string) => boolean;

    if (!validate(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }
  }

  /**
   * Sanitiza el código OTP (elimina espacios)
   */
  private sanitizeCode(code: string): string {
    return code.trim();
  }

  /**
   * Valida el formato del código OTP (6 dígitos)
   */
  private validateCodeFormat(code: string): void {
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException(
        ErrorMessages.VERIFICATION.CODE_FORMAT_INVALID,
      );
    }
  }

  async sendVerification(userId: string, context?: AuthContext): Promise<void> {
    // Validar UUID antes de cualquier operación
    this.validateUserId(userId);

    this.logger.log(`Iniciando envío de verificación para usuario: ${userId}`);

    const user = await this.authService.findForVerification(userId);

    if (user.estadoVerificacion === EstadoVerificacionEnum.VERIFICADO) {
      this.logger.warn(`Usuario ${userId} ya está verificado`);
      throw new BadRequestException(
        ErrorMessages.VERIFICATION.ALREADY_VERIFIED,
      );
    }

    this.logger.log(`Generando OTP para usuario: ${userId}`);
    const otp = await this.otpService.sendOtp(user.id);

    this.logger.log(`OTP generado exitosamente. Obteniendo nombre para usuario: ${userId}`);
    const displayName = await this.businessService.getDisplayName(user.id);

    const mailOptions: SendVerificationEmailOptions = {
      to: user.email,
      alias: displayName,
      code: otp.code,
      expiresInMinutes: otp.expiresInMinutes,
    };

    this.logger.log(
      `Preparado para enviar correo de verificación a ${user.email} con código ${otp.code}`,
    );

    await this.mailService.sendVerificationEmail(mailOptions);

    // Auditar envío de código
    await this.auditService.logEvent({
      action: AuditAction.VERIFICATION_CODE_SENT,
      userId,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      result: AuditResult.SUCCESS,
      metadata: { email: user.email },
    });

    this.logger.log({
      message: 'Verification email sent successfully',
      userId,
      email: user.email,
      ip: context?.ip,
    });
  }

  async confirmVerification(
    userId: string,
    code: string,
    context?: AuthContext,
  ): Promise<void> {
    // Validar UUID antes de cualquier operación
    this.validateUserId(userId);

    // Sanitizar y validar código ANTES de consultar Redis
    const sanitizedCode = this.sanitizeCode(code);
    this.validateCodeFormat(sanitizedCode);

    try {
      await this.otpService.validateOtp(userId, sanitizedCode);
      await this.authService.verifyUser(userId);

      // Limpiar todos los datos de OTP después de verificación exitosa
      await this.otpService.invalidateOtp(userId);

      // Auditar verificación exitosa
      await this.auditService.logEvent({
        action: AuditAction.VERIFICATION_SUCCESS,
        userId,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        result: AuditResult.SUCCESS,
      });

      this.logger.log({
        message: 'User verified successfully',
        userId,
        ip: context?.ip,
      });
    } catch (error) {
      // Auditar verificación fallida
      await this.auditService.logEvent({
        action: AuditAction.VERIFICATION_FAILED,
        userId,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        result: AuditResult.FAILED,
        metadata: {
          reason: error instanceof Error ? error.message : 'unknown',
        },
      });

      throw error;
    }
  }

  /**
   * Versiones públicas para el flujo de registro
   * (reutiliza la lógica de los métodos autenticados)
   */

  async sendVerificationPublic(userId: string, context?: AuthContext): Promise<void> {
    return this.sendVerification(userId, context);
  }

  async confirmVerificationPublic(
    userId: string,
    code: string,
    context?: AuthContext,
  ): Promise<void> {
    return this.confirmVerification(userId, code, context);
  }
}
