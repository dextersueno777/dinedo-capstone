import { IsOptional, IsString, Length } from 'class-validator';

export class AssignRiderDto {
  @IsString()
  @Length(1, 80)
  riderId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
