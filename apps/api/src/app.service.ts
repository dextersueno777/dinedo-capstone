import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getWelcome(): { message: string; project: string; branch: string } {
    return {
      message: 'Welcome to the DineDo API.',
      project: 'DineDo',
      branch: 'Tinoc'
    };
  }

  getHealth(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'dinedo-api',
      timestamp: new Date().toISOString()
    };
  }

  async getDatabaseHealth(): Promise<{
    status: string;
    database: string;
    timestamp: string;
  }> {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'postgresql',
      timestamp: new Date().toISOString()
    };
  }
}
