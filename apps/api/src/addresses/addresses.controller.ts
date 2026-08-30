import {
  Body,
  Controller,
  Delete,
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
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.addressesService.findMine(user.id);
  }

  @Post()
  createMine(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) {
    return this.addressesService.createMine(user.id, dto);
  }

  @Patch(':id')
  updateMine(
    @CurrentUser() user: AuthUser,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.updateMine(user.id, addressId, dto);
  }

  @Delete(':id')
  removeMine(@CurrentUser() user: AuthUser, @Param('id') addressId: string) {
    return this.addressesService.removeMine(user.id, addressId);
  }
}
