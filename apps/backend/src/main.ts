import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Frontend
  app.enableCors({
    origin: '*', // En producción cambiar esto por el dominio real
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('Línea Digital API')
    .setDescription('API corporativa para servicios de Línea Digital')
    .setVersion('1.0')
    .addTag('chat')
    .addTag('email')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
