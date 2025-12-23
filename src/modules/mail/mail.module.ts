import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  providers: [MailService],
  exports: [MailService],
  imports: [AuditModule],
})
export class MailModule {}
