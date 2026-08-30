import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MenusService } from './menus.service';

@ApiTags('Menus')
@Controller('branches/:branchCode/menu')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('categories')
  findCategories(@Param('branchCode') branchCode: string) {
    return this.menusService.findCategories(branchCode);
  }

  @Get('items')
  findItems(
    @Param('branchCode') branchCode: string,
    @Query('category') categorySlug?: string,
  ) {
    return this.menusService.findItems(branchCode, categorySlug);
  }
}
