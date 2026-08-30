import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { RejectRiderDeliveryDto } from './dto/reject-rider-delivery.dto';
import { ReportDeliveryIssueDto } from './dto/report-delivery-issue.dto';
import { UpdateRiderDeliveryStatusDto } from './dto/update-rider-delivery-status.dto';
import { RiderDeliveriesService } from './rider-deliveries.service';

@ApiTags('Rider Deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RIDER)
@Controller('rider/deliveries')
export class RiderDeliveriesController {
  constructor(private readonly riderDeliveriesService: RiderDeliveriesService) {}

  @Get()
  getMyDeliveries(@CurrentUser() user: AuthUser) {
    return this.riderDeliveriesService.getMyDeliveries(user.id);
  }

  @Get(':id')
  getMyDeliveryById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.riderDeliveriesService.getMyDeliveryById(user.id, id);
  }

  @Patch(':id/accept')
  acceptDelivery(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.riderDeliveriesService.acceptDelivery(user.id, id);
  }

  @Patch(':id/reject')
  rejectDelivery(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectRiderDeliveryDto,
  ) {
    return this.riderDeliveriesService.rejectDelivery(user.id, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRiderDeliveryStatusDto,
  ) {
    return this.riderDeliveriesService.updateStatus(user.id, id, dto);
  }

  @Post(':id/issues')
  reportIssue(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReportDeliveryIssueDto,
  ) {
    return this.riderDeliveriesService.reportIssue(user.id, id, dto);
  }
}
