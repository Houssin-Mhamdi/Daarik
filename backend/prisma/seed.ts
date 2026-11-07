import {
  PrismaClient,
  Role,
  CookStatus,
  DishStatus,
  OrderStatus,
  ComplianceStatus,
  StripeAccountStatus,
  PaymentStatus,
  ApplicationStatus,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { buildDishSearchText } from "../src/common/dish-search";

const prisma = new PrismaClient();
const L = (nl: string, en: string, ar: string) => ({ nl, en, ar });

async function main() {
  console.log("Seeding Darna PostgreSQL database...");

  // 1. Platform Settings
  // Pricing is stored in euro cents. Commission is 15% of the food subtotal
  // plus an optional fixed component; the €1.50 service fee is Daarik revenue
  // and is never commissioned.
  await prisma.platformSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      platformName: "Daarik",
      region: "NL",
      currency: "EUR",
      timezone: "Europe/Amsterdam",
      serviceFeeCents: 150,
      serviceFee: 1.5,
      commissionRate: 0.15,
      commissionFixedCents: 0,
      commissionBase: "SUBTOTAL",
      minOrderCents: 800,
      stripeFeeBearer: "PLATFORM",
      payoutHoldDays: 7,
      payoutInterval: "WEEKLY",
      payoutWeeklyAnchor: "monday",
      vatRateBps: 2100,
      requireVerification: true,
      autoApproveCooks: false,
      maintenanceMode: false,
      supportEmail: "hello@daarik.nl",
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
      // Daarik compliance gate (separate from Stripe KYC). These are demo
      // values; real KVK/NVWA checks must be done by an admin.
      complianceStatus: ComplianceStatus.APPROVED,
      complianceCheckedAt: new Date(),
      complianceCheckedBy: "seed",
      kvkNumber: "DEMO-0001",
      nvwaRegistered: true,
      stripeAccountStatus: StripeAccountStatus.NONE,
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
      complianceStatus: ComplianceStatus.APPROVED,
      complianceCheckedAt: new Date(),
      complianceCheckedBy: "seed",
      kvkNumber: "DEMO-0002",
      nvwaRegistered: true,
      stripeAccountStatus: StripeAccountStatus.NONE,
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
      complianceStatus: ComplianceStatus.APPROVED,
      complianceCheckedAt: new Date(),
      complianceCheckedBy: "seed",
      kvkNumber: "DEMO-0003",
      nvwaRegistered: true,
      stripeAccountStatus: StripeAccountStatus.NONE,
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
      complianceStatus: ComplianceStatus.APPROVED,
      complianceCheckedAt: new Date(),
      complianceCheckedBy: "seed",
      kvkNumber: "DEMO-0004",
      nvwaRegistered: true,
      stripeAccountStatus: StripeAccountStatus.NONE,
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
      slug: "couscous-veg",
      cookSlug: "rana",
      name: L("Couscous met zeven groenten", "Seven-Vegetable Couscous", "كسكسي بسبع خضار"),
      desc: L(
        "Een volledig plantaardige couscous met wortel, pompoen, kikkererwten, courgette en verse kruiden.",
        "A fully plant-based couscous with carrot, pumpkin, chickpeas, courgette and fresh herbs.",
        "كسكسي نباتي بالكامل مع جزر وقرع وحمص وكوسا وأعشاب طازجة.",
      ),
      image: "/img/couscous.jpg",
      price: 12.5,
      cuisineId: "tunisian",
      rating: 4.7,
      reviewCount: 38,
      serves: 2,
      portions: 10,
      portionsLeft: 6,
      allergens: ["gluten", "celery"],
      dietary: ["vegan", "halal"],
      ingredients: [L("Couscous", "Couscous", "كسكسي"), L("Kikkererwten", "Chickpeas", "حمص")],
      pickup: ["sat-31", "sun-01", "fri-06"],
      prepTime: L("2,5 uur", "2.5 hours", "ساعتان ونصف"),
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
      weekend: true,
      prepTime: L("2,5 uur", "2.5 hours", "ساعتان ونصف"),
    },
    {
      slug: "tagine-lamb",
      cookSlug: "omar",
      name: L("Lamsvleestajine met pruimen", "Lamb Tagine with Prunes", "طاجين لحم بالبرقوق"),
      desc: L(
        "Zacht lamsvlees met geconfijte pruimen, amandelen en kaneel.",
        "Tender lamb with candied prunes, almonds and cinnamon.",
        "لحم غنم طري مع برقوق معسّل ولوز وقرفة.",
      ),
      image: "/img/tagine.jpg",
      price: 17.0,
      cuisineId: "moroccan",
      rating: 5.0,
      reviewCount: 44,
      serves: 3,
      portions: 6,
      portionsLeft: 3,
      allergens: ["nuts"],
      dietary: ["halal", "glutenFree"],
      ingredients: [L("Lamsvlees", "Lamb", "لحم غنم"), L("Pruimen & amandelen", "Prunes & almonds", "برقوق ولوز")],
      pickup: ["sat-31", "sun-01"],
      family: true,
      badge: L("Familiemaaltijd", "Family meal", "وجبة عائلية"),
      prepTime: L("3 uur", "3 hours", "3 ساعات"),
    },
    {
      slug: "bastilla",
      cookSlug: "omar",
      name: L("Kipbastilla", "Chicken Bastilla", "بسطيلة دجاج"),
      desc: L(
        "Knapperig filodeeg gevuld met kip, amandelen en een vleugje kaneel.",
        "Crisp filo filled with chicken, almonds and a hint of cinnamon.",
        "عجين رقيق مقرمش محشو بالدجاج واللوز ولمسة قرفة.",
      ),
      image: "/img/brik.jpg",
      price: 8.5,
      cuisineId: "moroccan",
      rating: 4.8,
      reviewCount: 29,
      serves: 1,
      portions: 10,
      portionsLeft: 7,
      allergens: ["gluten", "egg", "nuts", "dairy"],
      dietary: ["halal"],
      ingredients: [L("Kip", "Chicken", "دجاج"), L("Filodeeg", "Filo pastry", "عجين رقيق")],
      pickup: ["fri-30", "sat-31"],
      prepTime: L("2 uur", "2 hours", "ساعتان"),
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
      family: true,
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
      slug: "maqluba",
      cookSlug: "fatima",
      name: L("Maqluba met kip", "Chicken Maqluba", "مقلوبة بالدجاج"),
      desc: L(
        "De klassieke omgekeerde rijsttafel: rijst, kip, aubergine en bloemkool, samen gestoomd.",
        "The classic upside-down rice dish: rice, chicken, aubergine and cauliflower steamed together.",
        "طبق الأرز المقلوب الكلاسيكي: أرز ودجاج وباذنجان وقرنبيط على البخار.",
      ),
      image: "/img/kibbeh.jpg",
      price: 14.75,
      cuisineId: "syrian",
      rating: 4.9,
      reviewCount: 27,
      serves: 3,
      portions: 6,
      portionsLeft: 4,
      allergens: ["nuts", "dairy"],
      dietary: ["halal", "glutenFree"],
      ingredients: [L("Rijst & kip", "Rice & chicken", "أرز ودجاج")],
      pickup: ["sat-31"],
      family: true,
      prepTime: L("2,5 uur", "2.5 hours", "ساعتان ونصف"),
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
    {
      slug: "hummus-lamb",
      cookSlug: "samira",
      name: L("Hummus met lam & pijnboompitten", "Hummus with Lamb & Pine Nuts", "حمص باللحم والصنوبر"),
      desc: L(
        "Zijdezachte hummus met warme tahini, gemarineerd lamsvlees en geroosterde pijnboompitten.",
        "Silky hummus with warm tahini, marinated lamb and toasted pine nuts.",
        "حمص ناعم مع طحينة دافئة ولحم متبّل وصنوبر محمّص.",
      ),
      image: "/img/kibbeh.jpg",
      price: 11.0,
      cuisineId: "lebanese",
      rating: 4.7,
      reviewCount: 35,
      serves: 1,
      portions: 10,
      portionsLeft: 6,
      allergens: ["sesame", "nuts", "dairy", "gluten"],
      dietary: ["halal", "spicy"],
      ingredients: [L("Kikkererwten & tahini", "Chickpeas & tahini", "حمص وطحينة")],
      pickup: ["fri-30", "sat-31", "sun-01"],
      prepTime: L("1 uur", "1 hour", "ساعة"),
    },
    {
      slug: "fatteh",
      cookSlug: "samira",
      name: L("Fatteh met kikkererwten", "Fatteh with Chickpeas & Yoghurt", "فتة بالحمص والزبادي"),
      desc: L(
        "Geroosterd platbrood, warme kikkererwten, knoflookyoghurt en geroosterde pijnboompitten.",
        "Toasted flatbread, warm chickpeas, garlicky yoghurt and toasted pine nuts.",
        "خبز محمّص وحمص دافئ وزبادي بالثوم وصنوبر محمّص.",
      ),
      image: "/img/brik.jpg",
      price: 10.5,
      cuisineId: "lebanese",
      rating: 4.9,
      reviewCount: 24,
      serves: 1,
      portions: 10,
      portionsLeft: 7,
      allergens: ["gluten", "dairy", "sesame", "nuts"],
      dietary: ["vegetarian"],
      ingredients: [L("Platbrood & yoghurt", "Flatbread & yoghurt", "خبز وزبادي")],
      pickup: ["sat-31", "sun-01"],
      weekend: true,
      prepTime: L("45 min", "45 min", "45 دقيقة"),
    },
  ];

  const dishMap: Record<string, string> = {};
  for (const d of dishesSeed) {
    const { cookSlug, ...rawDish } = d;
    const dishData = { ...rawDish, searchText: buildDishSearchText(rawDish) };
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

  // 4b. Reviews
  await prisma.review.deleteMany();
  await prisma.review.createMany({
    data: [
      {
        cookId: cookMap["rana"],
        dishId: dishMap["couscous-royal"],
        customerId: customerUser.id,
        author: "Sarah de Vries",
        initials: "SD",
        rating: 5,
        date: L("2 weken geleden", "2 weeks ago", "قبل أسبوعين"),
        text: L(
          "Echt de beste couscous die ik in Rotterdam heb gegeten. Nog warm bij het ophalen en zo vriendelijk ontvangen.",
          "Honestly the best couscous I've had in Rotterdam. Still warm at pickup and such a warm welcome.",
          "بصراحة أفضل كسكسي أكلته في روتردام. كان دافئًا عند الاستلام والاستقبال كان دافئًا أيضًا.",
        ),
      },
      {
        cookId: cookMap["fatima"],
        dishId: dishMap["kibbeh"],
        author: "Youssef A.",
        initials: "YA",
        rating: 5,
        date: L("1 maand geleden", "1 month ago", "قبل شهر"),
        text: L(
          "De kibbeh smaakte precies zoals thuis in Damascus. Mooi verpakt en duidelijke ophaalinstructies.",
          "The kibbeh tasted exactly like home in Damascus. Beautifully packed and clear pickup instructions.",
          "الكبة كانت بطعم البيت في دمشق تمامًا. التغليف جميل وتعليمات الاستلام واضحة.",
        ),
      },
      {
        cookId: cookMap["omar"],
        dishId: dishMap["tagine-chicken"],
        author: "Lotte Jansen",
        initials: "LJ",
        rating: 5,
        date: L("3 weken geleden", "3 weeks ago", "قبل 3 أسابيع"),
        text: L(
          "De tajine was boterzacht en de citroen maakte het af. Omar gaf nog een extra zakje brood mee.",
          "The tagine was melt-in-the-mouth and the lemon made it. Omar even added an extra bag of bread.",
          "الطاجين كان طريًا جدًا والليمون أكمل الطعم. أعطاني عمر كيس خبز إضافيًا.",
        ),
      },
      {
        cookId: cookMap["samira"],
        dishId: dishMap["warak-enab"],
        author: "Nadia H.",
        initials: "NH",
        rating: 5,
        date: L("5 dagen geleden", "5 days ago", "قبل 5 أيام"),
        text: L(
          "Perfect gerold en niet te zuur. Ik heb meteen twee porties extra besteld voor mijn moeder.",
          "Perfectly rolled and not too sour. I immediately ordered two extra portions for my mother.",
          "ملفوف بإتقان وغير حامض أكثر من اللازم. طلبت حصتين إضافيتين لأمي فورًا.",
        ),
      },
      {
        cookId: cookMap["rana"],
        dishId: dishMap["brik"],
        author: "Mehdi B.",
        initials: "MB",
        rating: 4,
        date: L("1 week geleden", "1 week ago", "قبل أسبوع"),
        text: L(
          "Heerlijk krokant, het ei was precies goed. Volgende keer bestel ik er twee.",
          "Lovely and crisp, the egg was just right. Next time I'm ordering two.",
          "مقرمش ولذيذ، والبيضة كانت مثالية. في المرة القادمة سأطلب اثنين.",
        ),
      },
      {
        cookId: cookMap["fatima"],
        dishId: dishMap["stuffed-aubergine"],
        author: "Emma V.",
        initials: "EV",
        rating: 5,
        date: L("2 maanden geleden", "2 months ago", "قبل شهرين"),
        text: L(
          "Zo veel smaak in één gerecht. Fatima legde ook nog uit hoe ik het het beste kon opwarmen.",
          "So much flavour in one dish. Fatima also explained the best way to reheat it.",
          "نكهة غنية جدًا في طبق واحد. شرحت لي فاطمة أيضًا أفضل طريقة لتسخينه.",
        ),
      },
    ],
  });

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

  // 6. Sample order for Sarah
  //
  // Deliberately left in REQUIRES_PAYMENT: no order is ever seeded as paid,
  // because `paymentStatus = PAID` must only ever come from a verified Stripe
  // webhook. To exercise the full flow, complete Stripe test onboarding as the
  // cook, then pay this order through Checkout.
  //
  // 26.30 food + 1.50 service fee - 15% commission (3.95) = 22.35 for the cook.
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
      subtotalCents: 2630,
      serviceFeeCents: 150,
      commissionCents: 395,
      cookNetCents: 2235,
      totalCents: 2780,
      currency: "eur",
      customerName: "Sarah de Vries",
      customerEmail: "sarah.devries@example.nl",
      customerPhone: "+31 6 12 34 56 78",
      paymentStatus: PaymentStatus.REQUIRES_PAYMENT,
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
            unitPriceCents: 1650,
            name: L("Couscous royal met lam", "Couscous Royal with Lamb", "كسكسي ملكي باللحم"),
          },
          {
            dishId: dishMap["brik"],
            qty: 2,
            unitPriceCents: 490,
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
