import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { RefundStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { AdminRefundsService } from './admin-refunds.service';
import { UpdateRefundStatusDto } from './dto/update-refund-status.dto';

@Controller('admin/refunds')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminRefundsController {
  constructor(private readonly adminRefundsService: AdminRefundsService) {}

  @Get()
  getRefunds(@Query('status') status?: RefundStatus) {
    return this.adminRefundsService.getRefunds(status);
  }

  @Get(':id')
  getRefundById(@Param('id') id: string) {
    return this.adminRefundsService.getRefundById(id);
  }

  @Patch(':id/status')
  updateRefundStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRefundStatusDto,
  ) {
    return this.adminRefundsService.updateRefundStatus(user.id, id, dto);
  }
}
