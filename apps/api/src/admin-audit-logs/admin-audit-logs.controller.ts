import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminAuditLogsService } from './admin-audit-logs.service';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAuditLogsController {
  constructor(private readonly adminAuditLogsService: AdminAuditLogsService) {}

  @Get()
  getAuditLogs(
    @Query('branchCode') branchCode?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminAuditLogsService.getAuditLogs({
      branchCode,
      action,
      entityType,
      entityId,
      actorId,
      from,
      to,
    });
  }

  @Get(':id')
  getAuditLogById(@Param('id') id: string) {
    return this.adminAuditLogsService.getAuditLogById(id);
  }
}
