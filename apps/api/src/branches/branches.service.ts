import { Injectable, NotFoundException } from '@nestjs/common';
import { BranchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.branch.findMany({
      where: {
        status: BranchStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        status: true,
        settings: {
          select: {
            timezone: true,
            orderingOpenTime: true,
            orderingCloseTime: true,
            normalDeliveryKm: true,
            reservationsEnabled: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findByCode(code: string) {
    const branch = await this.prisma.branch.findUnique({
      where: {
        code: code.trim().toUpperCase(),
      },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        status: true,
        settings: {
          select: {
            timezone: true,
            orderingOpenTime: true,
            orderingCloseTime: true,
            normalDeliveryKm: true,
            reservationsEnabled: true,
          },
        },
      },
    });

    if (!branch || branch.status !== BranchStatus.ACTIVE) {
      throw new NotFoundException('Branch not found.');
    }

    return branch;
  }
}
