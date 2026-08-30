import {
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitPaymentProofDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsUrl({
    require_tld: false,
  })
  proofImageUrl!: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  gcashReferenceNumber?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  payerName?: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  payerAccountLast4?: string;
}
