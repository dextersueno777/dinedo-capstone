import { IsString, Length, Matches } from 'class-validator';

export class UpdateSuperadminContactNumberDto {
  @IsString()
  @Length(8, 72)
  currentPassword!: string;

  @IsString()
  @Matches(/^09\d{9}$/)
  newContactNumber!: string;
}
