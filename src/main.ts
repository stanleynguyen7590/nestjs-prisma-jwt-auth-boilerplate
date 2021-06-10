import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    credentials: true,
    origin: 'http://localhost:3005',
    exposedHeaders: ['set-cookie'],
  });
  await app.listen(3000);
}
bootstrap();
