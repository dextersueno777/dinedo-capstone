import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateKitchenOrderStatusDto } from './dto/update-kitchen-order-status.dto';

@Injectable()
export class KitchenOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getQueue() {
    return this.prisma.order.findMany({
      where: {
        deletedAt: null,
        status: {
          in: [
            OrderStatus.APPROVED,
            OrderStatus.COOKING,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.READY_TO_SERVE,
          ],
        },
      },
      select: this.orderSelect(),
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        deletedAt: null,
      },
      select: this.orderSelect(),
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return order;
  }

  async updateStatus(
    kitchenUserId: string,
    orderId: string,
    dto: UpdateKitchenOrderStatusDto,
  ) {
    const allowedStatuses: OrderStatus[] = [
      OrderStatus.COOKING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.READY_TO_SERVE,
    ];

    if (!allowedStatuses.includes(dto.status)) {
      throw new BadRequestException(
        'Kitchen can only set COOKING, READY_FOR_PICKUP, or READY_TO_SERVE.',
      );
    }

    const existingOrder = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        customerId: true,
        branchId: true,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found.');
    }

    if (existingOrder.status === dto.status) {
      throw new BadRequestException('Order is already in this status.');
    }

    const timestampData: Prisma.OrderUpdateInput = {};

    if (dto.status === OrderStatus.COOKING) {
      timestampData.preparationStartedAt = new Date();
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: dto.status,
          ...timestampData,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: existingOrder.status,
          toStatus: dto.status,
          changedById: kitchenUserId,
          notes: dto.notes?.trim(),
        },
      });

      await tx.notification.create({
        data: {
          userId: existingOrder.customerId,
          branchId: existingOrder.branchId,
          orderId,
          type: NotificationType.ORDER_STATUS,
          title: `Order ${dto.status.replaceAll('_', ' ')}`,
          message: `Your order status was updated to ${dto.status.replaceAll('_', ' ')}.`,
          data: {
            fromStatus: existingOrder.status,
            toStatus: dto.status,
            notes: dto.notes?.trim() || null,
          },
        },
      });

      return tx.order.findUniqueOrThrow({
        where: {
          id: orderId,
        },
        select: this.orderSelect(),
      });
    });
  }

  private orderSelect(): Prisma.OrderSelect {
    return {
      id: true,
      orderNumber: true,
      serviceType: true,
      timingType: true,
      scheduledFor: true,
      status: true,
      paymentMethod: true,
      paymentState: true,
      deliveryFeeStatus: true,
      subtotalAmount: true,
      totalAmount: true,
      customerNotes: true,
      preparationStartedAt: true,
      createdAt: true,
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      customer: {
        select: {
          id: true,
          email: true,
        },
      },
      items: {
        select: {
          id: true,
          itemName: true,
          unitPrice: true,
          quantity: true,
          lineTotal: true,
          specialNotes: true,
        },
      },
      statusHistory: {
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          notes: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    };
  }
}
