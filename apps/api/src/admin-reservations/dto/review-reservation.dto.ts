import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ReservationStatus } from '@prisma/client';

export class ReviewReservationDto {
  @IsEnum(ReservationStatus)
  status!: ReservationStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tableIds?: string[];

  @IsOptional()
  @IsString()
  @Length(1, 500)
  adminNotes?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  rejectionReason?: string;
}
