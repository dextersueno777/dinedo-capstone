import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class RespondDeliveryFeeDto {
  @IsBoolean()
  accept!: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
