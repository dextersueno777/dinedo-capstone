import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentProofsController } from './payment-proofs.controller';
import { PaymentProofsService } from './payment-proofs.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentProofsController],
  providers: [PaymentProofsService],
})
export class PaymentProofsModule {}
