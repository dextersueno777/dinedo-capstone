import {
  IsIn,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class ReviewPasswordRecoveryDto {
  @IsIn(['APPROVE', 'REJECT'])
  decision!: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  @Length(3, 500)
  reason?: string;
}
