import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  createReservation(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.createReservation(user.id, dto);
  }

  @Get()
  getMyReservations(@CurrentUser() user: AuthUser) {
    return this.reservationsService.getMyReservations(user.id);
  }

  @Get(':id')
  getMyReservationById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.reservationsService.getMyReservationById(user.id, id);
  }

  @Patch(':id/cancel')
  cancelMyReservation(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CancelReservationDto,
  ) {
    return this.reservationsService.cancelMyReservation(user.id, id, dto);
  }
}
