import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminRidersController } from './admin-riders.controller';
import { AdminRidersService } from './admin-riders.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminRidersController],
  providers: [AdminRidersService],
})
export class AdminRidersModule {}
