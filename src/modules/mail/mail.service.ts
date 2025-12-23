import { sendVerificationEmail } from './Dto/Send-VerificationEmail.dto';
import { SendGenericEmailDto } from './Dto/Send-GenericEmail.dto';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService, // Implementar Auditoria, logs y manejo de errores
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: Number(this.configService.get<string>('MAIL_PORT')),
      secure: this.configService.get<string>('MAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  private loadTemplate(templateName: string): string {
    const path = join(
      process.cwd(),
      'src',
      'modules',
      'mail',
      'templates',
      templateName,
    );

    return readFileSync(path, 'utf8');
  }

  async sendVerificationEmail(
    sendVerificationEmail: sendVerificationEmail,
  ): Promise<void> {
    const html = this.loadTemplate('verification.html')
      .replace('{{alias}}', sendVerificationEmail.alias)
      .replace('{{code}}', sendVerificationEmail.code)
      .replace(
        '{{expires}}',
        sendVerificationEmail.expiresInMinutes.toString(),
      );

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: sendVerificationEmail.to,
        subject: 'Verificación de cuenta – WasiGo',
        html,
      });
    } catch (error) {
      this.logger.error(
        `Error enviando correo de verificación a ${sendVerificationEmail.to}`,
        error.stack,
      );
    }
  }

  async sendGenericEmail(genericEmail: SendGenericEmailDto): Promise<void> {
    const html = this.loadTemplate('generic.html').replace(
      '{{message}}',
      genericEmail.message,
    );

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: genericEmail.to,
        subject: genericEmail.subject,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Error enviando correo genérico a ${genericEmail.to}`,
        error.stack,
      );
    }
  }
}
