import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { MenusModule } from './menus/menus.module';
import { AddressesModule } from './addresses/addresses.module';
import { CartModule } from './cart/cart.module';
import { AdminMenuModule } from './admin-menu/admin-menu.module';
import { OrdersModule } from './orders/orders.module';
import { AdminOrdersModule } from './admin-orders/admin-orders.module';
import { KitchenOrdersModule } from './kitchen-orders/kitchen-orders.module';
import { RiderDeliveriesModule } from './rider-deliveries/rider-deliveries.module';
import { PaymentProofsModule } from './payment-proofs/payment-proofs.module';
import { AdminPaymentProofsModule } from './admin-payment-proofs/admin-payment-proofs.module';
import { ReservationsModule } from './reservations/reservations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    PrismaModule,
    AuthModule,
    BranchesModule,
    MenusModule,
    AddressesModule,
    CartModule,
    AdminMenuModule,
    OrdersModule,
    AdminOrdersModule,
    KitchenOrdersModule,
    RiderDeliveriesModule,
    PaymentProofsModule,
    AdminPaymentProofsModule,
    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
