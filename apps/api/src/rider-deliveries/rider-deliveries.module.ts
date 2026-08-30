import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RiderDeliveriesController } from './rider-deliveries.controller';
import { RiderDeliveriesService } from './rider-deliveries.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RiderDeliveriesController],
  providers: [RiderDeliveriesService],
})
export class RiderDeliveriesModule {}
