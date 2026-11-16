import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ReservationStatus,
  UserRole,
} from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { AdminReservationsService } from './admin-reservations.service';
import { AssignReservationTablesDto } from './dto/assign-reservation-tables.dto';
import { ReviewReservationDto } from './dto/review-reservation.dto';
import { SetReservationDepositDto } from './dto/set-reservation-deposit.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';

@Controller('admin/reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class AdminReservationsController {
  constructor(
    private readonly adminReservationsService: AdminReservationsService,
  ) {}

  @Get()
  getReservations(@Query('status') status?: ReservationStatus) {
    return this.adminReservationsService.getReservations(status);
  }

  @Get(':id')
  getReservationById(@Param('id') id: string) {
    return this.adminReservationsService.getReservationById(id);
  }

  @Patch(':id/deposit-requirement')
  setDepositRequirement(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetReservationDepositDto,
  ) {
    return this.adminReservationsService.setDepositRequirement(
      user.id,
      id,
      dto,
    );
  }

  @Patch(':id/review')
  reviewReservation(
    @Param('id') id: string,
    @Body() dto: ReviewReservationDto,
  ) {
    return this.adminReservationsService.reviewReservation(id, dto);
  }

  @Patch(':id/tables')
  assignReservationTables(
    @Param('id') id: string,
    @Body() dto: AssignReservationTablesDto,
  ) {
    return this.adminReservationsService.assignReservationTables(id, dto);
  }

  @Patch(':id/status')
  updateReservationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.adminReservationsService.updateReservationStatus(id, dto);
  }
}
