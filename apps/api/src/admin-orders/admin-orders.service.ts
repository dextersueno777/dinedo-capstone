import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryFeeStatus,
  OrderStatus,
  Prisma,
  ServiceType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SetDeliveryFeeDto } from './dto/set-delivery-fee.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrders() {
    return this.prisma.order.findMany({
      where: {
        deletedAt: null,
      },
      select: this.orderSelect(),
      orderBy: {
        createdAt: 'desc',
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
    adminId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
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

    if (dto.status === OrderStatus.CANCELLED) {
      timestampData.cancelledAt = new Date();
      timestampData.cancellationReason = dto.reason?.trim();
    }

    if (dto.status === OrderStatus.COMPLETED) {
      timestampData.completedAt = new Date();
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
          changedById: adminId,
          reason: dto.reason?.trim(),
          notes: dto.notes?.trim(),
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

  async setAdditionalDeliveryFee(
    orderId: string,
    dto: SetDeliveryFeeDto,
  ) {
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        deletedAt: null,
      },
      select: {
        id: true,
        serviceType: true,
        subtotalAmount: true,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found.');
    }

    if (existingOrder.serviceType !== ServiceType.DELIVERY) {
      throw new BadRequestException(
        'Additional delivery fee is only for delivery orders.',
      );
    }

    const additionalFee = dto.additionalDeliveryFeeAmount;
    const totalAmount = Number(existingOrder.subtotalAmount) + additionalFee;

    await this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        additionalDeliveryFeeAmount: additionalFee,
        totalAmount,
        deliveryFeeStatus: DeliveryFeeStatus.PENDING_CUSTOMER_ACCEPTANCE,
        adminNotes: dto.adminNotes?.trim(),
      },
    });

    return this.getOrderById(orderId);
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
      deliveryFeeAmount: true,
      additionalDeliveryFeeAmount: true,
      totalAmount: true,
      customerNotes: true,
      adminNotes: true,
      cancellationReason: true,
      preparationStartedAt: true,
      cancelledAt: true,
      completedAt: true,
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
      address: {
        select: {
          id: true,
          label: true,
          recipient: true,
          phoneNumber: true,
          line1: true,
          barangay: true,
          municipality: true,
          province: true,
          landmark: true,
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
          reason: true,
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
