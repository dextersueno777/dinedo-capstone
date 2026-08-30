import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentProofStatus,
  PaymentState,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewPaymentProofDto } from './dto/review-payment-proof.dto';

@Injectable()
export class AdminPaymentProofsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPaymentProofs(status?: PaymentProofStatus) {
    return this.prisma.paymentProof.findMany({
      where: {
        deletedAt: null,
        status,
      },
      select: this.paymentProofSelect(),
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  async getPaymentProofById(id: string) {
    const proof = await this.prisma.paymentProof.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: this.paymentProofSelect(),
    });

    if (!proof) {
      throw new NotFoundException('Payment proof not found.');
    }

    return proof;
  }

  async reviewPaymentProof(
    adminId: string,
    id: string,
    dto: ReviewPaymentProofDto,
  ) {
    if (dto.status === PaymentProofStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Review status must be APPROVED or REJECTED.',
      );
    }

    if (dto.status === PaymentProofStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting payment proof.',
      );
    }

    const proof = await this.prisma.paymentProof.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        orderId: true,
        status: true,
      },
    });

    if (!proof) {
      throw new NotFoundException('Payment proof not found.');
    }

    if (proof.status !== PaymentProofStatus.PENDING_REVIEW) {
      throw new BadRequestException('This payment proof was already reviewed.');
    }

    const nextPaymentState =
      dto.status === PaymentProofStatus.APPROVED
        ? PaymentState.APPROVED
        : PaymentState.REJECTED;

    return this.prisma.$transaction(async (tx) => {
      await tx.paymentProof.update({
        where: {
          id,
        },
        data: {
          status: dto.status,
          reviewedById: adminId,
          reviewedAt: new Date(),
          reviewNotes: dto.reviewNotes?.trim(),
          rejectionReason:
            dto.status === PaymentProofStatus.REJECTED
              ? dto.rejectionReason?.trim()
              : null,
        },
      });

      await tx.order.update({
        where: {
          id: proof.orderId,
        },
        data: {
          paymentState: nextPaymentState,
        },
      });

      return tx.paymentProof.findUniqueOrThrow({
        where: {
          id,
        },
        select: this.paymentProofSelect(),
      });
    });
  }

  private paymentProofSelect(): Prisma.PaymentProofSelect {
    return {
      id: true,
      orderId: true,
      uploadedById: true,
      reviewedById: true,
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
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          serviceType: true,
          paymentMethod: true,
          paymentState: true,
          totalAmount: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    };
  }
}
