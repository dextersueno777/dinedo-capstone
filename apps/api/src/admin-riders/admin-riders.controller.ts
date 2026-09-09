import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRidersService } from './admin-riders.service';

@ApiTags('Admin Riders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/riders')
export class AdminRidersController {
  constructor(private readonly adminRidersService: AdminRidersService) {}

  @Get()
  getRiders(@Query('branchCode') branchCode?: string) {
    return this.adminRidersService.getRiders(branchCode);
  }
}
