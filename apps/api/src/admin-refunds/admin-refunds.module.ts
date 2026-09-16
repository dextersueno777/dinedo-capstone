import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminRefundsController } from './admin-refunds.controller';
import { AdminRefundsService } from './admin-refunds.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminRefundsController],
  providers: [AdminRefundsService],
})
export class AdminRefundsModule {}
