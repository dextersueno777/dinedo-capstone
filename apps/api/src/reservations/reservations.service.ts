import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BranchStatus,
  Prisma,
  ReservationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReservation(customerId: string, dto: CreateReservationDto) {
    const reservedFor = new Date(dto.reservedFor);

    if (Number.isNaN(reservedFor.getTime())) {
      throw new BadRequestException('Invalid reservation date and time.');
    }

    if (reservedFor <= new Date()) {
      throw new BadRequestException('Reservation date must be in the future.');
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        code: dto.branchCode.trim().toUpperCase(),
        status: BranchStatus.ACTIVE,
      },
      select: {
        id: true,
        code: true,
        name: true,
        settings: {
          select: {
            timezone: true,
            orderingOpenTime: true,
            orderingCloseTime: true,
            reservationsEnabled: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }

    if (!branch.settings?.reservationsEnabled) {
      throw new BadRequestException('Reservations are disabled for this branch.');
    }

    this.validateReservationTime(
      reservedFor,
      branch.settings.timezone,
      branch.settings.orderingOpenTime,
      branch.settings.orderingCloseTime,
    );

    const reservationNumber = await this.generateReservationNumber();

    return this.prisma.reservation.create({
      data: {
        reservationNumber,
        branchId: branch.id,
        customerId,
        status: ReservationStatus.PENDING,
        reservedFor,
        guestCount: dto.guestCount,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        notes: dto.notes?.trim(),
        downPaymentAmount: dto.downPaymentAmount ?? 0,
        totalEstimate: dto.totalEstimate ?? 0,
      },
      select: this.reservationSelect(),
    });
  }

  async getMyReservations(customerId: string) {
    return this.prisma.reservation.findMany({
      where: {
        customerId,
        deletedAt: null,
      },
      select: this.reservationSelect(),
      orderBy: {
        reservedFor: 'desc',
      },
    });
  }

  async getMyReservationById(customerId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        customerId,
        deletedAt: null,
      },
      select: this.reservationSelect(),
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    return reservation;
  }

  async cancelMyReservation(
    customerId: string,
    id: string,
    dto: CancelReservationDto,
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        customerId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    if (
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.COMPLETED ||
      reservation.status === ReservationStatus.NO_SHOW
    ) {
      throw new BadRequestException(
        'This reservation can no longer be cancelled.',
      );
    }

    return this.prisma.reservation.update({
      where: {
        id,
      },
      data: {
        status: ReservationStatus.CANCELLED,
        cancellationReason: dto.cancellationReason.trim(),
        cancelledAt: new Date(),
      },
      select: this.reservationSelect(),
    });
  }

  private validateReservationTime(
    reservedFor: Date,
    timezone: string,
    openTime: string,
    closeTime: string,
  ) {
    const localParts = new Intl.DateTimeFormat('en-PH', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(reservedFor);

    const hour = Number(localParts.find((part) => part.type === 'hour')?.value);
    const minute = Number(
      localParts.find((part) => part.type === 'minute')?.value,
    );

    const reservedMinutes = hour * 60 + minute;
    const openMinutes = this.timeToMinutes(openTime);
    const closeMinutes = this.timeToMinutes(closeTime);

    if (reservedMinutes < openMinutes || reservedMinutes >= closeMinutes) {
      throw new BadRequestException(
        `Reservation time must be within branch hours ${openTime}-${closeTime}.`,
      );
    }
  }

  private timeToMinutes(time: string) {
    const [hour, minute] = time.split(':').map(Number);

    return hour * 60 + minute;
  }

  private async generateReservationNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const reservationNumber = `RS-${datePart}-${randomPart}`;

      const existing = await this.prisma.reservation.findUnique({
        where: {
          reservationNumber,
        },
        select: {
          id: true,
        },
      });

      if (!existing) {
        return reservationNumber;
      }
    }

    throw new BadRequestException('Could not generate reservation number.');
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
      tables: {
        select: {
          table: {
            select: {
              id: true,
              name: true,
              capacity: true,
              location: true,
            },
          },
        },
      },
    };
  }
}
