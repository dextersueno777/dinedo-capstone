import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminMenuController } from './admin-menu.controller';
import { AdminMenuService } from './admin-menu.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminMenuController],
  providers: [AdminMenuService],
  exports: [AdminMenuService],
})
export class AdminMenuModule {}
