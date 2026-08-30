import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { ProofOfDeliveryType } from '@prisma/client';

export class CaptureProofOfDeliveryDto {
  @IsEnum(ProofOfDeliveryType)
  type!: ProofOfDeliveryType;

  @IsOptional()
  @IsUrl({
    require_tld: false,
  })
  imageUrl?: string;

  @IsOptional()
  @IsUrl({
    require_tld: false,
  })
  signatureUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
