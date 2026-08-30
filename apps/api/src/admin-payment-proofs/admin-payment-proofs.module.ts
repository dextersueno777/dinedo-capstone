import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminPaymentProofsController } from './admin-payment-proofs.controller';
import { AdminPaymentProofsService } from './admin-payment-proofs.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPaymentProofsController],
  providers: [AdminPaymentProofsService],
})
export class AdminPaymentProofsModule {}
