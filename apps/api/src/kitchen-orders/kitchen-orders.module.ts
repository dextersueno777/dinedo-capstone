import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { KitchenOrdersController } from './kitchen-orders.controller';
import { KitchenOrdersService } from './kitchen-orders.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [KitchenOrdersController],
  providers: [KitchenOrdersService],
})
export class KitchenOrdersModule {}
