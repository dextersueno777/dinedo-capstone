import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(32, 200)
  token!: string;

  @IsString()
  @Length(8, 72)
  newPassword!: string;
}
