import { PrismaClient, Role, CookStatus, DishStatus, OrderStatus, PayoutStatus, DisputeStatus, ApplicationStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const L = (nl: string, en: string, ar: string) => ({ nl, en, ar });

async function main() {
  console.log("Seeding Darna PostgreSQL database...");

  // 1. Platform Settings
  await prisma.platformSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      platformName: "Darna",
      region: "NL",
      currency: "EUR",
      timezone: "Europe/Amsterdam",
      serviceFee: 1.5,
      commissionRate: 0.15,
      requireVerification: true,
      autoApproveCooks: false,
      maintenanceMode: false,
      supportEmail: "hello@darna.nl",
    },
  });

  // 2. Pickup Options
  const pickupOptions = [
    {
      id: "fri-30",
      day: L("Vrijdag 30 oktober", "Friday 30 October", "الجمعة 30 أكتوبر"),
      shortDay: L("Vrij 30 okt", "Fri 30 Oct", "الجمعة 30 أكتوبر"),
      date: "2026-10-30",
      slots: ["17:00", "17:30", "18:00", "18:30"],
    },
    {
      id: "sat-31",
      day: L("Zaterdag 31 oktober", "Saturday 31 October", "السبت 31 أكتوبر"),
      shortDay: L("Za 31 okt", "Sat 31 Oct", "السبت 31 أكتوبر"),
      date: "2026-10-31",
      slots: ["12:00", "12:30", "17:30", "18:00", "18:30", "19:00"],
    },
    {
      id: "sun-01",
      day: L("Zondag 1 november", "Sunday 1 November", "الأحد 1 نوفمبر"),
      shortDay: L("Zo 1 nov", "Sun 1 Nov", "الأحد 1 نوفمبر"),
      date: "2026-11-01",
      slots: ["12:00", "12:30", "13:00", "13:30"],
    },
    {
      id: "fri-06",
      day: L("Vrijdag 6 november", "Friday 6 November", "الجمعة 6 نوفمبر"),
      shortDay: L("Vrij 6 nov", "Fri 6 Nov", "الجمعة 6 نوفمبر"),
      date: "2026-11-06",
      slots: ["17:30", "18:00", "18:30", "19:00"],
    },
  ];

  for (const po of pickupOptions) {
    await prisma.pickupOption.upsert({
      where: { id: po.id },
      update: po,
      create: po,
    });
  }

  // 3. Users (Customer, Admin, and 4 Cooks)
  const passwordHash = await bcrypt.hash("Darna2026!", 12);

  const customerUser = await prisma.user.upsert({
    where: { email: "sarah.devries@example.nl" },
    update: {},
    create: {
      email: "sarah.devries@example.nl",
      passwordHash,
      role: Role.CUSTOMER,
      name: "Sarah de Vries",
      firstName: "Sarah",
      phone: "+31 6 12 34 56 78",
      avatar: "/img/user-sarah.jpg",
      address: "Westzeedijk 112",
      postcode: "3016 AH",
      city: "Rotterdam",
      preferredLang: "nl",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@darna.nl" },
    update: {},
    create: {
      email: "admin@darna.nl",
      passwordHash,
      role: Role.ADMIN,
      name: "Sarah de Vries (Admin)",
      firstName: "Sarah",
      phone: "+31 6 12 34 56 78",
      avatar: "/img/user-sarah.jpg",
      city: "Rotterdam",
      preferredLang: "nl",
    },
  });

  const cooksSeed = [
    {
      slug: "rana",
      email: "rana@darna.nl",
      name: "Rana El Amri",
      kitchenName: L("Rana's keuken", "Rana's kitchen", "مطبخ رنا"),
      avatar: "/img/cook-rana.jpg",
      cover: "/img/couscous.jpg",
      city: "Rotterdam",
      area: L("Delfshaven", "Delfshaven", "دلفسهافن"),
      cuisineIds: ["tunisian"],
      rating: 4.9,
      reviewCount: 128,
      verified: true,
      status: CookStatus.VERIFIED,
      languages: ["Nederlands", "العربية", "English", "Français"],
      bio: L(
        "Ik ben opgegroeid in Tunis en kook al mijn hele leven voor familie en vrienden.",
        "I grew up in Tunis and have cooked for family and friends all my life.",
        "نشأت في تونس وأطبخ لعائلتي وأصدقائي طوال حياتي.",
      ),
      since: "2023",
      ordersCount: 840,
      response: L("1 uur", "1 hour", "ساعة"),
      pickupArea: L("Rotterdam-West", "Rotterdam West", "غرب روتردام"),
      specialties: L("Couscous · Brik · Harissa", "Couscous · Brik · Harissa", "كسكسي · بريك · هريسة"),
      instructions: L(
        "Bel twee keer aan bij nummer 14. Ik woon op de begane grond, de deur is aan de zijkant.",
        "Ring the bell twice at number 14. I'm on the ground floor, the door is on the side.",
        "اطلب الجرس مرتين عند الرقم 14. أسكن في الطابق الأرضي، والباب على الجانب.",
      ),
      yearsCooking: 22,
      iban: "NL91 ABNA 0417 1643 00",
      accountHolder: "Rana El Amri",
    },
    {
      slug: "omar",
      email: "omar@darna.nl",
      name: "Omar Benali",
      kitchenName: L("Omar's keuken", "Omar's kitchen", "مطبخ عمر"),
      avatar: "/img/cook-omar.jpg",
      cover: "/img/tagine.jpg",
      city: "Amsterdam",
      area: L("De Baarsjes", "De Baarsjes", "دي بارسخس"),
      cuisineIds: ["moroccan"],
      rating: 4.8,
      reviewCount: 96,
      verified: true,
      status: CookStatus.VERIFIED,
      languages: ["Nederlands", "العربية", "English"],
      bio: L(
        "Mijn tagines sudderen op vrijdag al vanaf de ochtend.",
        "My tagines simmer from Friday morning.",
        "طواجني تطبخ على نار هادئة من صباح الجمعة.",
      ),
      since: "2022",
      ordersCount: 1240,
      response: L("2 uur", "2 hours", "ساعتان"),
      pickupArea: L("Amsterdam-West", "Amsterdam West", "غرب أمستردام"),
      specialties: L("Tajine · Bastilla · M'semen", "Tagine · Bastilla · M'semen", "طاجين · بسطيلة · مسمن"),
      instructions: L(
        "Zoek de groene deur naast de bakkerij. Bel aan bij 'Benali'.",
        "Look for the green door next to the bakery. Ring 'Benali'.",
        "ابحث عن الباب الأخضر بجانب المخبز. اطلب جرس «بنعلي».",
      ),
      yearsCooking: 15,
      iban: "NL44 INGB 0001 2345 67",
      accountHolder: "Omar Benali",
    },
    {
      slug: "fatima",
      email: "fatima@darna.nl",
      name: "Fatima Haddad",
      kitchenName: L("Fatima's keuken", "Fatima's kitchen", "مطبخ فاطمة"),
      avatar: "/img/cook-fatima.jpg",
      cover: "/img/kibbeh.jpg",
      city: "Utrecht",
      area: L("Lombok", "Lombok", "لومبوك"),
      cuisineIds: ["syrian"],
      rating: 5.0,
      reviewCount: 74,
      verified: true,
      status: CookStatus.VERIFIED,
      languages: ["العربية", "Nederlands", "English"],
      bio: L(
        "Ik kwam in 2016 vanuit Aleppo naar Utrecht. Alles wordt met de hand gevuld.",
        "I came to Utrecht from Aleppo in 2016. Everything is filled by hand.",
        "جئت إلى أوترخت من حلب عام 2016. كل شيء يُحشى يدويًا.",
      ),
      since: "2024",
      ordersCount: 390,
      response: L("1 uur", "1 hour", "ساعة"),
      pickupArea: L("Utrecht-West", "Utrecht West", "غرب أوترخت"),
      specialties: L("Kibbeh · Maqluba · Fatteh", "Kibbeh · Maqluba · Fatteh", "كبة · مقلوبة · فتة"),
      instructions: L(
        "Je vindt me op de hoek bij het kleine park. Bel als je er bent.",
        "You'll find me on the corner by the small park. Call when you arrive.",
        "تجدني على الزاوية بجانب الحديقة الصغيرة. اتصل عند وصولك.",
      ),
      yearsCooking: 30,
      iban: "NL12 RABO 0123 4567 89",
      accountHolder: "Fatima Haddad",
    },
    {
      slug: "samira",
      email: "samira@darna.nl",
      name: "Samira Khoury",
      kitchenName: L("Samira's keuken", "Samira's kitchen", "مطبخ سميرة"),
      avatar: "/img/cook-samira.jpg",
      cover: "/img/stuffed.jpg",
      city: "Den Haag",
      area: L("Statenkwartier", "Statenkwartier", "ستاتنكوارتيير"),
      cuisineIds: ["lebanese"],
      rating: 4.9,
      reviewCount: 63,
      verified: true,
      status: CookStatus.VERIFIED,
      languages: ["العربية", "English", "Français"],
      bio: L(
        "Mijn grootmoeder leerde me warak enab rollen toen ik zes was.",
        "My grandmother taught me to roll vine leaves when I was six.",
        "علّمتني جدتي لفّ ورق العنب عندما كان عمري ست سنوات.",
      ),
      since: "2023",
      ordersCount: 510,
      response: L("3 uur", "3 hours", "3 ساعات"),
      pickupArea: L("Den Haag centrum", "The Hague centre", "وسط لاهاي"),
      specialties: L("Warak enab · Hummus · Fatteh", "Warak enab · Hummus · Fatteh", "ورق عنب · حمص · فتة"),
      instructions: L(
        "Bel aan bij de bel met 'Khoury'. Ik woon op de eerste verdieping.",
        "Ring the bell marked 'Khoury'. I'm on the first floor.",
        "اطلب الجرس المكتوب عليه «خوري». أسكن في الطابق الأول.",
      ),
      yearsCooking: 18,
      iban: "NL88 ABNA 0987 6543 21",
      accountHolder: "Samira Khoury",
    },
  ];

  const cookMap: Record<string, string> = {};

  for (const c of cooksSeed) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        passwordHash,
        role: Role.COOK,
        name: c.name,
        firstName: c.name.split(" ")[0],
        avatar: c.avatar,
        city: c.city,
        preferredLang: "nl",
      },
    });

    const { email, ...cookData } = c;
    const profile = await prisma.cookProfile.upsert({
      where: { slug: c.slug },
      update: cookData,
      create: {
        ...cookData,
        userId: u.id,
      },
    });
    cookMap[c.slug] = profile.id;
  }

  // 4. Dishes
  const dishesSeed = [
    {
      slug: "couscous-royal",
      cookSlug: "rana",
      name: L("Couscous royal met lam", "Couscous Royal with Lamb", "كسكسي ملكي باللحم"),
      desc: L(
        "Handgestoomde couscous met mals lamsvlees, kikkererwten en seizoensgroenten.",
        "Hand-steamed couscous with tender lamb, chickpeas and seasonal vegetables.",
        "كسكسي مبخّر يدويًا مع لحم غنم طري وحمص وخضار موسمية.",
      ),
      image: "/img/couscous.jpg",
      price: 16.5,
      cuisineId: "tunisian",
      rating: 4.9,
      reviewCount: 84,
      serves: 2,
      portions: 8,
      portionsLeft: 5,
      allergens: ["gluten", "celery"],
      dietary: ["halal"],
      ingredients: [L("Lamsvlees", "Lamb", "لحم غنم"), L("Couscous", "Couscous", "كسكسي")],
      pickup: ["sat-31", "sun-01"],
      featured: true,
      weekend: true,
      badge: L("Weekendspecial", "Weekend special", "عرض نهاية الأسبوع"),
      prepTime: L("3 uur", "3 hours", "3 ساعات"),
    },
    {
      slug: "brik",
      cookSlug: "rana",
      name: L("Brik à l'œuf", "Brik à l'Œuf", "بريك بالبيض"),
      desc: L(
        "Krokant gefrituurde deegflap met een vloeibaar eigeel, tonijn, aardappel en kappertjes.",
        "Crisp fried pastry with a runny yolk, tuna, potato and capers.",
        "عجينة مقرمشة مقلية مع صفار بيض طري وتونة وبطاطس وكبر.",
      ),
      image: "/img/brik.jpg",
      price: 4.9,
      cuisineId: "tunisian",
      rating: 4.8,
      reviewCount: 61,
      serves: 1,
      portions: 12,
      portionsLeft: 9,
      allergens: ["gluten", "egg", "sesame"],
      dietary: ["halal", "spicy"],
      ingredients: [L("Mals deeg", "Thin pastry", "عجين رقيق"), L("Ei", "Egg", "بيض")],
      pickup: ["fri-30", "sat-31"],
      prepTime: L("15 min", "15 min", "15 دقيقة"),
    },
    {
      slug: "tagine-chicken",
      cookSlug: "omar",
      name: L("Kiptajine met ingemaakte citroen", "Chicken Tagine with Preserved Lemon", "طاجين دجاج بالليمون المخلل"),
      desc: L(
        "Langzaam gestoofde kip met groene olijven, saffraan en citroen.",
        "Slow-braised chicken with green olives, saffron and preserved lemon.",
        "دجاج مطهو ببطء مع الزيتون الأخضر والزعفران والليمون المخلل.",
      ),
      image: "/img/tagine.jpg",
      price: 14.5,
      cuisineId: "moroccan",
      rating: 4.9,
      reviewCount: 52,
      serves: 2,
      portions: 10,
      portionsLeft: 4,
      allergens: [],
      dietary: ["halal", "glutenFree", "dairyFree"],
      ingredients: [L("Kip", "Chicken", "دجاج"), L("Bewaard citroen", "Preserved lemon", "ليمون مخلل")],
      pickup: ["fri-30", "sat-31"],
      featured: true,
      prepTime: L("2,5 uur", "2.5 hours", "ساعتان ونصف"),
    },
    {
      slug: "kibbeh",
      cookSlug: "fatima",
      name: L("Kibbeh bil sanieh", "Kibbeh bil Sanieh", "كبة بالصينية"),
      desc: L(
        "Een goudbruine laag bulgur en lam, gevuld met pijnboompitten, ui en baharat.",
        "A golden layer of bulgur and lamb filled with pine nuts, onion and baharat.",
        "طبقة ذهبية من البرغل واللحم محشوة بالصنوبر والبصل والبهارات.",
      ),
      image: "/img/kibbeh.jpg",
      price: 13.5,
      cuisineId: "syrian",
      rating: 5.0,
      reviewCount: 56,
      serves: 2,
      portions: 8,
      portionsLeft: 3,
      allergens: ["gluten", "nuts", "dairy"],
      dietary: ["halal"],
      ingredients: [L("Lam & bulgur", "Lamb & bulgur", "لحم غنم وبرغل")],
      pickup: ["fri-30", "sat-31"],
      featured: true,
      prepTime: L("2 uur", "2 hours", "ساعتان"),
    },
    {
      slug: "stuffed-aubergine",
      cookSlug: "fatima",
      name: L("Sheikh el mahshi", "Sheikh el Mahshi (Stuffed Aubergine)", "شيخ المحشي"),
      desc: L(
        "Geroosterde aubergines gevuld met gekruid gehakt, rijst en tomaten.",
        "Roasted aubergines filled with spiced minced lamb, rice and tomatoes.",
        "باذنجان مشوي محشو باللحم المفروم والأرز والطماطم.",
      ),
      image: "/img/stuffed.jpg",
      price: 12.0,
      cuisineId: "syrian",
      rating: 4.9,
      reviewCount: 33,
      serves: 2,
      portions: 8,
      portionsLeft: 5,
      allergens: ["dairy"],
      dietary: ["halal", "glutenFree"],
      ingredients: [L("Aubergine", "Aubergine", "باذنجان")],
      pickup: ["sat-31", "sun-01"],
      prepTime: L("2 uur", "2 hours", "ساعتان"),
    },
    {
      slug: "warak-enab",
      cookSlug: "samira",
      name: L("Warak enab", "Warak Enab (Stuffed Vine Leaves)", "ورق عنب"),
      desc: L(
        "Fijngerolde wijnbladeren met rijst, citroen, munt en olijfolie.",
        "Finely rolled vine leaves with rice, lemon, mint and olive oil.",
        "ورق عنب ملفوف بعناية مع أرز وليمون ونعناع وزيت زيتون.",
      ),
      image: "/img/stuffed.jpg",
      price: 9.5,
      cuisineId: "lebanese",
      rating: 4.8,
      reviewCount: 41,
      serves: 1,
      portions: 12,
      portionsLeft: 8,
      allergens: [],
      dietary: ["vegan", "glutenFree", "dairyFree"],
      ingredients: [L("Wijnbladeren", "Vine leaves", "ورق عنب")],
      pickup: ["fri-30", "sat-31"],
      prepTime: L("1,5 uur", "1.5 hours", "ساعة ونصف"),
    },
  ];

  const dishMap: Record<string, string> = {};
  for (const d of dishesSeed) {
    const { cookSlug, ...dishData } = d;
    const created = await prisma.dish.upsert({
      where: { slug: d.slug },
      update: { ...dishData, cookId: cookMap[cookSlug] },
      create: {
        ...dishData,
        cookId: cookMap[cookSlug],
        status: DishStatus.LIVE,
      },
    });
    dishMap[d.slug] = created.id;
  }

  // 5. Verification Queue
  await prisma.cookApplication.deleteMany();
  await prisma.cookApplication.createMany({
    data: [
      {
        name: "Yasmin Al-Sayed",
        email: "yasmin@example.nl",
        phone: "+31 6 11 22 33 44",
        city: "Rotterdam",
        cuisine: "Syrian",
        documentsCount: 3,
        status: ApplicationStatus.PENDING,
      },
      {
        name: "Hicham Idrissi",
        email: "hicham@example.nl",
        phone: "+31 6 22 33 44 55",
        city: "Utrecht",
        cuisine: "Moroccan",
        documentsCount: 3,
        status: ApplicationStatus.PENDING,
      },
    ],
  });

  // 6. Payouts
  await prisma.payout.upsert({
    where: { code: "PAY-8821" },
    update: {},
    create: {
      code: "PAY-8821",
      cookId: cookMap["rana"],
      period: "20 – 26 Oct",
      gross: 612.4,
      commission: 91.86,
      net: 520.54,
      ordersCount: 31,
      status: PayoutStatus.SCHEDULED,
    },
  });

  await prisma.payout.upsert({
    where: { code: "PAY-8822" },
    update: {},
    create: {
      code: "PAY-8822",
      cookId: cookMap["omar"],
      period: "20 – 26 Oct",
      gross: 748.0,
      commission: 112.2,
      net: 635.8,
      ordersCount: 38,
      status: PayoutStatus.SCHEDULED,
    },
  });

  // 7. Disputes
  await prisma.dispute.upsert({
    where: { code: "DSP-1042" },
    update: {},
    create: {
      code: "DSP-1042",
      orderCode: "DR-2402",
      cookId: cookMap["samira"],
      customerName: "Lisa Meijer",
      cookName: "Samira Khoury",
      reason: "Order not collected / cook closed",
      amount: 29.5,
      status: DisputeStatus.OPEN,
    },
  });

  // 8. Sample Order for Sarah
  await prisma.order.upsert({
    where: { code: "DR-2418" },
    update: {},
    create: {
      code: "DR-2418",
      customerId: customerUser.id,
      cookId: cookMap["rana"],
      status: OrderStatus.PREPARING,
      pickup: "sat-31",
      pickupTime: "18:00",
      subtotal: 26.3,
      serviceFee: 1.5,
      commission: 3.95,
      total: 27.8,
      customerName: "Sarah de Vries",
      customerEmail: "sarah.devries@example.nl",
      customerPhone: "+31 6 12 34 56 78",
      paid: true,
      note: L(
        "Graag zonder koriander, als dat kan. Dank je wel!",
        "No coriander if possible, please. Thank you!",
        "من دون كزبرة إن أمكن. شكرًا!",
      ),
      items: {
        create: [
          {
            dishId: dishMap["couscous-royal"],
            qty: 1,
            unitPrice: 16.5,
            name: L("Couscous royal met lam", "Couscous Royal with Lamb", "كسكسي ملكي باللحم"),
          },
          {
            dishId: dishMap["brik"],
            qty: 2,
            unitPrice: 4.9,
            name: L("Brik à l'œuf", "Brik à l'Œuf", "بريك بالبيض"),
          },
        ],
      },
    },
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
