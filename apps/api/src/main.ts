import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/healthz', (_req: unknown, res: { status: (code: number) => { send: (body: string) => void } }) => {
    res.status(200).send('ok');
  });

  const configService = app.get(ConfigService);
  const apiPort = Number(process.env.PORT ?? configService.get<number>('API_PORT', 4000));
  const webOrigin = configService.get<string>('WEB_ORIGIN', 'http://localhost:3000');

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: webOrigin,
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DineDo API')
    .setDescription('REST API for DineDo Tinoc branch ordering, reservation, and delivery management.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(apiPort, '0.0.0.0');
}

void bootstrap();
