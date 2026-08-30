import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminReportsService } from './admin-reports.service';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get('dashboard-summary')
  getDashboardSummary(
    @Query('branchCode') branchCode?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminReportsService.getDashboardSummary(branchCode, from, to);
  }
}
