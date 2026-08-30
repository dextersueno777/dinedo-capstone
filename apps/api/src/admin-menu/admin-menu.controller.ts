import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminMenuService } from './admin-menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@ApiTags('Admin Menu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/menu-items')
export class AdminMenuController {
  constructor(private readonly adminMenuService: AdminMenuService) {}

  @Post()
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.adminMenuService.createItem(dto);
  }

  @Patch(':id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.adminMenuService.updateItem(id, dto);
  }

  @Delete(':id')
  removeItem(@Param('id') id: string) {
    return this.adminMenuService.removeItem(id);
  }
}
