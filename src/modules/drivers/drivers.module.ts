import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { Driver } from './Models/driver.entity';
import { DriverDocument } from './Models/driver-document.entity';
import { Vehicle } from './Models/vehicle.entity';
import { UserProfile } from '../business/Models/user-profile.entity';
import { BusinessUser } from '../business/Models/business-user.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Driver,
      DriverDocument,
      Vehicle,
      UserProfile,
      BusinessUser,
    ]),
    AuditModule,
  ],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [TypeOrmModule],
})
export class DriversModule {}
