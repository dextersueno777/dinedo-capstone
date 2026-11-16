import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { SecurityQuestionAnswerDto } from './security-question-answer.dto';

export class SetupSecurityQuestionsDto {
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionAnswerDto)
  securityQuestions!: SecurityQuestionAnswerDto[];
}
