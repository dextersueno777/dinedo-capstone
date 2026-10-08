import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ProofOfDeliveryType } from '@prisma/client';

export class CaptureProofOfDeliveryDto {
  @IsEnum(ProofOfDeliveryType)
  type!: ProofOfDeliveryType;

  @IsOptional()
  @IsString()
  @Length(1, 8_000_000, {
    message: 'Photo proof must be an image URL or uploaded image data.',
  })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 8_000_000, {
    message: 'Signature proof must be an image URL or uploaded image data.',
  })
  signatureUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
