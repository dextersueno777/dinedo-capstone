import {
  IsIn,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class ReviewStaffApplicationDto {
  @IsIn(['APPROVE', 'REJECT'])
  action!: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  @Length(3, 500)
  rejectionReason?: string;
}
