import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StockMovementType } from '@prisma/client';

export class CreateStockMovementDto {
  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @Type(() => Number)
  @IsNumber()
  quantityChange!: number;

  @IsOptional()
  @IsString()
  @Length(1, 250)
  reason?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
