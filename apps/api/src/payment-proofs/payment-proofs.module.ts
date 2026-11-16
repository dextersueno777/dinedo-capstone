import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentProofsController } from './payment-proofs.controller';
import { ReservationDepositProofsController } from './reservation-deposit-proofs.controller';
import { PaymentProofsService } from './payment-proofs.service';
import { ReservationDepositProofsService } from './reservation-deposit-proofs.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentProofsController, ReservationDepositProofsController],
  providers: [PaymentProofsService, ReservationDepositProofsService],
})
export class PaymentProofsModule {}
