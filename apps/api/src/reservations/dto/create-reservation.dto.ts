import {
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservationDto {
  @IsString()
  @Length(1, 30)
  branchCode!: string;

  @IsISO8601()
  reservedFor!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  guestCount!: number;

  @IsString()
  @Length(1, 120)
  customerName!: string;

  @IsString()
  @Length(7, 30)
  customerPhone!: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  downPaymentAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalEstimate?: number;
}
