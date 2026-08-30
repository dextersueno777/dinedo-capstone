import {
  IsString,
  Length,
} from 'class-validator';

export class CancelReservationDto {
  @IsString()
  @Length(1, 500)
  cancellationReason!: string;
}
