import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ReservationStatus } from '@prisma/client';

export class UpdateReservationStatusDto {
  @IsEnum(ReservationStatus)
  status!: ReservationStatus;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  adminNotes?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  cancellationReason?: string;
}
