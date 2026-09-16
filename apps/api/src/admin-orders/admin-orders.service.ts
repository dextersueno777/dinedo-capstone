import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryFeeStatus,
  UserStatus,
  UserRole,
  PaymentMethod,
  PaymentState,
  NotificationType,
  RefundMethod,
  DeliveryStatus,
  OrderStatus,
  Prisma,
  ServiceType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignRiderDto } from './dto/assign-rider.dto';
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
        customerId: true,
        branchId: true,
        paymentMethod: true,
        paymentState: true,
        totalAmount: true,
        refunds: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
          },
        },
        customerStrikes: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
          },
        },
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

      if (
        dto.status === OrderStatus.CANCELLED &&
        existingOrder.paymentMethod === PaymentMethod.GCASH_MANUAL &&
        (existingOrder.paymentState === PaymentState.PAID ||
          existingOrder.paymentState === PaymentState.APPROVED) &&
        existingOrder.refunds.length === 0
      ) {
        await tx.refund.create({
          data: {
            orderId,
            customerId: existingOrder.customerId,
            requestedById: adminId,
            method: RefundMethod.GCASH_MANUAL,
            amount: existingOrder.totalAmount,
            reason:
              dto.reason?.trim() ||
              'Paid GCash order was cancelled and needs refund review.',
            adminNotes:
              dto.notes?.trim() ||
              'Auto-created after admin cancelled paid GCash order.',
          },
        });
      }

      if (dto.status === OrderStatus.CANCELLED && dto.issueCustomerStrike) {
        const strikeReason =
          dto.strikeReason?.trim() ||
          dto.reason?.trim() ||
          'Customer violated order cancellation policy.';

        await tx.customerStrike.create({
          data: {
            customerId: existingOrder.customerId,
            orderId,
            issuedById: adminId,
            reason: strikeReason,
            notes: dto.notes?.trim(),
          },
        });

        const totalStrikes = await tx.customerStrike.count({
          where: {
            customerId: existingOrder.customerId,
            deletedAt: null,
          },
        });

        if (totalStrikes >= 3) {
          await tx.user.update({
            where: {
              id: existingOrder.customerId,
            },
            data: {
              status: UserStatus.BANNED,
            },
          });
        }
      }

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
            reason: dto.reason?.trim() || null,
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

  async assignRider(adminId: string, orderId: string, dto: AssignRiderDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: {
        id: true,
        branchId: true,
        serviceType: true,
        status: true,
        paymentMethod: true,
        totalAmount: true,
        deliveryFeeAmount: true,
        additionalDeliveryFeeAmount: true,
        address: {
          select: {
            recipient: true,
            phoneNumber: true,
            line1: true,
            barangay: true,
            municipality: true,
            province: true,
            landmark: true,
          },
        },
        delivery: { select: { id: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found.');

    if (order.serviceType !== ServiceType.DELIVERY) {
      throw new BadRequestException(
        'Rider assignment is only for delivery orders.',
      );
    }

    const rider = await this.prisma.user.findFirst({
      where: {
        id: dto.riderId,
        role: UserRole.RIDER,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        id: true,
        branchId: true,
        riderProfile: { select: { branchId: true } },
      },
    });

    if (!rider) throw new NotFoundException('Active rider not found.');

    const riderBranchId = rider.riderProfile?.branchId ?? rider.branchId;

    if (riderBranchId !== order.branchId) {
      throw new BadRequestException('Rider must belong to the same branch.');
    }

    const navigationAddress = order.address
      ? [
          order.address.line1,
          order.address.barangay,
          order.address.municipality,
          order.address.province,
          order.address.landmark,
        ]
          .filter(Boolean)
          .join(', ')
      : null;

    const customerContactSnapshot = order.address
      ? `${order.address.recipient} - ${order.address.phoneNumber}`
      : null;

    return this.prisma.$transaction(async (tx) => {
      const deliveryData = {
        riderId: rider.id,
        status: DeliveryStatus.ASSIGNED,
        assignedAt: new Date(),
        rejectionReason: null,
        navigationAddress,
        customerContactSnapshot,
        codAmountToCollect:
          order.paymentMethod === PaymentMethod.COD ? order.totalAmount : 0,
        deliveryFeeAmount:
          Number(order.deliveryFeeAmount) +
          Number(order.additionalDeliveryFeeAmount),
      };

      if (order.delivery?.id) {
        await tx.delivery.update({
          where: { id: order.delivery.id },
          data: deliveryData,
        });
      } else {
        await tx.delivery.create({
          data: {
            branchId: order.branchId,
            orderId: order.id,
            ...deliveryData,
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.ASSIGNED_TO_RIDER },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.ASSIGNED_TO_RIDER,
          changedById: adminId,
          notes: dto.notes?.trim() ?? 'Rider assigned by admin.',
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
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
