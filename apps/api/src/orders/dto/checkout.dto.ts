import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { OrderTimingType, PaymentMethod, ServiceType } from '@prisma/client';

export class CheckoutDto {
  @IsString()
  @Length(1, 40)
  branchCode!: string;

  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @IsEnum(OrderTimingType)
  timingType!: OrderTimingType;

  @IsOptional()
  @IsISO8601()
  scheduledFor?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  addressId?: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  reservationId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  customerNotes?: string;
}
