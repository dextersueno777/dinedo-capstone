import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  InventoryItemStatus,
  UserRole,
} from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { AdminInventoryService } from './admin-inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';

@Controller('admin/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminInventoryController {
  constructor(private readonly adminInventoryService: AdminInventoryService) {}

  @Get()
  getInventoryItems(
    @Query('branchCode') branchCode?: string,
    @Query('status') status?: InventoryItemStatus,
  ) {
    return this.adminInventoryService.getInventoryItems(branchCode, status);
  }

  @Post()
  createInventoryItem(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateInventoryItemDto,
  ) {
    return this.adminInventoryService.createInventoryItem(user.id, dto);
  }

  @Get(':id')
  getInventoryItemById(@Param('id') id: string) {
    return this.adminInventoryService.getInventoryItemById(id);
  }

  @Patch(':id')
  updateInventoryItem(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.adminInventoryService.updateInventoryItem(id, dto);
  }

  @Get(':id/movements')
  getStockMovements(@Param('id') id: string) {
    return this.adminInventoryService.getStockMovements(id);
  }

  @Post(':id/movements')
  addStockMovement(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.adminInventoryService.addStockMovement(user.id, id, dto);
  }
}
