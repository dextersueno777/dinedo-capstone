import { Injectable, NotFoundException } from '@nestjs/common';
import { BranchStatus, MenuItemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async findCategories(branchCode: string) {
    const branch = await this.findActiveBranch(branchCode);

    return this.prisma.menuCategory.findMany({
      where: {
        branchId: branch.id,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
        isActive: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findItems(branchCode: string, categorySlug?: string) {
    const branch = await this.findActiveBranch(branchCode);

    const category = categorySlug
      ? await this.prisma.menuCategory.findFirst({
          where: {
            branchId: branch.id,
            slug: categorySlug.trim().toLowerCase(),
            isActive: true,
            deletedAt: null,
          },
        })
      : null;

    if (categorySlug && !category) {
      throw new NotFoundException('Menu category not found.');
    }

    return this.prisma.menuItem.findMany({
      where: {
        branchId: branch.id,
        categoryId: category?.id,
        deletedAt: null,
        status: {
          in: [MenuItemStatus.AVAILABLE, MenuItemStatus.SOLD_OUT],
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        status: true,
        isFeatured: true,
        sortOrder: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        optionGroups: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            type: true,
            isRequired: true,
            minSelect: true,
            maxSelect: true,
            sortOrder: true,
            options: {
              where: {
                isAvailable: true,
                deletedAt: null,
              },
              select: {
                id: true,
                name: true,
                priceDelta: true,
                sortOrder: true,
              },
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  private async findActiveBranch(branchCode: string) {
    const branch = await this.prisma.branch.findUnique({
      where: {
        code: branchCode.trim().toUpperCase(),
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!branch || branch.status !== BranchStatus.ACTIVE) {
      throw new NotFoundException('Branch not found.');
    }

    return branch;
  }
}
