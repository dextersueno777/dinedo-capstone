import { IsString, Length } from 'class-validator';

export class GetCartDto {
  @IsString()
  @Length(1, 40)
  branchCode!: string;
}
