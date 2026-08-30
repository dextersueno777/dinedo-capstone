import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAddressDto {
  @IsString()
  @Length(1, 80)
  label!: string;

  @IsString()
  @Length(1, 120)
  recipient!: string;

  @IsString()
  @Matches(/^09\d{9}$/)
  phoneNumber!: string;

  @IsString()
  @Length(1, 180)
  line1!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  barangay?: string;

  @IsString()
  @Length(1, 120)
  municipality!: string;

  @IsString()
  @Length(1, 120)
  province!: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 180)
  landmark?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
