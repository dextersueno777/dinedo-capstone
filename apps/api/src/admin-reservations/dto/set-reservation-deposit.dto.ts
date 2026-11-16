import { IsBoolean } from 'class-validator';

export class SetReservationDepositDto {
  @IsBoolean()
  depositRequired!: boolean;
}
