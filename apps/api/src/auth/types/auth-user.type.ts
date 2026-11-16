import { UserRole, UserStatus } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  workerId: string | null;
  branchId: string | null;
  emailVerifiedAt: Date | null;
  firstName: string | null;
  lastName: string | null;
};
