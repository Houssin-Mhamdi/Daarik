import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AuditModule } from "../audit/audit.module";
import { PaymentsModule } from "../payments/payments.module";
import { CooksModule } from "../cooks/cooks.module";
import { UploadsModule } from "../uploads/uploads.module";

@Module({
  imports: [PaymentsModule, CooksModule, AuditModule, UploadsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
