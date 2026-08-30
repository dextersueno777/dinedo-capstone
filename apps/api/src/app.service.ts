import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
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
}
