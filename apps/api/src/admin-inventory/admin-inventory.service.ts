import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BranchStatus,
  InventoryItemStatus,
  Prisma,
  StockMovementType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';

@Injectable()
export class AdminInventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getInventoryItems(
    branchCode?: string,
    status?: InventoryItemStatus,
  ) {
    const branch = branchCode
      ? await this.findBranchByCode(branchCode)
      : null;

    return this.prisma.inventoryItem.findMany({
      where: {
        branchId: branch?.id,
        status,
        deletedAt: null,
      },
      select: this.inventoryItemSelect(),
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getInventoryItemById(id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: this.inventoryItemSelect(),
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found.');
    }

    return item;
  }

  async createInventoryItem(adminId: string, dto: CreateInventoryItemDto) {
    const branch = await this.findBranchByCode(dto.branchCode);
    const currentQuantity = dto.currentQuantity ?? 0;

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          branchId: branch.id,
          name: dto.name.trim(),
          sku: dto.sku?.trim(),
          unit: dto.unit,
          status: InventoryItemStatus.ACTIVE,
          currentQuantity,
          reorderLevel: dto.reorderLevel ?? 0,
          notes: dto.notes?.trim(),
        },
        select: {
          id: true,
          branchId: true,
        },
      });

      if (currentQuantity > 0) {
        await tx.stockMovement.create({
          data: {
            branchId: branch.id,
            inventoryItemId: item.id,
            actorId: adminId,
            type: StockMovementType.INITIAL_STOCK,
            quantityChange: currentQuantity,
            quantityAfter: currentQuantity,
            reason: 'Initial stock',
            notes: 'Initial stock set during inventory item creation.',
          },
        });
      }

      return tx.inventoryItem.findUniqueOrThrow({
        where: {
          id: item.id,
        },
        select: this.inventoryItemSelect(),
      });
    });
  }

  async updateInventoryItem(id: string, dto: UpdateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found.');
    }

    return this.prisma.inventoryItem.update({
      where: {
        id,
      },
      data: {
        name: dto.name?.trim(),
        sku: dto.sku?.trim(),
        unit: dto.unit,
        status: dto.status,
        reorderLevel: dto.reorderLevel,
        notes: dto.notes?.trim(),
      },
      select: this.inventoryItemSelect(),
    });
  }

  async addStockMovement(
    adminId: string,
    inventoryItemId: string,
    dto: CreateStockMovementDto,
  ) {
    if (dto.quantityChange === 0) {
      throw new BadRequestException('Quantity change cannot be zero.');
    }

    const item = await this.prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        deletedAt: null,
      },
      select: {
        id: true,
        branchId: true,
        currentQuantity: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found.');
    }

    const currentQuantity = Number(item.currentQuantity);
    const quantityAfter = currentQuantity + dto.quantityChange;

    if (quantityAfter < 0) {
      throw new BadRequestException('Stock quantity cannot go below zero.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: {
          id: inventoryItemId,
        },
        data: {
          currentQuantity: quantityAfter,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          branchId: item.branchId,
          inventoryItemId,
          actorId: adminId,
          type: dto.type,
          quantityChange: dto.quantityChange,
          quantityAfter,
          reason: dto.reason?.trim(),
          notes: dto.notes?.trim(),
        },
        select: this.stockMovementSelect(),
      });

      return movement;
    });
  }

  async getStockMovements(inventoryItemId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found.');
    }

    return this.prisma.stockMovement.findMany({
      where: {
        inventoryItemId,
        deletedAt: null,
      },
      select: this.stockMovementSelect(),
      orderBy: {
        createdAt: 'desc',
      },
    });
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

  private inventoryItemSelect(): Prisma.InventoryItemSelect {
    return {
      id: true,
      name: true,
      sku: true,
      unit: true,
      status: true,
      currentQuantity: true,
      reorderLevel: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      branch: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    };
  }

  private stockMovementSelect(): Prisma.StockMovementSelect {
    return {
      id: true,
      type: true,
      quantityChange: true,
      quantityAfter: true,
      reason: true,
      notes: true,
      createdAt: true,
      inventoryItem: {
        select: {
          id: true,
          name: true,
          sku: true,
          unit: true,
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
