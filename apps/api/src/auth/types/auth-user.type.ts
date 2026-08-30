import { UserRole, UserStatus } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  branchId: string | null;
  firstName: string | null;
  lastName: string | null;
};
