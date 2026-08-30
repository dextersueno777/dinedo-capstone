import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from './types/auth-user.type';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        profile: {
          create: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phoneNumber: dto.phoneNumber?.trim(),
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return {
      user: this.toAuthUser(user),
      accessToken: await this.signAccessToken(this.toAuthUser(user)),
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordIsValid = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active.');
    }

    const authUser = this.toAuthUser(user);

    return {
      user: authUser,
      accessToken: await this.signAccessToken(authUser),
    };
  }

  private async signAccessToken(user: AuthUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '15m',
    });
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    branchId: string | null;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      branchId: user.branchId,
      firstName: user.profile?.firstName ?? null,
      lastName: user.profile?.lastName ?? null,
    };
  }
}
