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
  ReservationStatus,
  ServiceType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { RespondDeliveryFeeDto } from './dto/respond-delivery-fee.dto';
import { MapboxDirectionsService } from './mapbox-directions.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService, private readonly mapboxDirections: MapboxDirectionsService) {}

  async checkout(customerId: string, dto: CheckoutDto) {
    const branch = await this.findActiveBranch(dto.branchCode);

    this.validateTiming(dto);

    this.validateOrderingTime(branch, dto);

    const deliveryAddress = await this.validateServiceAndPayment(customerId, dto);

    const linkedReservation = await this.validateReservationLink(
      customerId,
      branch.id,
      dto,
    );

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
    const deliveryDistanceKm =
      dto.serviceType === ServiceType.DELIVERY && deliveryAddress
        ? await this.calculateRouteDistanceKm(branch, deliveryAddress)
        : 0;
    const deliveryFeeStatus = this.getDeliveryFeeStatus(
      branch,
      dto.serviceType,
      deliveryDistanceKm,
    );
    const totalAmount = subtotalAmount;

    const scheduledFor =
      linkedReservation?.reservedFor ??
      (dto.timingType === OrderTimingType.ADVANCE && dto.scheduledFor
        ? new Date(dto.scheduledFor)
        : null);

    const orderNumber = await this.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          branchId: branch.id,
          customerId,
          addressId: deliveryAddress?.id ?? null,
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
                (Number(cartItem.menuItem.price) +
                  cartItem.options.reduce(
                    (sum, option) => sum + Number(option.priceDelta) * option.quantity,
                    0,
                  )) *
                cartItem.quantity,
              specialNotes: cartItem.specialNotes,
              options: {
                create: cartItem.options.map((option) => ({
                  menuOptionId: option.menuOptionId,
                  optionGroupName: option.menuOption.optionGroup.name,
                  optionName: option.menuOption.name,
                  priceDelta: option.priceDelta,
                  quantity: option.quantity,
                })),
              },
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

      if (linkedReservation) {
        const linkResult = await tx.reservation.updateMany({
          where: {
            id: linkedReservation.id,
            linkedOrderId: null,
          },
          data: {
            linkedOrderId: createdOrder.id,
            totalEstimate: subtotalAmount,
          },
        });

        if (linkResult.count !== 1) {
          throw new BadRequestException(
            'This reservation already has a linked food order.',
          );
        }
      }

      if (dto.serviceType === ServiceType.DELIVERY) {
        await tx.delivery.create({
          data: {
            branchId: branch.id,
            orderId: createdOrder.id,
            status: DeliveryStatus.PENDING_ASSIGNMENT,
            codAmountToCollect:
              dto.paymentMethod === PaymentMethod.COD ? totalAmount : 0,
            deliveryFeeAmount: 0,
            routeDistanceKm: deliveryDistanceKm,
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
        paymentMethod: true,
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
          totalAmount: dto.accept
            ? Number(order.subtotalAmount) +
              Number(order.deliveryFeeAmount) +
              Number(order.additionalDeliveryFeeAmount)
            : Number(order.subtotalAmount) + Number(order.deliveryFeeAmount),
          cancelledAt: dto.accept ? undefined : new Date(),
          cancellationReason: dto.accept
            ? undefined
            : 'Customer rejected additional delivery fee.',
        },
      });

      if (dto.accept) {
        const acceptedTotal =
          Number(order.subtotalAmount) +
          Number(order.deliveryFeeAmount) +
          Number(order.additionalDeliveryFeeAmount);

        await tx.delivery.updateMany({
          where: {
            orderId: order.id,
            deletedAt: null,
          },
          data: {
            codAmountToCollect:
              order.paymentMethod === PaymentMethod.COD
                ? acceptedTotal
                : 0,
            deliveryFeeAmount:
              Number(order.deliveryFeeAmount) +
              Number(order.additionalDeliveryFeeAmount),
          },
        });
      }

      if (!dto.accept) {
        await tx.delivery.updateMany({
          where: {
            orderId: order.id,
            deletedAt: null,
          },
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

  private validateOrderingTime(
    branch: {
      settings: {
        timezone: string;
        orderingOpenTime: string;
        orderingCloseTime: string;
      } | null;
    },
    dto: CheckoutDto,
  ) {
    const timezone = branch.settings?.timezone ?? 'Asia/Manila';
    const openTime = branch.settings?.orderingOpenTime ?? '07:00';
    const closeTime = branch.settings?.orderingCloseTime ?? '22:00';

    const targetDate =
      dto.timingType === OrderTimingType.ADVANCE && dto.scheduledFor
        ? new Date(dto.scheduledFor)
        : new Date();

    const localParts = new Intl.DateTimeFormat('en-PH', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(targetDate);

    const hour = Number(localParts.find((part) => part.type === 'hour')?.value);
    const minute = Number(
      localParts.find((part) => part.type === 'minute')?.value,
    );

    const orderMinutes = hour * 60 + minute;
    const openMinutes = this.timeToMinutes(openTime);
    const closeMinutes = this.timeToMinutes(closeTime);

    if (orderMinutes < openMinutes || orderMinutes >= closeMinutes) {
      throw new BadRequestException(
        `Orders can only be placed within branch hours ${openTime}–${closeTime}.`,
      );
    }
  }

  private timeToMinutes(time: string) {
    const [hour, minute] = time.split(':').map(Number);

    return hour * 60 + minute;
  }

  private async findActiveBranch(branchCode: string) {
    const branch = await this.prisma.branch.findUnique({
      where: {
        code: branchCode.trim().toUpperCase(),
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        status: true,
        settings: {
          select: {
            timezone: true,
            orderingOpenTime: true,
            orderingCloseTime: true,
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

    if (dto.timingType === OrderTimingType.ADVANCE && dto.scheduledFor) {
      const scheduledFor = new Date(dto.scheduledFor);

      if (Number.isNaN(scheduledFor.getTime())) {
        throw new BadRequestException('Scheduled date and time is invalid.');
      }

      if (scheduledFor.getTime() <= Date.now()) {
        throw new BadRequestException(
          'Scheduled date and time must be in the future.',
        );
      }
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
          latitude: true,
          longitude: true,
        },
      });

      if (!address) {
        throw new NotFoundException('Address not found.');
      }

      return address;
    }

    if (dto.serviceType === ServiceType.TAKE_OUT) {
      if (
        dto.paymentMethod !== PaymentMethod.PAY_AT_COUNTER &&
        dto.paymentMethod !== PaymentMethod.GCASH_MANUAL
      ) {
        throw new BadRequestException(
          'Take-out orders only support pay at counter or manual GCash.',
        );
      }
    }

    if (dto.serviceType === ServiceType.DINE_IN) {
      if (
        dto.paymentMethod !== PaymentMethod.PAY_AFTER_EATING &&
        dto.paymentMethod !== PaymentMethod.GCASH_MANUAL
      ) {
        throw new BadRequestException(
          'Dine-in orders only support pay after eating or manual GCash.',
        );
      }
    }

    if (dto.addressId) {
      throw new BadRequestException(
        'Address is only required for delivery orders.',
      );
    }

    return null;
  }

  private async validateReservationLink(
    customerId: string,
    branchId: string,
    dto: CheckoutDto,
  ) {
    if (!dto.reservationId) {
      return null;
    }

    if (dto.timingType !== OrderTimingType.ADVANCE) {
      throw new BadRequestException(
        'A reservation can only be linked to an advance food order.',
      );
    }

    if (dto.serviceType !== ServiceType.DINE_IN) {
      throw new BadRequestException(
        'A table reservation can only be linked to a dine-in food order.',
      );
    }

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: dto.reservationId,
        customerId,
        branchId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        reservedFor: true,
        linkedOrderId: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    if (reservation.linkedOrderId) {
      throw new BadRequestException(
        'This reservation already has a linked food order.',
      );
    }

    if (
      reservation.status === ReservationStatus.REJECTED ||
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.COMPLETED ||
      reservation.status === ReservationStatus.NO_SHOW
    ) {
      throw new BadRequestException(
        'A food order cannot be linked to this reservation status.',
      );
    }

    if (!dto.scheduledFor) {
      throw new BadRequestException(
        'Scheduled date and time is required for a linked reservation order.',
      );
    }

    const scheduledFor = new Date(dto.scheduledFor);

    if (
      Math.abs(scheduledFor.getTime() - reservation.reservedFor.getTime()) >
      60_000
    ) {
      throw new BadRequestException(
        'The advance food order schedule must match the reservation schedule.',
      );
    }

    return reservation;
  }

  private async calculateRouteDistanceKm(
    branch: { latitude: unknown; longitude: unknown },
    address: { latitude: unknown; longitude: unknown },
  ) {
    if (
      branch.latitude == null ||
      branch.longitude == null ||
      address.latitude == null ||
      address.longitude == null
    ) {
      throw new BadRequestException(
        'Delivery location coordinates are incomplete.',
      );
    }

    const route = await this.mapboxDirections.getDrivingRoute(
      {
        latitude: Number(branch.latitude),
        longitude: Number(branch.longitude),
      },
      {
        latitude: Number(address.latitude),
        longitude: Number(address.longitude),
      },
    );

    return route.distanceKm;
  }

  private getDeliveryFeeStatus(
    branch: {
      settings: {
        normalDeliveryKm: { toString(): string };
      } | null;
    },
    serviceType: ServiceType,
    distanceKm: number,
  ) {
    if (serviceType !== ServiceType.DELIVERY) {
      return DeliveryFeeStatus.NOT_REQUIRED;
    }

    const normalKm = Number(branch.settings?.normalDeliveryKm ?? 1);

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
    options: Array<{
      priceDelta: { toString(): string };
      quantity: number;
    }>;
  }>) {
    return items.reduce((sum, item) => {
      const optionsTotal = item.options.reduce((optionSum, option) => {
        return optionSum + Number(option.priceDelta) * option.quantity;
      }, 0);

      return sum + (Number(item.menuItem.price) + optionsTotal) * item.quantity;
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
          options: {
            select: {
              id: true,
              optionGroupName: true,
              optionName: true,
              priceDelta: true,
              quantity: true,
            },
            orderBy: {
              id: 'asc',
            },
          },
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
