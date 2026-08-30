import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class AddCartItemDto {
  @IsString()
  @Length(1, 40)
  branchCode!: string;

  @IsString()
  @Length(1, 80)
  menuItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  @Length(1, 300)
  specialNotes?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  optionIds?: string[];
}
