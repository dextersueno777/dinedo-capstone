import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BranchStatus,
  DeliveryStatus,
  InventoryItemStatus,
  OrderStatus,
  PaymentProofStatus,
  PaymentState,
  Prisma,
  ReservationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(
    branchCode?: string,
    from?: string,
    to?: string,
  ) {
    const branch = branchCode
      ? await this.findBranchByCode(branchCode)
      : null;

    const dateFilter = this.buildDateFilter(from, to);

    const branchId = branch?.id;

    const [
      orders,
      reservations,
      deliveries,
      paymentProofs,
      inventoryItems,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          branchId,
          createdAt: dateFilter,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          paymentState: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
      this.prisma.reservation.findMany({
        where: {
          branchId,
          createdAt: dateFilter,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          guestCount: true,
          createdAt: true,
        },
      }),
      this.prisma.delivery.findMany({
        where: {
          branchId,
          createdAt: dateFilter,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          codAmountToCollect: true,
          deliveryFeeAmount: true,
          createdAt: true,
        },
      }),
      this.prisma.paymentProof.findMany({
        where: {
          submittedAt: dateFilter,
          deletedAt: null,
          order: {
            branchId,
          },
        },
        select: {
          id: true,
          status: true,
          amount: true,
          submittedAt: true,
        },
      }),
      this.prisma.inventoryItem.findMany({
        where: {
          branchId,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          currentQuantity: true,
          reorderLevel: true,
        },
      }),
    ]);

    const validSalesOrders = orders.filter(
      (order) =>
        order.status !== OrderStatus.CANCELLED &&
        order.status !== OrderStatus.REJECTED,
    );

    const approvedPaymentOrders = orders.filter(
      (order) =>
        order.paymentState === PaymentState.APPROVED ||
        order.paymentState === PaymentState.PAID,
    );

    const lowStockItems = inventoryItems.filter(
      (item) =>
        item.status === InventoryItemStatus.ACTIVE &&
        Number(item.currentQuantity) <= Number(item.reorderLevel),
    );

    return {
      branch: branch
        ? {
            id: branch.id,
            code: branch.code,
            name: branch.name,
          }
        : null,
      period: {
        from: from ?? null,
        to: to ?? null,
      },
      orders: {
        total: orders.length,
        pending: this.countByStatus(orders, OrderStatus.PENDING),
        approved: this.countByStatus(orders, OrderStatus.APPROVED),
        cooking: this.countByStatus(orders, OrderStatus.COOKING),
        delivered: this.countByStatus(orders, OrderStatus.DELIVERED),
        completed: this.countByStatus(orders, OrderStatus.COMPLETED),
        cancelled: this.countByStatus(orders, OrderStatus.CANCELLED),
        grossSales: this.sumDecimal(validSalesOrders, 'totalAmount'),
        approvedPaymentsAmount: this.sumDecimal(
          approvedPaymentOrders,
          'totalAmount',
        ),
      },
      reservations: {
        total: reservations.length,
        pending: this.countByStatus(reservations, ReservationStatus.PENDING),
        approved: this.countByStatus(reservations, ReservationStatus.APPROVED),
        completed: this.countByStatus(reservations, ReservationStatus.COMPLETED),
        cancelled: this.countByStatus(reservations, ReservationStatus.CANCELLED),
        noShow: this.countByStatus(reservations, ReservationStatus.NO_SHOW),
        guestCountTotal: reservations.reduce(
          (total, reservation) => total + reservation.guestCount,
          0,
        ),
      },
      deliveries: {
        total: deliveries.length,
        pendingAssignment: this.countByStatus(
          deliveries,
          DeliveryStatus.PENDING_ASSIGNMENT,
        ),
        assigned: this.countByStatus(deliveries, DeliveryStatus.ASSIGNED),
        outForDelivery: this.countByStatus(
          deliveries,
          DeliveryStatus.OUT_FOR_DELIVERY,
        ),
        delivered: this.countByStatus(deliveries, DeliveryStatus.DELIVERED),
        cancelled: this.countByStatus(deliveries, DeliveryStatus.CANCELLED),
        failed: this.countByStatus(deliveries, DeliveryStatus.FAILED),
        codAmountToCollect: this.sumDecimal(deliveries, 'codAmountToCollect'),
        deliveryFees: this.sumDecimal(deliveries, 'deliveryFeeAmount'),
      },
      payments: {
        proofsTotal: paymentProofs.length,
        pendingReview: this.countByStatus(
          paymentProofs,
          PaymentProofStatus.PENDING_REVIEW,
        ),
        approved: this.countByStatus(paymentProofs, PaymentProofStatus.APPROVED),
        rejected: this.countByStatus(paymentProofs, PaymentProofStatus.REJECTED),
        submittedAmount: this.sumDecimal(paymentProofs, 'amount'),
      },
      inventory: {
        totalItems: inventoryItems.length,
        activeItems: this.countByStatus(
          inventoryItems,
          InventoryItemStatus.ACTIVE,
        ),
        lowStockItems: lowStockItems.length,
      },
    };
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

  private countByStatus<T extends { status: string }>(
    items: T[],
    status: string,
  ) {
    return items.filter((item) => item.status === status).length;
  }

  private sumDecimal<T extends Record<string, unknown>>(
    items: T[],
    field: keyof T,
  ) {
    return items.reduce((total, item) => total + Number(item[field] ?? 0), 0);
  }
}
