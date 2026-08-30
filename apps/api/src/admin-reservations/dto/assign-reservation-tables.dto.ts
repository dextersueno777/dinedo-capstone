import {
  ArrayMinSize,
  IsArray,
  IsString,
} from 'class-validator';

export class AssignReservationTablesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tableIds!: string[];
}
