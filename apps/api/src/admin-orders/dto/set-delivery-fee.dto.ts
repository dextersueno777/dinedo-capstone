import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SetDeliveryFeeDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  additionalDeliveryFeeAmount!: number;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  adminNotes?: string;
}
