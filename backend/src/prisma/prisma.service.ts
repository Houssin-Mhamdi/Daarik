import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Connected to PostgreSQL database");
    } catch (error) {
      this.logger.warn(
        `PostgreSQL connection pending (${error instanceof Error ? error.message : "check DATABASE_URL in .env"})`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
