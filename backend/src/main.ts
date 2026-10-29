import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Security headers (relaxed CSP on /api/docs so Swagger UI assets load cleanly)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }),
  );

  // CORS
  const origin = config.get<string>("FRONTEND_ORIGIN") || "http://localhost:3000";
  app.enableCors({
    origin: origin.split(",").map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
  });

  // Global prefix /api
  app.setGlobalPrefix("api");

  // Strict DTO validation & transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger OpenAPI Documentation (/api/docs)
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Daarik (دارك) Marketplace API")
    .setDescription(
      "Full REST API for Daarik homemade Arabic food marketplace — Auth, Cooks, Dishes, Cart, Orders, Stripe & Dutch iDEAL Payments, Cook Stripe Connect + In-App Wallet Bank Transfer, Reviews, and Admin Dashboard.",
    )
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    customSiteTitle: "Daarik API Docs (Swagger)",
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "list",
    },
  });

  const port = Number(config.get("PORT") ?? 4000);
  await app.listen(port);
  logger.log(`Daarik API running on http://localhost:${port}/api`);
  logger.log(`Swagger Docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
