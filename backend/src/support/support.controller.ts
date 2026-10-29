import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { SupportService } from "./support.service";
import { CreateSupportTicketDto } from "./dto/support.dto";
import { Public } from "../common/decorators/public.decorator";
import {
  CurrentUser,
  JwtPayloadUser,
} from "../common/decorators/current-user.decorator";

@ApiTags("Catalog & Support")
@ApiBearerAuth()
@Controller()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Public()
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "darna-backend",
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get("catalog")
  getCatalogMeta() {
    return this.supportService.getCatalogMeta();
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("support/tickets")
  createTicket(
    @CurrentUser() user: JwtPayloadUser | undefined,
    @Body() dto: CreateSupportTicketDto,
  ) {
    return this.supportService.createTicket(user?.sub, dto);
  }
}
