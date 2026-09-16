import { RefundStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class UpdateRefundStatusDto {
  @IsEnum(RefundStatus)
  status!: RefundStatus;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  adminNotes?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  gcashReferenceNumber?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  refundProofImageUrl?: string;
}
