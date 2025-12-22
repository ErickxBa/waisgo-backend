import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './Models/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async logEvent(params: {
    action: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    result: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  }) {
    const log = this.auditRepo.create(params);
    await this.auditRepo.save(log);
  }
}
