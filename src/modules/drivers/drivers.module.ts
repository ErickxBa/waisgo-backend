import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { Driver } from './Models/driver.entity';
import { DriverDocument } from './Models/driver-document.entity';
import { Vehicle } from './Models/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, DriverDocument, Vehicle])],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [TypeOrmModule],
})
export class DriversModule {}
