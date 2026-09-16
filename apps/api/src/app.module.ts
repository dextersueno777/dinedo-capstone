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
import { AdminReservationsModule } from './admin-reservations/admin-reservations.module';
import { AdminInventoryModule } from './admin-inventory/admin-inventory.module';
import { AdminReportsModule } from './admin-reports/admin-reports.module';
import { AdminAuditLogsModule } from './admin-audit-logs/admin-audit-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminRidersModule } from './admin-riders/admin-riders.module';
import { AdminRefundsModule } from './admin-refunds/admin-refunds.module';

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
    AdminReservationsModule,
    AdminInventoryModule,
    AdminReportsModule,
    AdminAuditLogsModule,
    AdminRidersModule,
    AdminRefundsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
