import { SendResetPasswordOptions } from './Dto/Send-ResetPassword.dto';
import { SendVerificationEmailOptions } from './Dto/Send-VerificationEmail.dto';
import { SendGenericEmailDto } from './Dto/Send-GenericEmail.dto';
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly auditService: AuditService,
  ) {}

  async sendVerificationEmail(
    options: SendVerificationEmailOptions,
  ): Promise<void> {
    await this.send({
      to: options.to,
      subject: 'Verificación de cuenta – WasiGo',
      template: 'verification',
      context: {
        alias: options.alias,
        code: options.code,
        expires: options.expiresInMinutes,
      },
    });
  }

  async sendResetPasswordEmail(
    options: SendResetPasswordOptions,
  ): Promise<void> {
    await this.send({
      to: options.to,
      subject: 'Restablecer contraseña – WasiGo',
      template: 'reset-password',
      context: {
        name: options.name || 'Usuario',
        resetUrl: options.resetUrl,
      },
    });
  }

  async sendGenericEmail(options: SendGenericEmailDto): Promise<void> {
    await this.send({
      to: options.to,
      subject: options.subject,
      template: 'generic',
      context: {
        message: options.message,
      },
    });
  }

  private async send(params: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, any>;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: params.to,
        subject: params.subject,
        template: params.template,
        context: params.context,
      });

      this.logger.log(`Correo '${params.template}' enviado a ${params.to}`);
    } catch (error) {
      this.logger.error(
        `Error enviando correo '${params.template}' a ${params.to}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Error al enviar el correo electrónico. Por favor intente más tarde.',
      );
    }
  }
}
