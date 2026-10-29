import { Module } from "@nestjs/common";
import { CooksController } from "./cooks.controller";
import { CooksService } from "./cooks.service";

@Module({
  controllers: [CooksController],
  providers: [CooksService],
  exports: [CooksService],
})
export class CooksModule {}
