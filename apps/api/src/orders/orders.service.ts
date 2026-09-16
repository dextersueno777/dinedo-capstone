import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BranchStatus,
  DeliveryFeeStatus,
  DeliveryStatus,
  MenuItemStatus,
  OrderStatus,
  OrderTimingType,
  PaymentMethod,
  PaymentState,
  ServiceType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { RespondDeliveryFeeDto } from './dto/respond-delivery-fee.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(customerId: string, dto: CheckoutDto) {
    const branch = await this.findActiveBranch(dto.branchCode);

    this.validateTiming(dto);

    const addressId = await this.validateServiceAndPayment(customerId, dto);

    const cart = await this.prisma.cart.findUnique({
      where: {
        branchId_userId: {
          branchId: branch.id,
          userId: customerId,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
            options: {
              include: {
                menuOption: {
                  include: {
                    optionGroup: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty.');
    }

    for (const item of cart.items) {
      if (item.menuItem.status !== MenuItemStatus.AVAILABLE) {
        throw new BadRequestException(
          `${item.menuItem.name} is no longer available.`,
        );
      }
    }

    const subtotalAmount = this.calculateSubtotal(cart.items);
    const deliveryFeeStatus = this.getDeliveryFeeStatus(branch, dto);
    const totalAmount = subtotalAmount;

    const scheduledFor =
      dto.timingType === OrderTimingType.ADVANCE && dto.scheduledFor
        ? new Date(dto.scheduledFor)
        : null;

    const orderNumber = await this.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          branchId: branch.id,
          customerId,
          addressId,
          serviceType: dto.serviceType,
          timingType: dto.timingType,
          scheduledFor,
          status: OrderStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          paymentState: PaymentState.UNPAID,
          deliveryFeeStatus,
          subtotalAmount,
          totalAmount,
          customerNotes: dto.customerNotes?.trim(),
          items: {
            create: cart.items.map((cartItem) => ({
              menuItemId: cartItem.menuItemId,
              itemName: cartItem.menuItem.name,
              unitPrice: cartItem.menuItem.price,
              quantity: cartItem.quantity,
              lineTotal:
                Number(cartItem.menuItem.price) * cartItem.quantity,
              specialNotes: cartItem.specialNotes,
            })),
          },
          statusHistory: {
            create: {
              toStatus: OrderStatus.PENDING,
              changedById: customerId,
              notes: 'Order submitted by customer checkout.',
            },
          },
        },
      });

      if (dto.serviceType === ServiceType.DELIVERY) {
        await tx.delivery.create({
          data: {
            branchId: branch.id,
            orderId: createdOrder.id,
            status: DeliveryStatus.PENDING_ASSIGNMENT,
            codAmountToCollect:
              dto.paymentMethod === PaymentMethod.COD ? totalAmount : 0,
            deliveryFeeAmount: 0,
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return createdOrder;
    });

    return this.getOrderById(customerId, order.id);
  }

  async cancelMyOrder(
    customerId: string,
    orderId: string,
    dto: CancelOrderDto,
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        serviceType: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Only pending orders can be cancelled by the customer.',
      );
    }

    const reason =
      dto.cancellationReason?.trim() || 'Customer cancelled pending order.';

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      });

      if (order.serviceType === ServiceType.DELIVERY) {
        await tx.delivery.updateMany({
          where: { orderId: order.id },
          data: {
            status: DeliveryStatus.CANCELLED,
            cancelledAt: new Date(),
          },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.CANCELLED,
          changedById: customerId,
          notes: reason,
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        select: this.orderSelect(),
      });
    });
  }

  async respondDeliveryFee(
    customerId: string,
    orderId: string,
    dto: RespondDeliveryFeeDto,
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        serviceType: true,
        deliveryFeeStatus: true,
        subtotalAmount: true,
        deliveryFeeAmount: true,
        additionalDeliveryFeeAmount: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.serviceType !== ServiceType.DELIVERY) {
      throw new BadRequestException('Delivery fee response is only for delivery orders.');
    }

    if (order.deliveryFeeStatus !== DeliveryFeeStatus.PENDING_CUSTOMER_ACCEPTANCE) {
      throw new BadRequestException('This order is not waiting for customer fee approval.');
    }

    const nextFeeStatus = dto.accept
      ? DeliveryFeeStatus.ACCEPTED
      : DeliveryFeeStatus.REJECTED;

    const nextOrderStatus = dto.accept ? order.status : OrderStatus.CANCELLED;

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          deliveryFeeStatus: nextFeeStatus,
          status: nextOrderStatus,
          totalAmount:
            Number(order.subtotalAmount) +
            Number(order.deliveryFeeAmount) +
            Number(order.additionalDeliveryFeeAmount),
          cancelledAt: dto.accept ? undefined : new Date(),
          cancellationReason: dto.accept
            ? undefined
            : 'Customer rejected additional delivery fee.',
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: nextOrderStatus,
          changedById: customerId,
          notes: dto.accept
            ? (dto.notes?.trim() || 'Customer accepted additional delivery fee.')
            : (dto.notes?.trim() || 'Customer rejected additional delivery fee.'),
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        select: this.orderSelect(),
      });
    });
  }

  async getMyOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: {
        customerId,
        deletedAt: null,
      },
      select: this.orderSelect(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrderById(customerId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
        deletedAt: null,
      },
      select: this.orderSelect(),
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return order;
  }

  private async findActiveBranch(branchCode: string) {
    const branch = await this.prisma.branch.findUnique({
      where: {
        code: branchCode.trim().toUpperCase(),
      },
      select: {
        id: true,
        status: true,
        settings: {
          select: {
            normalDeliveryKm: true,
          },
        },
      },
    });

    if (!branch || branch.status !== BranchStatus.ACTIVE) {
      throw new NotFoundException('Branch not found.');
    }

    return branch;
  }

  private validateTiming(dto: CheckoutDto) {
    if (dto.timingType === OrderTimingType.ADVANCE && !dto.scheduledFor) {
      throw new BadRequestException('Scheduled date and time is required.');
    }

    if (dto.timingType === OrderTimingType.IMMEDIATE && dto.scheduledFor) {
      throw new BadRequestException(
        'Scheduled date is only allowed for advance orders.',
      );
    }
  }

  private async validateServiceAndPayment(customerId: string, dto: CheckoutDto) {
    if (dto.serviceType === ServiceType.DELIVERY) {
      if (!dto.addressId) {
        throw new BadRequestException('Delivery address is required.');
      }

      if (
        dto.paymentMethod !== PaymentMethod.COD &&
        dto.paymentMethod !== PaymentMethod.GCASH_MANUAL
      ) {
        throw new BadRequestException(
          'Delivery orders only support COD or manual GCash.',
        );
      }

      const address = await this.prisma.address.findFirst({
        where: {
          id: dto.addressId,
          userId: customerId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!address) {
        throw new NotFoundException('Address not found.');
      }

      return address.id;
    }

    if (dto.addressId) {
      throw new BadRequestException(
        'Address is only required for delivery orders.',
      );
    }

    return null;
  }

  private getDeliveryFeeStatus(
    branch: {
      settings: {
        normalDeliveryKm: { toString(): string };
      } | null;
    },
    dto: CheckoutDto,
  ) {
    if (dto.serviceType !== ServiceType.DELIVERY) {
      return DeliveryFeeStatus.NOT_REQUIRED;
    }

    const normalKm = Number(branch.settings?.normalDeliveryKm ?? 1);
    const distanceKm = dto.deliveryDistanceKm ?? 0;

    if (distanceKm > normalKm) {
      return DeliveryFeeStatus.PENDING_STAFF_REVIEW;
    }

    return DeliveryFeeStatus.NOT_REQUIRED;
  }

  private calculateSubtotal(items: Array<{
    quantity: number;
    menuItem: {
      price: { toString(): string };
    };
  }>) {
    return items.reduce((sum, item) => {
      return sum + Number(item.menuItem.price) * item.quantity;
    }, 0);
  }

  private async generateOrderNumber() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);

    return `DO-${yyyy}${mm}${dd}-${random}`;
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
      createdAt: true,
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
