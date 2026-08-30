import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { PaymentProofStatus } from '@prisma/client';

export class ReviewPaymentProofDto {
  @IsEnum(PaymentProofStatus)
  status!: PaymentProofStatus;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  reviewNotes?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  rejectionReason?: string;
}
