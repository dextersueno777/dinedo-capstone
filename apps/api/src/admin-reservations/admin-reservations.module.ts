import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminReservationsController } from './admin-reservations.controller';
import { AdminReservationsService } from './admin-reservations.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminReservationsController],
  providers: [AdminReservationsService],
})
export class AdminReservationsModule {}
