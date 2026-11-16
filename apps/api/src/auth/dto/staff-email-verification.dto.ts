import { IsEmail, Matches } from 'class-validator';

export class SendStaffEmailVerificationDto {
  @IsEmail()
  email!: string;
}

export class VerifyStaffEmailDto {
  @IsEmail()
  email!: string;

  @Matches(/^\d{6}$/)
  code!: string;
}
