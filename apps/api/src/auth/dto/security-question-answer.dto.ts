import { IsString, Length } from 'class-validator';

export class SecurityQuestionAnswerDto {
  @IsString()
  @Length(1, 64)
  questionKey!: string;

  @IsString()
  @Length(2, 120)
  answer!: string;
}
