import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  InventoryItemStatus,
  InventoryUnit,
} from '@prisma/client';

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  sku?: string;

  @IsOptional()
  @IsEnum(InventoryUnit)
  unit?: InventoryUnit;

  @IsOptional()
  @IsEnum(InventoryItemStatus)
  status?: InventoryItemStatus;

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
