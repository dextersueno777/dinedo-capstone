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
import { PaymentProofsService } from './payment-proofs.service';

@Controller('orders/:orderId/payment-proofs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class PaymentProofsController {
  constructor(private readonly paymentProofsService: PaymentProofsService) {}

  @Post()
  submitProof(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body() dto: SubmitPaymentProofDto,
  ) {
    return this.paymentProofsService.submitProof(user.id, orderId, dto);
  }

  @Get()
  getMyOrderProofs(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentProofsService.getMyOrderProofs(user.id, orderId);
  }
}
