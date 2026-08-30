import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { DeliveryStatus } from '@prisma/client';

export class UpdateRiderDeliveryStatusDto {
  @IsEnum(DeliveryStatus)
  status!: DeliveryStatus;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
