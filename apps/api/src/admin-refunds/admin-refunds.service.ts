import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentState, Prisma, RefundStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRefundStatusDto } from './dto/update-refund-status.dto';

@Injectable()
export class AdminRefundsService {
  constructor(private readonly prisma: PrismaService) {}

  getRefunds(status?: RefundStatus) {
    return this.prisma.refund.findMany({
      where: { deletedAt: null, status },
      select: this.refundSelect(),
      orderBy: { requestedAt: 'desc' },
    });
  }

  async getRefundById(id: string) {
    const refund = await this.prisma.refund.findFirst({
      where: { id, deletedAt: null },
      select: this.refundSelect(),
    });

    if (!refund) {
      throw new NotFoundException('Refund not found.');
    }

    return refund;
  }

  async updateRefundStatus(
    adminId: string,
    id: string,
    dto: UpdateRefundStatusDto,
  ) {
    if (dto.status === RefundStatus.PENDING) {
      throw new BadRequestException(
        'Refund status cannot be moved back to PENDING.',
      );
    }

    if (
      dto.status === RefundStatus.COMPLETED &&
      !dto.gcashReferenceNumber?.trim() &&
      !dto.refundProofImageUrl?.trim()
    ) {
      throw new BadRequestException(
        'GCash reference number or refund proof image is required.',
      );
    }

    const refund = await this.prisma.refund.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, orderId: true, status: true },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found.');
    }

    if (
      refund.status === RefundStatus.COMPLETED ||
      refund.status === RefundStatus.CANCELLED
    ) {
      throw new BadRequestException('This refund is already closed.');
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.refund.update({
        where: { id },
        data: {
          status: dto.status,
          processedById: adminId,
          processedAt: now,
          completedAt: dto.status === RefundStatus.COMPLETED ? now : null,
          adminNotes: dto.adminNotes?.trim(),
          gcashReferenceNumber: dto.gcashReferenceNumber?.trim(),
          refundProofImageUrl: dto.refundProofImageUrl?.trim(),
        },
      });

      if (dto.status === RefundStatus.APPROVED) {
        await tx.order.update({
          where: { id: refund.orderId },
          data: { paymentState: PaymentState.REFUND_PENDING },
        });
      }

      if (dto.status === RefundStatus.COMPLETED) {
        await tx.order.update({
          where: { id: refund.orderId },
          data: { paymentState: PaymentState.REFUNDED },
        });
      }

      return tx.refund.findUniqueOrThrow({
        where: { id },
        select: this.refundSelect(),
      });
    });
  }

  private refundSelect(): Prisma.RefundSelect {
    return {
      id: true,
      orderId: true,
      customerId: true,
      requestedById: true,
      processedById: true,
      status: true,
      method: true,
      amount: true,
      reason: true,
      adminNotes: true,
      gcashReferenceNumber: true,
      refundProofImageUrl: true,
      requestedAt: true,
      processedAt: true,
      completedAt: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentMethod: true,
          paymentState: true,
          totalAmount: true,
        },
      },
      customer: {
        select: {
          id: true,
          email: true,
        },
      },
    };
  }
}
