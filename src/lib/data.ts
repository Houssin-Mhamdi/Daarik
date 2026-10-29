import type { Lang } from "@/lib/i18n";

export type Localized = Record<Lang, string>;

export const L = (nl: string, en: string, ar: string): Localized => ({
  nl,
  en,
  ar,
});

export function loc(value: Localized | string | undefined, lang: Lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] ?? value.en;
}

export const SERVICE_FEE = 1.5;

export type CuisineId =
  | "tunisian"
  | "moroccan"
  | "syrian"
  | "lebanese"
  | "turkish"
  | "egyptian";

export const cuisines: {
  id: CuisineId;
  label: Localized;
  flag: string;
  image: string;
}[] = [
  {
    id: "tunisian",
    label: L("Tunesisch", "Tunisian", "تونسي"),
    flag: "🇹🇳",
    image: "/img/brik.jpg",
  },
  {
    id: "moroccan",
    label: L("Marokkaans", "Moroccan", "مغربي"),
    flag: "🇲🇦",
    image: "/img/tagine.jpg",
  },
  {
    id: "syrian",
    label: L("Syrisch", "Syrian", "سوري"),
    flag: "🇸🇾",
    image: "/img/kibbeh.jpg",
  },
  {
    id: "lebanese",
    label: L("Libanees", "Lebanese", "لبناني"),
    flag: "🇱🇧",
    image: "/img/stuffed.jpg",
  },
  {
    id: "turkish",
    label: L("Turks", "Turkish", "تركي"),
    flag: "🇹🇷",
    image: "/img/couscous.jpg",
  },
  {
    id: "egyptian",
    label: L("Egyptisch", "Egyptian", "مصري"),
    flag: "🇪🇬",
    image: "/img/tagine.jpg",
  },
];

export const allergenNames: Record<string, Localized> = {
  gluten: L("Gluten", "Gluten", "الغلوتين"),
  egg: L("Ei", "Egg", "البيض"),
  dairy: L("Zuivel", "Dairy", "الألبان"),
  nuts: L("Noten", "Nuts", "المكسرات"),
  sesame: L("Sesam", "Sesame", "السمسم"),
  celery: L("Selderij", "Celery", "الكرفس"),
  fish: L("Vis", "Fish", "السمك"),
  shellfish: L("Schaaldieren", "Shellfish", "المحاريات"),
  soy: L("Soja", "Soy", "الصويا"),
  mustard: L("Mosterd", "Mustard", "الخردل"),
};

export const dietaryNames: Record<string, Localized> = {
  vegetarian: L("Vegetarisch", "Vegetarian", "نباتي"),
  vegan: L("Veganistisch", "Vegan", "نباتي صرف"),
  halal: L("Halal", "Halal", "حلال"),
  glutenFree: L("Glutenvrij", "Gluten-free", "خالٍ من الغلوتين"),
  nutFree: L("Notenvrij", "Nut-free", "خالٍ من المكسرات"),
  dairyFree: L("Zuivelvrij", "Dairy-free", "خالٍ من الألبان"),
  spicy: L("Pittig", "Spicy", "حار"),
};

export type PickupOption = {
  id: string;
  day: Localized;
  shortDay: Localized;
  date: string;
  slots: string[];
};

export const pickupOptions: PickupOption[] = [
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

export type Cook = {
  id: string;
  name: string;
  avatar: string;
  cover: string;
  city: string;
  area: Localized;
  cuisineIds: CuisineId[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  languages: string[];
  bio: Localized;
  since: string;
  orders: number;
  response: Localized;
  pickupArea: Localized;
  specialties: Localized;
  instructions: Localized;
  yearsCooking: number;
};

export const cooks: Cook[] = [
  {
    id: "rana",
    name: "Rana El Amri",
    avatar: "/img/cook-rana.jpg",
    cover: "/img/couscous.jpg",
    city: "Rotterdam",
    area: L("Delfshaven", "Delfshaven", "دلفسهافن"),
    cuisineIds: ["tunisian"],
    rating: 4.9,
    reviewCount: 128,
    verified: true,
    languages: ["Nederlands", "العربية", "English", "Français"],
    bio: L(
      "Ik ben opgegroeid in Tunis en kook al mijn hele leven voor familie en vrienden. Mijn couscous staat elk weekend uren te stomen — precies zoals mijn moeder het deed. Ik kook in kleine batches, met verse kruiden van de markt.",
      "I grew up in Tunis and have cooked for family and friends all my life. My couscous steams for hours every weekend — exactly the way my mother made it. I cook in small batches with fresh herbs from the market.",
      "نشأت في تونس وأطبخ لعائلتي وأصدقائي طوال حياتي. الكسكسي عندي يُبخّر ساعات كل نهاية أسبوع، تمامًا كما كانت تفعل أمي. أطبخ بكميات صغيرة وأعشاب طازجة من السوق.",
    ),
    since: "2023",
    orders: 840,
    response: L("1 uur", "1 hour", "ساعة"),
    pickupArea: L("Rotterdam-West", "Rotterdam West", "غرب روتردام"),
    specialties: L("Couscous · Brik · Harissa", "Couscous · Brik · Harissa", "كسكسي · بريك · هريسة"),
    instructions: L(
      "Bel twee keer aan bij nummer 14. Ik woon op de begane grond, de deur is aan de zijkant. Neem je bestelnummer mee.",
      "Ring the bell twice at number 14. I'm on the ground floor, the door is on the side. Please bring your order number.",
      "اطلب الجرس مرتين عند الرقم 14. أسكن في الطابق الأرضي، والباب على الجانب. أحضر رقم طلبك.",
    ),
    yearsCooking: 22,
  },
  {
    id: "omar",
    name: "Omar Benali",
    avatar: "/img/cook-omar.jpg",
    cover: "/img/tagine.jpg",
    city: "Amsterdam",
    area: L("De Baarsjes", "De Baarsjes", "دي بارسخس"),
    cuisineIds: ["moroccan"],
    rating: 4.8,
    reviewCount: 96,
    verified: true,
    languages: ["Nederlands", "العربية", "English"],
    bio: L(
      "Mijn tagines sudderen op vrijdag al vanaf de ochtend. Ik gebruik olijfolie van mijn familie uit Meknes en bewaar citroenen zelf in. Kom gerust een praatje maken bij het ophalen.",
      "My tagines simmer from Friday morning. I use olive oil from my family in Meknes and preserve my own lemons. Come say hello when you pick up.",
      "طواجني تطبخ على نار هادئة من صباح الجمعة. أستخدم زيت زيتون من عائلتي في مكناس وأحفظ الليمون بنفسي. مرّ للسلام عند الاستلام.",
    ),
    since: "2022",
    orders: 1240,
    response: L("2 uur", "2 hours", "ساعتان"),
    pickupArea: L("Amsterdam-West", "Amsterdam West", "غرب أمستردام"),
    specialties: L("Tajine · Bastilla · M'semen", "Tagine · Bastilla · M'semen", "طاجين · بسطيلة · مسمن"),
    instructions: L(
      "Zoek de groene deur naast de bakkerij. Bel aan bij 'Benali'. Ik geef je het eten in een warme tas mee.",
      "Look for the green door next to the bakery. Ring 'Benali'. Your food comes in an insulated bag.",
      "ابحث عن الباب الأخضر بجانب المخبز. اطلب جرس «بنعلي». طعامك سيأتي في حقيبة حافظة للحرارة.",
    ),
    yearsCooking: 15,
  },
  {
    id: "fatima",
    name: "Fatima Haddad",
    avatar: "/img/cook-fatima.jpg",
    cover: "/img/kibbeh.jpg",
    city: "Utrecht",
    area: L("Lombok", "Lombok", "لومبوك"),
    cuisineIds: ["syrian"],
    rating: 5.0,
    reviewCount: 74,
    verified: true,
    languages: ["العربية", "Nederlands", "English"],
    bio: L(
      "Ik kwam in 2016 vanuit Aleppo naar Utrecht. Koken is mijn manier om thuis te voelen — en om mijn buren kennis te laten maken met de keuken van mijn stad. Alles wordt met de hand gevuld.",
      "I came to Utrecht from Aleppo in 2016. Cooking is how I feel at home — and how I introduce my neighbours to the food of my city. Everything is filled by hand.",
      "جئت إلى أوترخت من حلب عام 2016. الطبخ هو طريقتي لأشعر بالبيت، ولأعرّف جيراني على مطبخ مدينتي. كل شيء يُحشى يدويًا.",
    ),
    since: "2024",
    orders: 390,
    response: L("1 uur", "1 hour", "ساعة"),
    pickupArea: L("Utrecht-West", "Utrecht West", "غرب أوترخت"),
    specialties: L("Kibbeh · Maqluba · Fatteh", "Kibbeh · Maqluba · Fatteh", "كبة · مقلوبة · فتة"),
    instructions: L(
      "Je vindt me op de hoek bij het kleine park. Bel als je er bent, dan doe ik de deur open. Huisnummer deel ik na je bestelling.",
      "You'll find me on the corner by the small park. Call when you arrive and I'll open the door. I share the house number after you order.",
      "تجدني على الزاوية بجانب الحديقة الصغيرة. اتصل عند وصولك وسأفتح الباب. أشارك رقم المنزل بعد الطلب.",
    ),
    yearsCooking: 30,
  },
  {
    id: "samira",
    name: "Samira Khoury",
    avatar: "/img/cook-samira.jpg",
    cover: "/img/stuffed.jpg",
    city: "Den Haag",
    area: L("Statenkwartier", "Statenkwartier", "ستاتنكوارتيير"),
    cuisineIds: ["lebanese"],
    rating: 4.9,
    reviewCount: 63,
    verified: true,
    languages: ["العربية", "English", "Français"],
    bio: L(
      "Mijn grootmoeder leerde me warak enab rollen toen ik zes was. Ik maak alles vegetarisch of met zorg gekozen vlees, en gebruik veel citroen, olijfolie en verse kruiden.",
      "My grandmother taught me to roll vine leaves when I was six. I make everything vegetarian or with carefully chosen meat, with plenty of lemon, olive oil and fresh herbs.",
      "علّمتني جدتي لفّ ورق العنب عندما كان عمري ست سنوات. أُعدّ كل شيء نباتيًا أو بلحوم مختارة بعناية، مع الكثير من الليمون وزيت الزيتون والأعشاب الطازجة.",
    ),
    since: "2023",
    orders: 510,
    response: L("3 uur", "3 hours", "3 ساعات"),
    pickupArea: L("Den Haag centrum", "The Hague centre", "وسط لاهاي"),
    specialties: L("Warak enab · Hummus · Fatteh", "Warak enab · Hummus · Fatteh", "ورق عنب · حمص · فتة"),
    instructions: L(
      "Bel aan bij de bel met 'Khoury'. Ik woon op de eerste verdieping. Het adres stuur ik je de dag voor het ophalen.",
      "Ring the bell marked 'Khoury'. I'm on the first floor. I'll send the address the day before pickup.",
      "اطلب الجرس المكتوب عليه «خوري». أسكن في الطابق الأول. سأرسل العنوان قبل يوم من الاستلام.",
    ),
    yearsCooking: 18,
  },
];

export type Dish = {
  id: string;
  cookId: string;
  name: Localized;
  desc: Localized;
  image: string;
  price: number;
  cuisineId: CuisineId;
  rating: number;
  reviewCount: number;
  serves: number;
  portions: number;
  portionsLeft: number;
  allergens: string[];
  dietary: string[];
  ingredients: Localized[];
  pickup: string[];
  featured?: boolean;
  weekend?: boolean;
  family?: boolean;
  badge?: Localized;
  prepTime: Localized;
};

const ingredients = {
  couscous: [
    L("Lamsvlees", "Lamb", "لحم غنم"),
    L("Couscous", "Couscous", "كسكسي"),
    L("Kikkererwten", "Chickpeas", "حمص"),
    L("Wortel & courgette", "Carrot & courgette", "جزر وكوسا"),
    L("Harissa", "Harissa", "هريسة"),
  ],
  brik: [
    L("Mals deeg", "Thin pastry", "عجين رقيق"),
    L("Ei", "Egg", "بيض"),
    L("Tonijn", "Tuna", "تونة"),
    L("Aardappel", "Potato", "بطاطس"),
    L("Peterselie & kappertjes", "Parsley & capers", "بقدونس وكبر"),
  ],
  tagine: [
    L("Kip", "Chicken", "دجاج"),
    L("Bewaard citroen", "Preserved lemon", "ليمون مخلل"),
    L("Groene olijven", "Green olives", "زيتون أخضر"),
    L("Saffraan & gember", "Saffron & ginger", "زعفران وزنجبيل"),
  ],
  kibbeh: [
    L("Lam & bulgur", "Lamb & bulgur", "لحم غنم وبرغل"),
    L("Pijnboompitten", "Pine nuts", "صنوبر"),
    L("Ui & baharat", "Onion & baharat", "بصل وبهارات"),
    L("Yoghurt", "Yoghurt", "زبادي"),
  ],
  stuffed: [
    L("Aubergine", "Aubergine", "باذنجان"),
    L("Rijst", "Rice", "أرز"),
    L("Tomaten", "Tomatoes", "طماطم"),
    L("Verse kruiden", "Fresh herbs", "أعشاب طازجة"),
  ],
  warak: [
    L("Wijnbladeren", "Vine leaves", "ورق عنب"),
    L("Rijst", "Rice", "أرز"),
    L("Citroen & olijfolie", "Lemon & olive oil", "ليمون وزيت زيتون"),
    L("Munt & peterselie", "Mint & parsley", "نعناع وبقدونس"),
  ],
};

export const dishes: Dish[] = [
  {
    id: "couscous-royal",
    cookId: "rana",
    name: L(
      "Couscous royal met lam",
      "Couscous Royal with Lamb",
      "كسكسي ملكي باللحم",
    ),
    desc: L(
      "Handgestoomde couscous met mals lamsvlees, kikkererwten en seizoensgroenten. Geserveerd met harissa en een frisse salade. Een weekendgerecht voor twee.",
      "Hand-steamed couscous with tender lamb, chickpeas and seasonal vegetables. Served with harissa and a fresh salad. A weekend dish for two.",
      "كسكسي مبخّر يدويًا مع لحم غنم طري وحمص وخضار موسمية. يُقدّم مع هريسة وسلطة منعشة. طبق نهاية الأسبوع لشخصين.",
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
    ingredients: ingredients.couscous,
    pickup: ["sat-31", "sun-01"],
    featured: true,
    weekend: true,
    badge: L("Weekendspecial", "Weekend special", "عرض نهاية الأسبوع"),
    prepTime: L("3 uur", "3 hours", "3 ساعات"),
  },
  {
    id: "brik",
    cookId: "rana",
    name: L("Brik à l'œuf", "Brik à l'Œuf", "بريك بالبيض"),
    desc: L(
      "Krokant gefrituurde deegflap met een vloeibaar eigeel, tonijn, aardappel en kappertjes. Best eet je hem meteen — ik frituur per bestelling.",
      "Crisp fried pastry with a runny yolk, tuna, potato and capers. Best eaten straight away — I fry each one to order.",
      "عجينة مقرمشة مقلية مع صفار بيض طري وتونة وبطاطس وكبر. الأفضل تناولها فورًا — أقليها عند كل طلب.",
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
    ingredients: ingredients.brik,
    pickup: ["fri-30", "sat-31"],
    prepTime: L("15 min", "15 min", "15 دقيقة"),
  },
  {
    id: "couscous-veg",
    cookId: "rana",
    name: L(
      "Couscous met zeven groenten",
      "Seven-Vegetable Couscous",
      "كسكسي بسبع خضار",
    ),
    desc: L(
      "Een volledig plantaardige couscous met wortel, pompoen, kikkererwten, courgette en verse kruiden. Veel smaak, geen dierlijke producten.",
      "A fully plant-based couscous with carrot, pumpkin, chickpeas, courgette and fresh herbs. Big flavour, no animal products.",
      "كسكسي نباتي بالكامل مع جزر وقرع وحمص وكوسا وأعشاب طازجة. نكهة غنية بلا مكونات حيوانية.",
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
    ingredients: ingredients.couscous,
    pickup: ["sat-31", "sun-01", "fri-06"],
    prepTime: L("2,5 uur", "2.5 hours", "ساعتان ونصف"),
  },
  {
    id: "tagine-chicken",
    cookId: "omar",
    name: L(
      "Kiptajine met citroen & olijven",
      "Chicken Tagine with Lemon & Olives",
      "طاجين دجاج بالليمون والزيتون",
    ),
    desc: L(
      "Langzaam gestoofde kip met bewaarde citroen, groene olijven en saffraan. Serveren met vers brood om de saus mee op te deppen.",
      "Slow-braised chicken with preserved lemon, green olives and saffron. Serve with fresh bread to mop up the sauce.",
      "دجاج مطبوخ ببطء مع ليمون مخلل وزيتون أخضر وزعفران. يُقدّم مع خبز طازج لتغميس الصلصة.",
    ),
    image: "/img/tagine.jpg",
    price: 14.5,
    cuisineId: "moroccan",
    rating: 4.9,
    reviewCount: 72,
    serves: 2,
    portions: 8,
    portionsLeft: 4,
    allergens: [],
    dietary: ["halal", "glutenFree", "dairyFree"],
    ingredients: ingredients.tagine,
    pickup: ["fri-30", "sat-31"],
    weekend: true,
    prepTime: L("2 uur", "2 hours", "ساعتان"),
  },
  {
    id: "tagine-lamb",
    cookId: "omar",
    name: L(
      "Lamsvleestajine met pruimen",
      "Lamb Tagine with Prunes",
      "طاجين لحم بالبرقوق",
    ),
    desc: L(
      "Zacht lamsvlees met geconfijte pruimen, amandelen en kaneel. Een zoete, diepe tajine die je normaal alleen bij familie thuis eet. Voor drie personen.",
      "Tender lamb with candied prunes, almonds and cinnamon. A sweet, deep tagine you normally only eat at a family table. Serves three.",
      "لحم غنم طري مع برقوق معسّل ولوز وقرفة. طاجين حلو وعميق تأكله عادة على مائدة العائلة فقط. يكفي ثلاثة أشخاص.",
    ),
    image: "/img/tagine.jpg",
    price: 17,
    cuisineId: "moroccan",
    rating: 5,
    reviewCount: 44,
    serves: 3,
    portions: 6,
    portionsLeft: 3,
    allergens: ["nuts"],
    dietary: ["halal", "glutenFree"],
    ingredients: ingredients.tagine,
    pickup: ["sat-31", "sun-01"],
    family: true,
    badge: L("Familiemaaltijd", "Family meal", "وجبة عائلية"),
    prepTime: L("3 uur", "3 hours", "3 ساعات"),
  },
  {
    id: "bastilla",
    cookId: "omar",
    name: L("Kipbastilla", "Chicken Bastilla", "بسطيلة دجاج"),
    desc: L(
      "Knapperig filodeeg gevuld met kip, amandelen en een vleugje kaneel. Zoet en hartig tegelijk, met poedersuiker en kaneel erover.",
      "Crisp filo filled with chicken, almonds and a hint of cinnamon. Sweet and savoury at once, dusted with icing sugar and cinnamon.",
      "عجين رقيق مقرمش محشو بالدجاج واللوز ولمسة قرفة. حلو ومالح في آن، يُرش بالسكر الناعم والقرفة.",
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
    ingredients: [
      L("Kip", "Chicken", "دجاج"),
      L("Filodeeg", "Filo pastry", "عجين رقيق"),
      L("Amandelen", "Almonds", "لوز"),
      L("Kaneel", "Cinnamon", "قرفة"),
    ],
    pickup: ["fri-30", "sat-31"],
    prepTime: L("2 uur", "2 hours", "ساعتان"),
  },
  {
    id: "kibbeh",
    cookId: "fatima",
    name: L("Kibbeh bil sanieh", "Kibbeh bil Sanieh", "كبة بالصينية"),
    desc: L(
      "Een goudbruine laag bulgur en lam, gevuld met pijnboompitten, ui en baharat. Gesneden als een taart en geserveerd met koele yoghurt.",
      "A golden layer of bulgur and lamb filled with pine nuts, onion and baharat. Sliced like a pie and served with cool yoghurt.",
      "طبقة ذهبية من البرغل واللحم محشوة بالصنوبر والبصل والبهارات. تُقطع كالكعكة وتُقدّم مع زبادي بارد.",
    ),
    image: "/img/kibbeh.jpg",
    price: 13,
    cuisineId: "syrian",
    rating: 5,
    reviewCount: 56,
    serves: 2,
    portions: 8,
    portionsLeft: 3,
    allergens: ["gluten", "nuts", "dairy"],
    dietary: ["halal"],
    ingredients: ingredients.kibbeh,
    pickup: ["fri-30", "sun-01"],
    family: true,
    prepTime: L("2 uur", "2 hours", "ساعتان"),
  },
  {
    id: "stuffed-aubergine",
    cookId: "fatima",
    name: L(
      "Gevulde aubergine (Sheikh el Mahshi)",
      "Stuffed Aubergine (Sheikh el Mahshi)",
      "باذنجان محشي (شيخ المحشي)",
    ),
    desc: L(
      "Geroosterde aubergine gevuld met gekruid gehakt, rijst en tomaat, in een rijke tomatensaus. Troostend, zacht en vol smaak.",
      "Roasted aubergine filled with spiced mince, rice and tomato in a rich tomato sauce. Comforting, soft and full of flavour.",
      "باذنجان مشوي محشو باللحم المفروم والأرز والطماطم في صلصة غنية. طبق مريح وطري ومليء بالنكهة.",
    ),
    image: "/img/stuffed.jpg",
    price: 12,
    cuisineId: "syrian",
    rating: 4.9,
    reviewCount: 33,
    serves: 2,
    portions: 8,
    portionsLeft: 5,
    allergens: ["dairy"],
    dietary: ["halal", "glutenFree"],
    ingredients: ingredients.stuffed,
    pickup: ["sat-31", "sun-01"],
    prepTime: L("2 uur", "2 hours", "ساعتان"),
  },
  {
    id: "maqluba",
    cookId: "fatima",
    name: L("Maqluba met kip", "Chicken Maqluba", "مقلوبة بالدجاج"),
    desc: L(
      "De klassieke omgekeerde rijsttafel: rijst, kip, aubergine en bloemkool, samen gestoomd en op tafel omgedraaid. Met een kom yoghurt en salade.",
      "The classic upside-down rice dish: rice, chicken, aubergine and cauliflower steamed together and flipped at the table. Served with yoghurt and salad.",
      "طبق الأرز المقلوب الكلاسيكي: أرز ودجاج وباذنجان وقرنبيط على البخار ثم يُقلب على المائدة. يُقدّم مع زبادي وسلطة.",
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
    ingredients: ingredients.stuffed,
    pickup: ["sat-31"],
    family: true,
    prepTime: L("2,5 uur", "2.5 hours", "ساعتان ونصف"),
  },
  {
    id: "warak-enab",
    cookId: "samira",
    name: L("Warak enab", "Warak Enab (Stuffed Vine Leaves)", "ورق عنب"),
    desc: L(
      "Fijngerolde wijnbladeren met rijst, citroen, munt en olijfolie. Koel geserveerd, plantaardig en precies zuur genoeg.",
      "Finely rolled vine leaves with rice, lemon, mint and olive oil. Served cool, plant-based and just sour enough.",
      "ورق عنب ملفوف بعناية مع أرز وليمون ونعناع وزيت زيتون. يُقدّم باردًا، نباتيًا وبحموضة متوازنة.",
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
    ingredients: ingredients.warak,
    pickup: ["fri-30", "sat-31"],
    prepTime: L("1,5 uur", "1.5 hours", "ساعة ونصف"),
  },
  {
    id: "hummus-lamb",
    cookId: "samira",
    name: L(
      "Hummus met lam & pijnboompitten",
      "Hummus with Lamb & Pine Nuts",
      "حمص باللحم والصنوبر",
    ),
    desc: L(
      "Zijdezachte hummus met warme tahini, gemarineerd lamsvlees en geroosterde pijnboompitten. Met platbrood om te delen.",
      "Silky hummus with warm tahini, marinated lamb and toasted pine nuts. Served with flatbread to share.",
      "حمص ناعم مع طحينة دافئة ولحم متبّل وصنوبر محمّص. يُقدّم مع خبز للمشاركة.",
    ),
    image: "/img/kibbeh.jpg",
    price: 11,
    cuisineId: "lebanese",
    rating: 4.7,
    reviewCount: 35,
    serves: 1,
    portions: 10,
    portionsLeft: 6,
    allergens: ["sesame", "nuts", "dairy", "gluten"],
    dietary: ["halal", "spicy"],
    ingredients: ingredients.kibbeh,
    pickup: ["fri-30", "sat-31", "sun-01"],
    prepTime: L("1 uur", "1 hour", "ساعة"),
  },
  {
    id: "fatteh",
    cookId: "samira",
    name: L(
      "Fatteh met kikkererwten",
      "Fatteh with Chickpeas & Yoghurt",
      "فتة بالحمص والزبادي",
    ),
    desc: L(
      "Geroosterd platbrood, warme kikkererwten, knoflookyoghurt en geroosterde pijnboompitten. Een kom ontbijt die je de hele dag vult.",
      "Toasted flatbread, warm chickpeas, garlicky yoghurt and toasted pine nuts. A breakfast bowl that keeps you going all day.",
      "خبز محمّص وحمص دافئ وزبادي بالثوم وصنوبر محمّص. وعاء فطور يشبعك طوال اليوم.",
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
    ingredients: ingredients.warak,
    pickup: ["sat-31", "sun-01"],
    weekend: true,
    prepTime: L("45 min", "45 min", "45 دقيقة"),
  },
];

export type Review = {
  id: string;
  cookId: string;
  dishId?: string;
  author: string;
  initials: string;
  rating: number;
  date: Localized;
  text: Localized;
};

export const reviews: Review[] = [
  {
    id: "rev-1",
    cookId: "rana",
    dishId: "couscous-royal",
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
    id: "rev-2",
    cookId: "fatima",
    dishId: "kibbeh",
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
    id: "rev-3",
    cookId: "omar",
    dishId: "tagine-chicken",
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
    id: "rev-4",
    cookId: "samira",
    dishId: "warak-enab",
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
    id: "rev-5",
    cookId: "rana",
    dishId: "brik",
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
    id: "rev-6",
    cookId: "fatima",
    dishId: "stuffed-aubergine",
    author: "Emma V.",
    initials: "EV",
    rating: 5,
    date: L("2 maanden geleden", "2 months ago", "قبل شهرين"),
    text: L(
      "Zo zacht en vol smaak. Fatima legde precies uit welke allergenen erin zaten.",
      "So soft and full of flavour. Fatima explained exactly which allergens were in it.",
      "طرية جدًا ومليئة بالنكهة. شرحت فاطمة بالضبط مسببات الحساسية الموجودة.",
    ),
  },
];

export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderItem = { dishId: string; qty: number };

export type CustomerOrder = {
  id: string;
  code: string;
  cookId: string;
  items: OrderItem[];
  status: OrderStatus;
  pickup: string;
  pickupTime: string;
  placed: Localized;
  note?: Localized;
  reviewed?: boolean;
  refunded?: boolean;
  paid: boolean;
};

export const customerOrders: CustomerOrder[] = [
  {
    id: "o-2418",
    code: "DR-2418",
    cookId: "rana",
    items: [
      { dishId: "couscous-royal", qty: 1 },
      { dishId: "brik", qty: 2 },
    ],
    status: "preparing",
    pickup: "sat-31",
    pickupTime: "18:00",
    placed: L("2 dagen geleden", "2 days ago", "قبل يومين"),
    note: L(
      "Graag zonder koriander, als dat kan. Dank je wel!",
      "No coriander if possible, please. Thank you!",
      "من دون كزبرة إن أمكن. شكرًا!",
    ),
    paid: true,
  },
  {
    id: "o-2421",
    code: "DR-2421",
    cookId: "fatima",
    items: [{ dishId: "kibbeh", qty: 1 }],
    status: "confirmed",
    pickup: "fri-30",
    pickupTime: "17:30",
    placed: L("Gisteren", "Yesterday", "أمس"),
    paid: true,
  },
  {
    id: "o-2394",
    code: "DR-2394",
    cookId: "fatima",
    items: [{ dishId: "stuffed-aubergine", qty: 2 }],
    status: "completed",
    pickup: "sun-01",
    pickupTime: "13:00",
    placed: L("18 oktober 2026", "18 October 2026", "18 أكتوبر 2026"),
    reviewed: false,
    paid: true,
  },
  {
    id: "o-2371",
    code: "DR-2371",
    cookId: "omar",
    items: [{ dishId: "tagine-chicken", qty: 1 }],
    status: "cancelled",
    pickup: "fri-30",
    pickupTime: "19:00",
    placed: L("4 oktober 2026", "4 October 2026", "4 أكتوبر 2026"),
    refunded: true,
    paid: false,
  },
];

export type CookOrder = {
  id: string;
  code: string;
  customer: string;
  initials: string;
  items: OrderItem[];
  status: "incoming" | "preparing" | "ready" | "completed";
  pickup: Localized;
  pickupTime: string;
  total: number;
  note?: Localized;
  phone: string;
  placed: Localized;
};

export const cookOrders: CookOrder[] = [
  {
    id: "co-1",
    code: "DR-2418",
    customer: "Sarah de Vries",
    initials: "SD",
    items: [
      { dishId: "couscous-royal", qty: 1 },
      { dishId: "brik", qty: 2 },
    ],
    status: "incoming",
    pickup: L("Vandaag", "Today", "اليوم"),
    pickupTime: "18:00",
    total: 27.8,
    note: L(
      "Graag zonder koriander, als dat kan. Dank je wel!",
      "No coriander if possible, please. Thank you!",
      "من دون كزبرة إن أمكن. شكرًا!",
    ),
    phone: "+31 6 12 34 56 78",
    placed: L("12 min geleden", "12 min ago", "قبل 12 دقيقة"),
  },
  {
    id: "co-2",
    code: "DR-2422",
    customer: "Thomas Bakker",
    initials: "TB",
    items: [{ dishId: "couscous-royal", qty: 2 }],
    status: "incoming",
    pickup: L("Vandaag", "Today", "اليوم"),
    pickupTime: "18:30",
    total: 34.5,
    phone: "+31 6 24 88 11 09",
    placed: L("25 min geleden", "25 min ago", "قبل 25 دقيقة"),
  },
  {
    id: "co-3",
    code: "DR-2419",
    customer: "Amira El Fassi",
    initials: "AE",
    items: [{ dishId: "couscous-veg", qty: 1 }],
    status: "preparing",
    pickup: L("Vandaag", "Today", "اليوم"),
    pickupTime: "17:30",
    total: 14,
    note: L(
      "Ik kom met de fiets, kan iets later zijn.",
      "I'm coming by bike, might be a little late.",
      "سآتي بالدراجة، قد أتأخر قليلًا.",
    ),
    phone: "+31 6 37 52 41 20",
    placed: L("1 uur geleden", "1 hour ago", "قبل ساعة"),
  },
  {
    id: "co-4",
    code: "DR-2415",
    customer: "Lisa Meijer",
    initials: "LM",
    items: [{ dishId: "brik", qty: 3 }],
    status: "ready",
    pickup: L("Vandaag", "Today", "اليوم"),
    pickupTime: "16:30",
    total: 16.2,
    phone: "+31 6 18 20 33 47",
    placed: L("2 uur geleden", "2 hours ago", "قبل ساعتين"),
  },
  {
    id: "co-5",
    code: "DR-2406",
    customer: "Karim Ouahbi",
    initials: "KO",
    items: [{ dishId: "couscous-royal", qty: 1 }],
    status: "completed",
    pickup: L("Gisteren", "Yesterday", "أمس"),
    pickupTime: "18:00",
    total: 18,
    phone: "+31 6 55 10 22 31",
    placed: L("Gisteren", "Yesterday", "أمس"),
  },
];

export type Payout = {
  id: string;
  date: Localized;
  amount: number;
  status: "paid" | "pending";
  orders: number;
};

export const payouts: Payout[] = [
  {
    id: "p-1",
    date: L("21 okt 2026", "21 Oct 2026", "21 أكتوبر 2026"),
    amount: 412.25,
    status: "paid",
    orders: 31,
  },
  {
    id: "p-2",
    date: L("14 okt 2026", "14 Oct 2026", "14 أكتوبر 2026"),
    amount: 389.1,
    status: "paid",
    orders: 28,
  },
  {
    id: "p-3",
    date: L("7 okt 2026", "7 Oct 2026", "7 أكتوبر 2026"),
    amount: 447.8,
    status: "paid",
    orders: 34,
  },
  {
    id: "p-4",
    date: L("30 sep 2026", "30 Sep 2026", "30 سبتمبر 2026"),
    amount: 356.4,
    status: "paid",
    orders: 26,
  },
];

export const cookEarnings = {
  gross: 612.4,
  commission: 91.86,
  refunds: 14.5,
  pending: 287.35,
  paidThisMonth: 412.25,
  nextPayoutDate: L("3 november", "3 November", "3 نوفمبر"),
  salesSeries: [78, 104, 66, 122, 91, 148, 132],
};

export const adminKpis = {
  gmv: 48260,
  commission: 7239,
  activeCooks: 247,
  activeCustomers: 3184,
  ordersToday: 186,
  pendingVerifications: 12,
  disputes: 4,
  avgOrder: 23.4,
  refundRate: 1.8,
  newCooks: 18,
};

export const revenueSeries = [
  1420, 1680, 1510, 1890, 1760, 2140, 1980, 2320, 2210, 2480, 2360, 2740,
  2590, 2810, 2660, 3040, 2890, 3120, 2980, 3310, 3180, 3460, 3290, 3620,
  3410, 3680, 3520, 3890, 3710, 3980,
];

export const adminOrders = [
  {
    code: "DR-2418",
    customer: "Sarah de Vries",
    cook: "Rana El Amri",
    amount: 27.8,
    status: "preparing" as const,
    pickup: "31 Oct · 18:00",
    placed: "12 min ago",
  },
  {
    code: "DR-2422",
    customer: "Thomas Bakker",
    cook: "Rana El Amri",
    amount: 34.5,
    status: "confirmed" as const,
    pickup: "31 Oct · 18:30",
    placed: "25 min ago",
  },
  {
    code: "DR-2419",
    customer: "Amira El Fassi",
    cook: "Rana El Amri",
    amount: 14,
    status: "ready" as const,
    pickup: "30 Oct · 17:30",
    placed: "1 hr ago",
  },
  {
    code: "DR-2406",
    customer: "Karim Ouahbi",
    cook: "Omar Benali",
    amount: 18,
    status: "completed" as const,
    pickup: "29 Oct · 18:00",
    placed: "Yesterday",
  },
  {
    code: "DR-2402",
    customer: "Lisa Meijer",
    cook: "Samira Khoury",
    amount: 29.5,
    status: "cancelled" as const,
    pickup: "29 Oct · 13:00",
    placed: "Yesterday",
  },
];

export const verificationQueue = [
  {
    id: "vq-1",
    name: "Yasmin Al-Sayed",
    city: "Rotterdam",
    cuisine: "Syrian",
    submitted: "2 days ago",
    documents: 3,
    initials: "YA",
  },
  {
    id: "vq-2",
    name: "Hicham Idrissi",
    city: "Utrecht",
    cuisine: "Moroccan",
    submitted: "3 days ago",
    documents: 3,
    initials: "HI",
  },
  {
    id: "vq-3",
    name: "Lina Haddad",
    city: "Eindhoven",
    cuisine: "Lebanese",
    submitted: "4 days ago",
    documents: 2,
    initials: "LH",
  },
  {
    id: "vq-4",
    name: "Nour El Din",
    city: "Amsterdam",
    cuisine: "Egyptian",
    submitted: "5 days ago",
    documents: 3,
    initials: "NE",
  },
];

export const adminDisputes = [
  {
    id: "DSP-1042",
    code: "DR-2402",
    customer: "Lisa Meijer",
    cook: "Samira Khoury",
    reason: "Order not collected / cook closed",
    amount: 29.5,
    status: "open",
  },
  {
    id: "DSP-1038",
    code: "DR-2388",
    customer: "Tom Vermeer",
    cook: "Omar Benali",
    reason: "Missing item",
    amount: 14.5,
    status: "open",
  },
  {
    id: "DSP-1031",
    code: "DR-2354",
    customer: "Amina C.",
    cook: "Fatima Haddad",
    reason: "Late pickup window",
    amount: 12,
    status: "review",
  },
];

export const adminPayouts = [
  {
    id: "PAY-8821",
    cook: "Rana El Amri",
    period: "20 – 26 Oct",
    gross: 612.4,
    commission: 91.86,
    net: 520.54,
    status: "scheduled" as const,
  },
  {
    id: "PAY-8822",
    cook: "Omar Benali",
    period: "20 – 26 Oct",
    gross: 748.0,
    commission: 112.2,
    net: 635.8,
    status: "scheduled" as const,
  },
  {
    id: "PAY-8823",
    cook: "Fatima Haddad",
    period: "20 – 26 Oct",
    gross: 396.5,
    commission: 59.48,
    net: 337.02,
    status: "processing" as const,
  },
  {
    id: "PAY-8820",
    cook: "Samira Khoury",
    period: "13 – 19 Oct",
    gross: 522.75,
    commission: 78.41,
    net: 444.34,
    status: "paid" as const,
  },
];

export const topCuisines = [
  { name: "Moroccan", orders: 1284, share: 32 },
  { name: "Tunisian", orders: 972, share: 24 },
  { name: "Syrian", orders: 806, share: 20 },
  { name: "Lebanese", orders: 594, share: 15 },
  { name: "Other", orders: 364, share: 9 },
];

export const notifications = [
  {
    id: "n-1",
    title: L(
      "Rana is je bestelling aan het bereiden",
      "Rana is preparing your order",
      "رنا تحضّر طلبك",
    ),
    body: L(
      "Ophalen zaterdag om 18:00 in Delfshaven.",
      "Pickup Saturday at 18:00 in Delfshaven.",
      "الاستلام السبت الساعة 18:00 في دلفسهافن.",
    ),
    time: L("12 min", "12 min", "12 دقيقة"),
    unread: true,
  },
  {
    id: "n-2",
    title: L(
      "Weekendspecial: couscous royal",
      "Weekend special: royal couscous",
      "عرض نهاية الأسبوع: كسكسي ملكي",
    ),
    body: L(
      "Nog 5 porties bij Rana deze zaterdag.",
      "Only 5 portions left at Rana's this Saturday.",
      "بقيت 5 حصص عند رنا هذا السبت.",
    ),
    time: L("1 uur", "1 hr", "ساعة"),
    unread: true,
  },
  {
    id: "n-3",
    title: L(
      "Nieuwe kok in Utrecht",
      "New cook in Utrecht",
      "طاهٍ جديد في أوترخت",
    ),
    body: L(
      "Fatima voegde maqluba toe aan haar menu.",
      "Fatima added maqluba to her menu.",
      "أضافت فاطمة المقلوبة إلى قائمتها.",
    ),
    time: L("Gisteren", "Yesterday", "أمس"),
    unread: false,
  },
];

export function getCook(id: string) {
  return cooks.find((c) => c.id === id);
}

export function getDish(id: string) {
  return dishes.find((d) => d.id === id);
}

export function getCuisine(id: string) {
  return cuisines.find((c) => c.id === id);
}

export function dishesByCook(cookId: string) {
  return dishes.filter((d) => d.cookId === cookId);
}

export function cookName(id: string) {
  return getCook(id)?.name ?? "Darna";
}

export function orderSubtotal(items: OrderItem[]) {
  return items.reduce((sum, item) => {
    const dish = getDish(item.dishId);
    return sum + (dish ? dish.price * item.qty : 0);
  }, 0);
}

export function orderTotal(items: OrderItem[]) {
  return orderSubtotal(items) + SERVICE_FEE;
}

export function cartCount(items: { qty: number }[]) {
  return items.reduce((n, i) => n + i.qty, 0);
}

export const currentUser = {
  name: "Sarah de Vries",
  firstName: "Sarah",
  email: "sarah.devries@example.nl",
  phone: "+31 6 12 34 56 78",
  avatar: "/img/user-sarah.jpg",
  since: L("maart 2024", "March 2024", "مارس 2024"),
  address: "Westzeedijk 112",
  postcode: "3016 AH",
  city: "Rotterdam",
};

export const cookUser = {
  name: "Rana El Amri",
  avatar: "/img/cook-rana.jpg",
  kitchen: L("Rana's keuken", "Rana's kitchen", "مطبخ رنا"),
};
