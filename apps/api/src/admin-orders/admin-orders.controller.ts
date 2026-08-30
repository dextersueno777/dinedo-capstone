import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { AdminOrdersService } from './admin-orders.service';
import { SetDeliveryFeeDto } from './dto/set-delivery-fee.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Admin Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  getOrders() {
    return this.adminOrdersService.getOrders();
  }

  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.adminOrdersService.getOrderById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminOrdersService.updateStatus(user.id, id, dto);
  }

  @Patch(':id/delivery-fee')
  setDeliveryFee(@Param('id') id: string, @Body() dto: SetDeliveryFeeDto) {
    return this.adminOrdersService.setAdditionalDeliveryFee(id, dto);
  }
}
