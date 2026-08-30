import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BranchStatus, MenuItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class AdminMenuService {
  constructor(private readonly prisma: PrismaService) {}

  async createItem(dto: CreateMenuItemDto) {
    const branch = await this.findActiveBranch(dto.branchCode);
    const category = await this.findActiveCategory(branch.id, dto.categorySlug);

    const slug = this.slugify(dto.slug ?? dto.name);

    try {
      return await this.prisma.menuItem.create({
        data: {
          branchId: branch.id,
          categoryId: category.id,
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim(),
          price: dto.price,
          status: dto.status ?? MenuItemStatus.AVAILABLE,
          isFeatured: dto.isFeatured ?? false,
          sortOrder: dto.sortOrder ?? 0,
        },
        select: this.menuItemSelect(),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Menu item slug already exists in this branch.');
      }

      throw error;
    }
  }

  async updateItem(id: string, dto: UpdateMenuItemDto) {
    const existingItem = await this.prisma.menuItem.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        branchId: true,
      },
    });

    if (!existingItem) {
      throw new NotFoundException('Menu item not found.');
    }

    const category = dto.categorySlug
      ? await this.findActiveCategory(existingItem.branchId, dto.categorySlug)
      : null;

    return this.prisma.menuItem.update({
      where: {
        id,
      },
      data: {
        categoryId: category?.id,
        name: dto.name?.trim(),
        slug: dto.slug ? this.slugify(dto.slug) : undefined,
        description: dto.description?.trim(),
        price: dto.price,
        status: dto.status,
        isFeatured: dto.isFeatured,
        sortOrder: dto.sortOrder,
      },
      select: this.menuItemSelect(),
    });
  }

  async removeItem(id: string) {
    const existingItem = await this.prisma.menuItem.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingItem) {
      throw new NotFoundException('Menu item not found.');
    }

    await this.prisma.menuItem.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        status: MenuItemStatus.HIDDEN,
      },
    });

    return {
      message: 'Menu item deleted successfully.',
    };
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

  private async findActiveCategory(branchId: string, categorySlug: string) {
    const category = await this.prisma.menuCategory.findFirst({
      where: {
        branchId,
        slug: categorySlug.trim().toLowerCase(),
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Menu category not found.');
    }

    return category;
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private menuItemSelect() {
    return {
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
          name: true,
          slug: true,
        },
      },
    };
  }
}
