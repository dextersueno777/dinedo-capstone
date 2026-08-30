import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RejectRiderDeliveryDto } from './dto/reject-rider-delivery.dto';
import { ReportDeliveryIssueDto } from './dto/report-delivery-issue.dto';
import { UpdateRiderDeliveryStatusDto } from './dto/update-rider-delivery-status.dto';

@Injectable()
export class RiderDeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyDeliveries(riderId: string) {
    return this.prisma.delivery.findMany({
      where: {
        riderId,
        deletedAt: null,
      },
      select: this.deliverySelect(),
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }

  async getMyDeliveryById(riderId: string, deliveryId: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        riderId,
        deletedAt: null,
      },
      select: this.deliverySelect(),
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found.');
    }

    return delivery;
  }

  async acceptDelivery(riderId: string, deliveryId: string) {
    const delivery = await this.findOwnedDelivery(riderId, deliveryId);

    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      throw new BadRequestException('Only assigned deliveries can be accepted.');
    }

    return this.prisma.delivery.update({
      where: {
        id: deliveryId,
      },
      data: {
        status: DeliveryStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      select: this.deliverySelect(),
    });
  }

  async rejectDelivery(
    riderId: string,
    deliveryId: string,
    dto: RejectRiderDeliveryDto,
  ) {
    const delivery = await this.findOwnedDelivery(riderId, deliveryId);

    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      throw new BadRequestException('Only assigned deliveries can be rejected.');
    }

    return this.prisma.delivery.update({
      where: {
        id: deliveryId,
      },
      data: {
        status: DeliveryStatus.REJECTED_BY_RIDER,
        rejectedAt: new Date(),
        rejectionReason: dto.reason.trim(),
      },
      select: this.deliverySelect(),
    });
  }

  async updateStatus(
    riderId: string,
    deliveryId: string,
    dto: UpdateRiderDeliveryStatusDto,
  ) {
    const allowedStatuses: DeliveryStatus[] = [
      DeliveryStatus.OUT_FOR_DELIVERY,
      DeliveryStatus.ARRIVED,
      DeliveryStatus.DELIVERED,
      DeliveryStatus.FAILED,
    ];

    if (!allowedStatuses.includes(dto.status)) {
      throw new BadRequestException(
        'Rider can only set OUT_FOR_DELIVERY, ARRIVED, DELIVERED, or FAILED.',
      );
    }

    const delivery = await this.findOwnedDelivery(riderId, deliveryId);

    if (
      delivery.status !== DeliveryStatus.ACCEPTED &&
      delivery.status !== DeliveryStatus.OUT_FOR_DELIVERY &&
      delivery.status !== DeliveryStatus.ARRIVED
    ) {
      throw new BadRequestException(
        'Delivery must be accepted before updating delivery progress.',
      );
    }

    const deliveryTimestampData: Prisma.DeliveryUpdateInput = {};
    const orderTimestampData: Prisma.OrderUpdateInput = {};
    let nextOrderStatus: OrderStatus | null = null;

    if (dto.status === DeliveryStatus.OUT_FOR_DELIVERY) {
      deliveryTimestampData.outForDeliveryAt = new Date();
      nextOrderStatus = OrderStatus.OUT_FOR_DELIVERY;
    }

    if (dto.status === DeliveryStatus.ARRIVED) {
      deliveryTimestampData.arrivedAt = new Date();
      nextOrderStatus = OrderStatus.ARRIVED;
    }

    if (dto.status === DeliveryStatus.DELIVERED) {
      deliveryTimestampData.deliveredAt = new Date();
      nextOrderStatus = OrderStatus.DELIVERED;
    }

    if (dto.status === DeliveryStatus.FAILED) {
      deliveryTimestampData.failedAt = new Date();
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: {
          id: deliveryId,
        },
        data: {
          status: dto.status,
          issueSummary: dto.status === DeliveryStatus.FAILED
            ? dto.notes?.trim()
            : undefined,
          ...deliveryTimestampData,
        },
      });

      if (nextOrderStatus) {
        await tx.order.update({
          where: {
            id: delivery.orderId,
          },
          data: {
            status: nextOrderStatus,
            ...orderTimestampData,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: delivery.orderId,
            fromStatus: delivery.order.status,
            toStatus: nextOrderStatus,
            changedById: riderId,
            notes: dto.notes?.trim(),
          },
        });
      }

      return tx.delivery.findUniqueOrThrow({
        where: {
          id: deliveryId,
        },
        select: this.deliverySelect(),
      });
    });
  }

  async reportIssue(
    riderId: string,
    deliveryId: string,
    dto: ReportDeliveryIssueDto,
  ) {
    const delivery = await this.findOwnedDelivery(riderId, deliveryId);

    await this.prisma.deliveryIssue.create({
      data: {
        deliveryId: delivery.id,
        reportedById: riderId,
        title: dto.title.trim(),
        description: dto.description.trim(),
      },
    });

    await this.prisma.delivery.update({
      where: {
        id: delivery.id,
      },
      data: {
        issueSummary: dto.title.trim(),
      },
    });

    return this.getMyDeliveryById(riderId, delivery.id);
  }

  private async findOwnedDelivery(riderId: string, deliveryId: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        riderId,
        deletedAt: null,
      },
      select: {
        id: true,
        orderId: true,
        status: true,
        order: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found.');
    }

    return delivery;
  }

  private deliverySelect(): Prisma.DeliverySelect {
    return {
      id: true,
      status: true,
      assignedAt: true,
      acceptedAt: true,
      rejectedAt: true,
      rejectionReason: true,
      outForDeliveryAt: true,
      arrivedAt: true,
      deliveredAt: true,
      cancelledAt: true,
      failedAt: true,
      issueSummary: true,
      navigationAddress: true,
      customerContactSnapshot: true,
      codAmountToCollect: true,
      deliveryFeeAmount: true,
      createdAt: true,
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          serviceType: true,
          paymentMethod: true,
          paymentState: true,
          totalAmount: true,
          customerNotes: true,
          address: {
            select: {
              id: true,
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
              quantity: true,
              unitPrice: true,
              lineTotal: true,
              specialNotes: true,
            },
          },
        },
      },
      issues: {
        select: {
          id: true,
          status: true,
          title: true,
          description: true,
          resolution: true,
          createdAt: true,
          resolvedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      proofs: {
        select: {
          id: true,
          type: true,
          imageUrl: true,
          signatureUrl: true,
          notes: true,
          capturedAt: true,
        },
        orderBy: {
          capturedAt: 'desc',
        },
      },
    };
  }
}
