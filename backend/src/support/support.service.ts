import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSupportTicketDto } from "./dto/support.dto";

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getCatalogMeta() {
    const [pickupOptions, settings] = await Promise.all([
      this.prisma.pickupOption.findMany(),
      this.prisma.platformSetting.findUnique({ where: { id: "singleton" } }),
    ]);

    return {
      serviceFee: settings?.serviceFee ?? 1.5,
      cuisines: [
        {
          id: "tunisian",
          label: { nl: "Tunesisch", en: "Tunisian", ar: "تونسي" },
          flag: "🇹🇳",
          image: "/img/brik.jpg",
        },
        {
          id: "moroccan",
          label: { nl: "Marokkaans", en: "Moroccan", ar: "مغربي" },
          flag: "🇲🇦",
          image: "/img/tagine.jpg",
        },
        {
          id: "syrian",
          label: { nl: "Syrisch", en: "Syrian", ar: "سوري" },
          flag: "🇸🇾",
          image: "/img/kibbeh.jpg",
        },
        {
          id: "lebanese",
          label: { nl: "Libanees", en: "Lebanese", ar: "لبناني" },
          flag: "🇱🇧",
          image: "/img/stuffed.jpg",
        },
        {
          id: "turkish",
          label: { nl: "Turks", en: "Turkish", ar: "تركي" },
          flag: "🇹🇷",
          image: "/img/couscous.jpg",
        },
        {
          id: "egyptian",
          label: { nl: "Egyptisch", en: "Egyptian", ar: "مصري" },
          flag: "🇪🇬",
          image: "/img/tagine.jpg",
        },
      ],
      allergens: [
        "gluten",
        "egg",
        "dairy",
        "nuts",
        "sesame",
        "celery",
        "fish",
        "shellfish",
        "soy",
        "mustard",
      ],
      dietary: [
        "vegetarian",
        "vegan",
        "halal",
        "glutenFree",
        "nutFree",
        "dairyFree",
        "spicy",
      ],
      pickupOptions,
    };
  }

  async createTicket(userId: string | undefined, dto: CreateSupportTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        userId: userId ?? null,
        email: dto.email,
        orderCode: dto.orderCode,
        message: dto.message,
      },
    });
  }
}
