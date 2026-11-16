import { UserRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SwitchDemoRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
