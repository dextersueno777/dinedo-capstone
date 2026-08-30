import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  @Length(1, 300)
  reason?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
