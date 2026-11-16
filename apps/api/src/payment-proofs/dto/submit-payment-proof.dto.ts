import {
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
export class SubmitPaymentProofDto {
  @IsString()
  @Length(1, 8_000_000)
  @Matches(/^(https?:\/\/|data:image\/(png|jpeg|jpg|webp);base64,)/i, {
    message: 'Receipt proof must be an image URL or uploaded image data.',
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
