import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { SecurityQuestionAnswerDto } from './security-question-answer.dto';

export class PasswordRecoveryQuestionsDto {
  @IsEmail()
  email!: string;
}

export class PasswordRecoveryRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(10, 500)
  reason!: string;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionAnswerDto)
  answers!: SecurityQuestionAnswerDto[];
}
