import {
  IsString,
  Length,
} from 'class-validator';

export class ReportDeliveryIssueDto {
  @IsString()
  @Length(1, 120)
  title!: string;

  @IsString()
  @Length(1, 1000)
  description!: string;
}
