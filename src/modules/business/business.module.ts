import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { BusinessUser } from './Models/business-user.entity';
import { UserProfile } from './Models/user-profile.entity';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { AuthUser } from '../auth/Models/auth-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessUser, UserProfile, AuthUser]),
    StorageModule,
    AuditModule,
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
