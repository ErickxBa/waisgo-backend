import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './Models/payment.entity';
import { Payout } from './Models/payout.entity';
import { PaymentsController } from './payments.controller';
import { PayoutsController } from './payouts/payouts.controller';
import { PayoutsService } from './payouts/payouts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Payout])],
  providers: [PaymentsService, PayoutsService],
  exports: [TypeOrmModule],
  controllers: [PaymentsController, PayoutsController],
})
export class PaymentsModule {}
