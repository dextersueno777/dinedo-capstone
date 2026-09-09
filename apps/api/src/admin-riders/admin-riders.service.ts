import { Injectable } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminRidersService {
  constructor(private readonly prisma: PrismaService) {}

  async getRiders(branchCode?: string) {
    const code = branchCode?.trim().toUpperCase();

    return this.prisma.user.findMany({
      where: {
        role: UserRole.RIDER,
        status: UserStatus.ACTIVE,
        deletedAt: null,
        OR: code
          ? [
              { branch: { code } },
              { riderProfile: { branch: { code } } },
            ]
          : undefined,
      },
      select: this.riderSelect(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private riderSelect(): Prisma.UserSelect {
    return {
      id: true,
      email: true,
      status: true,
      branch: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      profile: {
        select: {
          firstName: true,
          lastName: true,
          phoneNumber: true,
        },
      },
      riderProfile: {
        select: {
          availabilityStatus: true,
          vehicleType: true,
          plateNumber: true,
          branch: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    };
  }
}
