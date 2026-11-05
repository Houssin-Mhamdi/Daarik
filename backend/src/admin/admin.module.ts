import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PaymentsModule } from "../payments/payments.module";
import { CooksModule } from "../cooks/cooks.module";

@Module({
  imports: [PaymentsModule, CooksModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
