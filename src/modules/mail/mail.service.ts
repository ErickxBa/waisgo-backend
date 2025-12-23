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
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: 'Verificación de cuenta – WasiGo',
        template: 'verification',
        context: {
          alias: options.alias,
          code: options.code,
          expires: options.expiresInMinutes,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error enviando correo de verificación a ${options.to}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error al enviar el correo de verificación',
      );
    }
  }

  async sendGenericEmail(options: SendGenericEmailDto): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: 'generic',
        context: {
          message: options.message,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error enviando correo genérico a ${options.to}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error al enviar el correo');
    }
  }
}
