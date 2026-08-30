import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MenuItemStatus } from '@prisma/client';

export class CreateMenuItemDto {
  @IsString()
  @Length(1, 40)
  branchCode!: string;

  @IsString()
  @Length(1, 80)
  categorySlug!: string;

  @IsString()
  @Length(1, 120)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsEnum(MenuItemStatus)
  status?: MenuItemStatus;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}
