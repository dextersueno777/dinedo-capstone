import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { SubmitPaymentProofDto } from './dto/submit-payment-proof.dto';
import { ReservationDepositProofsService } from './reservation-deposit-proofs.service';

@Controller('reservations/:reservationId/deposit-proofs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class ReservationDepositProofsController {
  constructor(
    private readonly service: ReservationDepositProofsService,
  ) {}

  @Post()
  submitProof(
    @CurrentUser() user: AuthUser,
    @Param('reservationId') reservationId: string,
    @Body() dto: SubmitPaymentProofDto,
  ) {
    return this.service.submitProof(user.id, reservationId, dto);
  }
  @Get()
  getMyProofs(
    @CurrentUser() user: AuthUser,
    @Param('reservationId') reservationId: string,
  ) {
    return this.service.getMyProofs(user.id, reservationId);
  }

}
