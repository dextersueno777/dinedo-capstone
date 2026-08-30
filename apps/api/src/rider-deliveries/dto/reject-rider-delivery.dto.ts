import {
  IsString,
  Length,
} from 'class-validator';

export class RejectRiderDeliveryDto {
  @IsString()
  @Length(1, 500)
  reason!: string;
}
