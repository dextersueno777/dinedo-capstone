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
  PaymentProofStatus,
  UserRole,
} from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { ReviewPaymentProofDto } from './dto/review-payment-proof.dto';
import { AdminPaymentProofsService } from './admin-payment-proofs.service';

@Controller('admin/payment-proofs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPaymentProofsController {
  constructor(
    private readonly adminPaymentProofsService: AdminPaymentProofsService,
  ) {}

  @Get()
  getPaymentProofs(@Query('status') status?: PaymentProofStatus) {
    return this.adminPaymentProofsService.getPaymentProofs(status);
  }

  @Get(':id')
  getPaymentProofById(@Param('id') id: string) {
    return this.adminPaymentProofsService.getPaymentProofById(id);
  }

  @Patch(':id/review')
  reviewPaymentProof(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewPaymentProofDto,
  ) {
    return this.adminPaymentProofsService.reviewPaymentProof(user.id, id, dto);
  }
}
