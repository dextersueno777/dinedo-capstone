import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethod,
  PaymentProofStatus,
  PaymentState,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitPaymentProofDto } from './dto/submit-payment-proof.dto';

@Injectable()
export class PaymentProofsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitProof(
    customerId: string,
    orderId: string,
    dto: SubmitPaymentProofDto,
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
        deletedAt: null,
      },
      select: {
        id: true,
        paymentMethod: true,
        paymentState: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.paymentMethod !== PaymentMethod.GCASH_MANUAL) {
      throw new BadRequestException(
        'Payment proof is only allowed for manual GCash orders.',
      );
    }

    if (
      order.paymentState === PaymentState.PAID ||
      order.paymentState === PaymentState.APPROVED
    ) {
      throw new BadRequestException('This order payment is already approved.');
    }

    return this.prisma.$transaction(async (tx) => {
      const proof = await tx.paymentProof.create({
        data: {
          orderId,
          uploadedById: customerId,
          status: PaymentProofStatus.PENDING_REVIEW,
          amount: dto.amount,
          proofImageUrl: dto.proofImageUrl,
          gcashReferenceNumber: dto.gcashReferenceNumber?.trim(),
          payerName: dto.payerName?.trim(),
          payerAccountLast4: dto.payerAccountLast4?.trim(),
        },
        select: this.paymentProofSelect(),
      });

      await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          paymentState: PaymentState.PROOF_SUBMITTED,
        },
      });

      return proof;
    });
  }

  async getMyOrderProofs(customerId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return this.prisma.paymentProof.findMany({
      where: {
        orderId,
        uploadedById: customerId,
        deletedAt: null,
      },
      select: this.paymentProofSelect(),
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  private paymentProofSelect(): Prisma.PaymentProofSelect {
    return {
      id: true,
      orderId: true,
      status: true,
      amount: true,
      proofImageUrl: true,
      gcashReferenceNumber: true,
      payerName: true,
      payerAccountLast4: true,
      rejectionReason: true,
      reviewNotes: true,
      submittedAt: true,
      reviewedAt: true,
      createdAt: true,
    };
  }
}
