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
import { KitchenOrdersService } from './kitchen-orders.service';
import { UpdateKitchenOrderStatusDto } from './dto/update-kitchen-order-status.dto';

@ApiTags('Kitchen Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.KITCHEN)
@Controller('kitchen/orders')
export class KitchenOrdersController {
  constructor(private readonly kitchenOrdersService: KitchenOrdersService) {}

  @Get()
  getQueue() {
    return this.kitchenOrdersService.getQueue();
  }

  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.kitchenOrdersService.getOrderById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateKitchenOrderStatusDto,
  ) {
    return this.kitchenOrdersService.updateStatus(user.id, id, dto);
  }
}
