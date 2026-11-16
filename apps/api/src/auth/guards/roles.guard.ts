import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../types/auth-user.type';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
    }>();

    if (!request.user) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    if (!requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('This account role cannot access this resource.');
    }

    if (request.user.role === UserRole.SUPERADMIN) {
      const configuredOwnerEmail =
        process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();

      if (
        !configuredOwnerEmail ||
        request.user.email.trim().toLowerCase() !== configuredOwnerEmail
      ) {
        throw new ForbiddenException(
          'This account is not the authorized DineDo owner account.',
        );
      }
    }

    return true;
  }
}
