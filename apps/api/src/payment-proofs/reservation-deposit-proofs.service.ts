import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentProofStatus,
  Prisma,
  ReservationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitPaymentProofDto } from './dto/submit-payment-proof.dto';

@Injectable()
export class ReservationDepositProofsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitProof(
    customerId: string,
    reservationId: string,
    dto: SubmitPaymentProofDto,
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, customerId, deletedAt: null },
      select: {
        status: true,
        depositRequired: true,
        downPaymentAmount: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('Reservation is not pending.');
    }

    if (!reservation.depositRequired || reservation.downPaymentAmount.lte(0)) {
      throw new BadRequestException('This reservation has no required deposit.');
    }

    const existingProof = await this.prisma.reservationDepositProof.findFirst({
      where: {
        reservationId,
        deletedAt: null,
        status: {
          in: [
            PaymentProofStatus.PENDING_REVIEW,
            PaymentProofStatus.APPROVED,
          ],
        },
      },
    });

    if (existingProof) {
      throw new BadRequestException(
        existingProof.status === PaymentProofStatus.APPROVED
          ? 'Reservation deposit is already approved.'
          : 'Deposit proof is already waiting for review.',
      );
    }

    return this.prisma.reservationDepositProof.create({
      data: {
        reservationId,
        uploadedById: customerId,
        status: PaymentProofStatus.PENDING_REVIEW,
        amount: reservation.downPaymentAmount,
        proofImageUrl: dto.proofImageUrl,
        gcashReferenceNumber: dto.gcashReferenceNumber?.trim(),
        payerName: dto.payerName?.trim(),
        payerAccountLast4: dto.payerAccountLast4?.trim(),
      },
    });
  }
  async getMyProofs(customerId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, customerId, deletedAt: null },
      select: { id: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    return this.prisma.reservationDepositProof.findMany({
      where: {
        reservationId,
        uploadedById: customerId,
        deletedAt: null,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

}
