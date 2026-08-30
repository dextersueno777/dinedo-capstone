import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../types/auth-user.type';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: AuthUser;
    }>();

    const authorization = request.headers.authorization;

    if (!authorization || Array.isArray(authorization)) {
      throw new UnauthorizedException('Missing authorization header.');
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header.');
    }

    const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    const payload = await this.jwtService
      .verifyAsync<JwtPayload>(token, { secret })
      .catch(() => {
        throw new UnauthorizedException('Invalid or expired token.');
      });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active.');
    }

    request.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      branchId: user.branchId,
      firstName: user.profile?.firstName ?? null,
      lastName: user.profile?.lastName ?? null,
    };

    return true;
  }
}
