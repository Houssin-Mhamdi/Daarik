import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import type { NextFunction, Request, Response } from "express";
import { join } from "node:path";
import { AppModule } from "./app.module";
import { ACCESS_COOKIE, readCookie } from "./auth/auth-cookies";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const config = app.get(ConfigService);

  // Uploaded dish photos are served as static files (see UploadsController).
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
    maxAge: "30d",
  });

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
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept-Language",
      "X-Requested-With",
    ],
  });

  // CSRF defence for cookie auth: browsers cannot attach a custom header
  // cross-origin without a CORS preflight, which only trusted origins pass.
  // Bearer-token clients and the Stripe webhook are unaffected.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const safe = ["GET", "HEAD", "OPTIONS"].includes(req.method);
    const usesCookie =
      !req.headers.authorization && readCookie(req, ACCESS_COOKIE);
    const isWebhook = req.path.endsWith("/payments/webhook");
    if (!safe && usesCookie && !isWebhook && !req.headers["x-requested-with"]) {
      res.status(403).json({
        statusCode: 403,
        message: "Missing X-Requested-With header",
      });
      return;
    }
    next();
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
