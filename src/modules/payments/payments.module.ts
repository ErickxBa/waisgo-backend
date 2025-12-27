import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './Models/payment.entity';
import { Payout } from './Models/payout.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Payout])],
  providers: [PaymentsService],
  exports: [TypeOrmModule],
})
export class PaymentsModule {}
