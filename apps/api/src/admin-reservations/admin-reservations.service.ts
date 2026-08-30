import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ReservationStatus,
  TableStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignReservationTablesDto } from './dto/assign-reservation-tables.dto';
import { ReviewReservationDto } from './dto/review-reservation.dto';
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
      status: true,
      reservedFor: true,
      guestCount: true,
      customerName: true,
      customerPhone: true,
      notes: true,
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
