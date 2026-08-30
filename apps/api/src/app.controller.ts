import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOkResponse({ description: 'Returns a welcome message.' })
  getWelcome(): { message: string; project: string; branch: string } {
    return this.appService.getWelcome();
  }

  @Get('health')
  @ApiOkResponse({ description: 'Returns API health status.' })
  getHealth(): { status: string; service: string; timestamp: string } {
    return this.appService.getHealth();
  }
}
