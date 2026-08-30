import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    return this.prisma.address.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: this.addressSelect(),
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async createMine(userId: string, dto: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingDefaultCount = await tx.address.count({
        where: {
          userId,
          isDefault: true,
          deletedAt: null,
        },
      });

      const shouldBeDefault = dto.isDefault ?? existingDefaultCount === 0;

      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: {
            userId,
            deletedAt: null,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.create({
        data: {
          userId,
          label: dto.label.trim(),
          recipient: dto.recipient.trim(),
          phoneNumber: dto.phoneNumber.trim(),
          line1: dto.line1.trim(),
          barangay: dto.barangay?.trim(),
          municipality: dto.municipality.trim(),
          province: dto.province.trim(),
          postalCode: dto.postalCode?.trim(),
          landmark: dto.landmark?.trim(),
          latitude: dto.latitude,
          longitude: dto.longitude,
          isDefault: shouldBeDefault,
        },
        select: this.addressSelect(),
      });
    });
  }

  async updateMine(userId: string, addressId: string, dto: UpdateAddressDto) {
    await this.findOwnedAddress(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.address.updateMany({
          where: {
            userId,
            deletedAt: null,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.update({
        where: {
          id: addressId,
        },
        data: {
          label: dto.label?.trim(),
          recipient: dto.recipient?.trim(),
          phoneNumber: dto.phoneNumber?.trim(),
          line1: dto.line1?.trim(),
          barangay: dto.barangay?.trim(),
          municipality: dto.municipality?.trim(),
          province: dto.province?.trim(),
          postalCode: dto.postalCode?.trim(),
          landmark: dto.landmark?.trim(),
          latitude: dto.latitude,
          longitude: dto.longitude,
          isDefault: dto.isDefault,
        },
        select: this.addressSelect(),
      });
    });
  }

  async removeMine(userId: string, addressId: string) {
    const address = await this.findOwnedAddress(userId, addressId);

    if (address.isDefault) {
      throw new ForbiddenException('Default address cannot be deleted first.');
    }

    await this.prisma.address.update({
      where: {
        id: addressId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Address deleted successfully.',
    };
  }

  private async findOwnedAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        isDefault: true,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found.');
    }

    return address;
  }

  private addressSelect() {
    return {
      id: true,
      label: true,
      recipient: true,
      phoneNumber: true,
      line1: true,
      barangay: true,
      municipality: true,
      province: true,
      postalCode: true,
      landmark: true,
      latitude: true,
      longitude: true,
      isDefault: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}
