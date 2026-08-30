import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BranchStatus, MenuItemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string, branchCode: string) {
    const branch = await this.findActiveBranch(branchCode);
    const cart = await this.findOrCreateCart(userId, branch.id);

    return this.getCartResponse(cart.id);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const branch = await this.findActiveBranch(dto.branchCode);
    const cart = await this.findOrCreateCart(userId, branch.id);

    const menuItem = await this.prisma.menuItem.findFirst({
      where: {
        id: dto.menuItemId,
        branchId: branch.id,
        deletedAt: null,
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found.');
    }

    if (menuItem.status !== MenuItemStatus.AVAILABLE) {
      throw new BadRequestException('Menu item is not available.');
    }

    const optionIds = dto.optionIds ?? [];

    const options = optionIds.length
      ? await this.prisma.menuOption.findMany({
          where: {
            id: {
              in: optionIds,
            },
            isAvailable: true,
            deletedAt: null,
            optionGroup: {
              menuItemId: menuItem.id,
              deletedAt: null,
            },
          },
        })
      : [];

    if (options.length !== optionIds.length) {
      throw new BadRequestException('One or more selected options are invalid.');
    }

    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        menuItemId: menuItem.id,
        quantity: dto.quantity,
        specialNotes: dto.specialNotes?.trim(),
        options: {
          create: options.map((option) => ({
            menuOptionId: option.id,
            priceDelta: option.priceDelta,
            quantity: 1,
          })),
        },
      },
    });

    return this.getCartResponse(cart.id);
  }

  async updateItem(userId: string, cartItemId: string, dto: UpdateCartItemDto) {
    const cartItem = await this.findOwnedCartItem(userId, cartItemId);

    await this.prisma.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        quantity: dto.quantity,
        specialNotes: dto.specialNotes?.trim(),
      },
    });

    return this.getCartResponse(cartItem.cartId);
  }

  async removeItem(userId: string, cartItemId: string) {
    const cartItem = await this.findOwnedCartItem(userId, cartItemId);

    await this.prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    return this.getCartResponse(cartItem.cartId);
  }

  async clearMine(userId: string, branchCode: string) {
    const branch = await this.findActiveBranch(branchCode);
    const cart = await this.findOrCreateCart(userId, branch.id);

    await this.prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return this.getCartResponse(cart.id);
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

  private async findOrCreateCart(userId: string, branchId: string) {
    return this.prisma.cart.upsert({
      where: {
        branchId_userId: {
          branchId,
          userId,
        },
      },
      update: {},
      create: {
        branchId,
        userId,
      },
      select: {
        id: true,
      },
    });
  }

  private async findOwnedCartItem(userId: string, cartItemId: string) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: {
          userId,
        },
      },
      select: {
        id: true,
        cartId: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found.');
    }

    return cartItem;
  }

  private async getCartResponse(cartId: string) {
    return this.prisma.cart.findUniqueOrThrow({
      where: {
        id: cartId,
      },
      select: {
        id: true,
        branchId: true,
        userId: true,
        items: {
          select: {
            id: true,
            quantity: true,
            specialNotes: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                status: true,
              },
            },
            options: {
              select: {
                id: true,
                quantity: true,
                priceDelta: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }
}
