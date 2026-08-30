import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryUnit } from '@prisma/client';

export class CreateInventoryItemDto {
  @IsString()
  @Length(1, 30)
  branchCode!: string;

  @IsString()
  @Length(1, 120)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  sku?: string;

  @IsEnum(InventoryUnit)
  unit!: InventoryUnit;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  currentQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
