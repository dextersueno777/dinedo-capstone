import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @Length(1, 300)
  specialNotes?: string;
}
