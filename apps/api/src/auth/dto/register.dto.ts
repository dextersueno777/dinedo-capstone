import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { SecurityQuestionAnswerDto } from './security-question-answer.dto';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 72)
  password!: string;

  @IsString()
  @Length(1, 80)
  firstName!: string;

  @IsString()
  @Length(1, 80)
  lastName!: string;

  @IsString()
  @Matches(/^09\d{9}$/)
  phoneNumber!: string;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionAnswerDto)
  securityQuestions!: SecurityQuestionAnswerDto[];
}
