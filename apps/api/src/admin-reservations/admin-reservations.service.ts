import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentProofStatus,
  Prisma,
  ReservationStatus,
  TableStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignReservationTablesDto } from './dto/assign-reservation-tables.dto';
import { ReviewReservationDto } from './dto/review-reservation.dto';
import { SetReservationDepositDto } from './dto/set-reservation-deposit.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';

@Injectable()
export class AdminReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReservations(status?: ReservationStatus) {
    return this.prisma.reservation.findMany({
      where: {
        deletedAt: null,
        status,
      },
      select: this.reservationSelect(),
      orderBy: {
        reservedFor: 'asc',
      },
    });
  }

  async getReservationById(id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: this.reservationSelect(),
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    return reservation;
  }

  async setDepositRequirement(
    adminId: string,
    id: string,
    dto: SetReservationDepositDto,
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        linkedOrderId: true,
        totalEstimate: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        'Deposit requirement can only be changed while the reservation is pending.',
      );
    }

    const existingProofCount =
      await this.prisma.reservationDepositProof.count({
        where: {
          reservationId: reservation.id,
          deletedAt: null,
        },
      });

    if (existingProofCount > 0) {
      throw new BadRequestException(
        'Deposit requirement cannot be changed after a deposit proof has been submitted.',
      );
    }

    if (dto.depositRequired) {
      if (!reservation.linkedOrderId) {
        throw new BadRequestException(
          'A deposit can only be required after an advance food order is linked to the reservation.',
        );
      }

      if (reservation.totalEstimate.lte(0)) {
        throw new BadRequestException(
          'A positive estimated food total is required before calculating the reservation deposit.',
        );
      }
    }

    const downPaymentAmount = dto.depositRequired
      ? reservation.totalEstimate.mul(new Prisma.Decimal('0.50'))
      : new Prisma.Decimal(0);

    return this.prisma.reservation.update({
      where: {
        id: reservation.id,
      },
      data: {
        depositRequired: dto.depositRequired,
        downPaymentAmount,
        depositDecisionById: adminId,
        depositDecisionAt: new Date(),
      },
      select: this.reservationSelect(),
    });
  }

  async reviewReservation(id: string, dto: ReviewReservationDto) {
    if (
      dto.status !== ReservationStatus.APPROVED &&
      dto.status !== ReservationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Review status must be APPROVED or REJECTED.',
      );
    }

    if (dto.status === ReservationStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting reservation.',
      );
    }

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        branchId: true,
        status: true,
        depositRequired: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending reservations can be reviewed.',
      );
    }

    const tableIds = [...new Set(dto.tableIds ?? [])];

    return this.prisma.$transaction(async (tx) => {
      if (
        dto.status === ReservationStatus.APPROVED &&
        reservation.depositRequired
      ) {
        const approvedDeposit = await tx.reservationDepositProof.findFirst({
          where: {
            reservationId: id,
            status: PaymentProofStatus.APPROVED,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        });

        if (!approvedDeposit) {
          throw new BadRequestException(
            'Required reservation deposit must be verified before approval.',
          );
        }
      }

      if (dto.status === ReservationStatus.APPROVED && tableIds.length > 0) {
        const tables = await tx.restaurantTable.findMany({
          where: {
            id: {
              in: tableIds,
            },
            branchId: reservation.branchId,
            status: TableStatus.ACTIVE,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        });

        if (tables.length !== tableIds.length) {
          throw new BadRequestException(
            'One or more selected tables are invalid or inactive.',
          );
        }

        await tx.reservationTable.deleteMany({
          where: {
            reservationId: id,
          },
        });

        await tx.reservationTable.createMany({
          data: tableIds.map((tableId) => ({
            reservationId: id,
            tableId,
          })),
          skipDuplicates: true,
        });
      }

      await tx.reservation.update({
        where: {
          id,
        },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes?.trim(),
          rejectionReason:
            dto.status === ReservationStatus.REJECTED
              ? dto.rejectionReason?.trim()
              : null,
          approvedAt:
            dto.status === ReservationStatus.APPROVED ? new Date() : null,
        },
      });

      return tx.reservation.findUniqueOrThrow({
        where: {
          id,
        },
        select: this.reservationSelect(),
      });
    });
  }

  async assignReservationTables(
    id: string,
    dto: AssignReservationTablesDto,
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        branchId: true,
        status: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    if (
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.COMPLETED ||
      reservation.status === ReservationStatus.NO_SHOW ||
      reservation.status === ReservationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Tables cannot be assigned to this reservation status.',
      );
    }

    const tableIds = [...new Set(dto.tableIds)];

    return this.prisma.$transaction(async (tx) => {
      const tables = await tx.restaurantTable.findMany({
        where: {
          id: {
            in: tableIds,
          },
          branchId: reservation.branchId,
          status: TableStatus.ACTIVE,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (tables.length !== tableIds.length) {
        throw new BadRequestException(
          'One or more selected tables are invalid or inactive.',
        );
      }

      await tx.reservationTable.deleteMany({
        where: {
          reservationId: id,
        },
      });

      await tx.reservationTable.createMany({
        data: tableIds.map((tableId) => ({
          reservationId: id,
          tableId,
        })),
        skipDuplicates: true,
      });

      return tx.reservation.findUniqueOrThrow({
        where: {
          id,
        },
        select: this.reservationSelect(),
      });
    });
  }

  async updateReservationStatus(
    id: string,
    dto: UpdateReservationStatusDto,
  ) {
    if (
      dto.status !== ReservationStatus.CANCELLED &&
      dto.status !== ReservationStatus.COMPLETED &&
      dto.status !== ReservationStatus.NO_SHOW
    ) {
      throw new BadRequestException(
        'Use the review endpoint for APPROVED or REJECTED reservations.',
      );
    }

    if (dto.status === ReservationStatus.CANCELLED && !dto.cancellationReason) {
      throw new BadRequestException(
        'Cancellation reason is required when cancelling reservation.',
      );
    }

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    return this.prisma.reservation.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
        adminNotes: dto.adminNotes?.trim(),
        cancellationReason:
          dto.status === ReservationStatus.CANCELLED
            ? dto.cancellationReason?.trim()
            : undefined,
        cancelledAt:
          dto.status === ReservationStatus.CANCELLED ? new Date() : undefined,
        completedAt:
          dto.status === ReservationStatus.COMPLETED ? new Date() : undefined,
      },
      select: this.reservationSelect(),
    });
  }

  private reservationSelect(): Prisma.ReservationSelect {
    return {
      id: true,
      reservationNumber: true,
      linkedOrderId: true,
      status: true,
      reservedFor: true,
      guestCount: true,
      customerName: true,
      customerPhone: true,
      bookingType: true,
      notes: true,
      depositRequired: true,
      depositDecisionById: true,
      depositDecisionAt: true,
      downPaymentAmount: true,
      totalEstimate: true,
      adminNotes: true,
      rejectionReason: true,
      cancellationReason: true,
      approvedAt: true,
      cancelledAt: true,
      completedAt: true,
      createdAt: true,
      branch: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      customer: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      tables: {
        select: {
          table: {
            select: {
              id: true,
              name: true,
              capacity: true,
              location: true,
              status: true,
            },
          },
        },
      },
    };
  }
}
