import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BranchStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(filters: {
    branchCode?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
    from?: string;
    to?: string;
  }) {
    const branch = filters.branchCode
      ? await this.findBranchByCode(filters.branchCode)
      : null;

    return this.prisma.auditLog.findMany({
      where: {
        branchId: branch?.id,
        actorId: filters.actorId,
        action: filters.action,
        entityType: filters.entityType,
        entityId: filters.entityId,
        createdAt: this.buildDateFilter(filters.from, filters.to),
      },
      select: this.auditLogSelect(),
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }

  async getAuditLogById(id: string) {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: {
        id,
      },
      select: this.auditLogSelect(),
    });

    if (!auditLog) {
      throw new NotFoundException('Audit log not found.');
    }

    return auditLog;
  }

  private async findBranchByCode(branchCode: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        code: branchCode.trim().toUpperCase(),
        status: BranchStatus.ACTIVE,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }

    return branch;
  }

  private buildDateFilter(from?: string, to?: string) {
    if (!from && !to) {
      return undefined;
    }

    const filter: Prisma.DateTimeFilter = {};

    if (from) {
      const fromDate = new Date(from);

      if (Number.isNaN(fromDate.getTime())) {
        throw new BadRequestException('Invalid from date.');
      }

      filter.gte = fromDate;
    }

    if (to) {
      const toDate = new Date(to);

      if (Number.isNaN(toDate.getTime())) {
        throw new BadRequestException('Invalid to date.');
      }

      filter.lte = toDate;
    }

    if (filter.gte && filter.lte && filter.gte > filter.lte) {
      throw new BadRequestException('From date must be before to date.');
    }

    return filter;
  }

  private auditLogSelect(): Prisma.AuditLogSelect {
    return {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      description: true,
      metadata: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      branch: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      actor: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    };
  }
}
