import type { Lang } from "@/lib/i18n";

type LegalCopy = {
  terms: string[];
  privacy: string[];
};

const copy: Record<Lang, LegalCopy> = {
  en: {
    terms: [
      "Daarik is a marketplace that introduces customers to independent home cooks. We are not the cook, the kitchen or the seller of the food. Each cook prepares and sells their own dishes.",
      "You need a valid account with accurate contact details to order. Keep your login private and tell us immediately if you believe someone else has used your account.",
      "Orders are placed for a specific pickup slot and must be collected at the agreed time and pickup area. Daarik never publishes a cook's exact home address. Bring your order number and follow the cook's pickup instructions.",
      "Prices, service fees and any refunds are shown before you pay. Payments are processed by our payment partner. Refunds for cancelled or disputed orders are returned to the original payment method, usually within 3–5 working days.",
      "You may cancel free of charge until the cook starts preparing. After that, a cook may refuse a refund because ingredients have already been used. If a cook cancels, you are refunded in full.",
      "Cooks are responsible for food safety and hygiene, accurate allergen information, and holding any registration or permits required in their municipality. Daarik reviews documents but cannot guarantee them.",
      "Do not misuse the platform: no harassment, discrimination, fake reviews, off-platform payments or attempts to obtain a cook's private address. We may suspend accounts that break these rules.",
      "Daarik aims to keep the marketplace safe and available, but we cannot guarantee uninterrupted service or a specific outcome in a dispute. Liability is limited to the value of the affected order where the law allows.",
      "Questions about these terms? Email hello@daarik.nl. We may update these terms and will highlight material changes before they take effect.",
    ],
    privacy: [
      "We collect the details you give us (name, email, phone, address), order and pickup information, payment confirmations, messages and technical data such as device and approximate location.",
      "We use your data to create and secure your account, process orders and payments, arrange pickups, send service updates, resolve disputes and improve the marketplace.",
      "We process data to perform our contract with you, to comply with legal obligations (for example tax and food-safety records), for our legitimate interest in running a safe marketplace, and with your consent for optional marketing.",
      "Cooks receive only the information needed for your order, such as your first name, order contents and pickup slot. Payment providers and hosting partners process data on our behalf under contract. We never sell your data.",
      "We keep order and payment records for as long as tax law requires. Account data is deleted or anonymised when you close your account, unless we must keep it for a legal claim.",
      "You can access, correct, export or delete your data, and object to certain processing. Use the settings in your profile or email privacy@darna.nl. You may also complain to the Dutch data protection authority.",
      "We use essential cookies to keep you signed in and remember your cart and language. Optional analytics cookies help us improve Daarik and are only set with your consent.",
      "For privacy requests, contact privacy@darna.nl. Our privacy team responds within one month and may ask for information to verify your identity.",
    ],
  },
  nl: {
    terms: [
      "Daarik is een marktplaats die klanten in contact brengt met zelfstandige thuiskoks. Wij zijn niet de kok, de keuken of de verkoper van het eten. Elke kok bereidt en verkoopt de eigen gerechten.",
      "Je hebt een geldig account met juiste contactgegevens nodig om te bestellen. Houd je inlog geheim en meld het direct als iemand anders je account gebruikt.",
      "Bestellingen gelden voor een vast ophaalmoment en moeten op de afgesproken tijd en plek worden opgehaald. Daarik publiceert nooit het exacte huisadres van een kok. Neem je bestelnummer mee en volg de ophaalinstructies.",
      "Prijzen, servicekosten en eventuele terugbetalingen zie je vóór het betalen. Betalingen lopen via onze betaalpartner. Terugbetalingen gaan naar de oorspronkelijke betaalmethode, meestal binnen 3–5 werkdagen.",
      "Je kunt gratis annuleren tot de kok begint met bereiden. Daarna kan een kok terugbetaling weigeren omdat ingrediënten al gebruikt zijn. Annuleert de kok, dan krijg je het volledige bedrag terug.",
      "Koks zijn verantwoordelijk voor voedselveiligheid en hygiëne, correcte allergeneninformatie en eventuele registratie of vergunningen van hun gemeente. Daarik beoordeelt documenten maar kan dit niet garanderen.",
      "Gebruik het platform niet verkeerd: geen intimidatie, discriminatie, nepbeoordelingen, betalingen buiten het platform of pogingen om een privéadres te achterhalen. We kunnen accounts opschorten.",
      "Daarik streeft naar een veilige en beschikbare marktplaats, maar kan geen ononderbroken service of een bepaalde uitkomst bij een geschil garanderen. Aansprakelijkheid is waar wettelijk toegestaan beperkt tot de waarde van de bestelling.",
      "Vragen over deze voorwaarden? Mail hello@daarik.nl. We kunnen de voorwaarden bijwerken en wijzen op belangrijke wijzigingen voordat ze ingaan.",
    ],
    privacy: [
      "We verzamelen gegevens die je ons geeft (naam, e-mail, telefoon, adres), bestel- en ophaalgegevens, betaalbevestigingen, berichten en technische gegevens zoals apparaat en globale locatie.",
      "We gebruiken je gegevens om je account aan te maken en te beveiligen, bestellingen en betalingen te verwerken, ophalen te regelen, serviceberichten te sturen, geschillen op te lossen en het platform te verbeteren.",
      "We verwerken gegevens om onze overeenkomst uit te voeren, om aan wettelijke verplichtingen te voldoen (zoals belasting- en voedselveiligheidsregistratie), voor ons gerechtvaardigd belang bij een veilige marktplaats en met jouw toestemming voor optionele marketing.",
      "Koks ontvangen alleen wat nodig is voor je bestelling, zoals je voornaam, de inhoud en het ophaalmoment. Betaal- en hostingpartners verwerken gegevens namens ons onder contract. We verkopen je gegevens nooit.",
      "We bewaren bestel- en betaalgegevens zolang de belastingwet dat vereist. Accountgegevens worden verwijderd of geanonimiseerd na sluiting, tenzij we ze nodig hebben voor een juridische claim.",
      "Je kunt je gegevens inzien, corrigeren, exporteren of verwijderen en bezwaar maken tegen bepaalde verwerking. Gebruik je profielinstellingen of mail privacy@darna.nl. Je kunt ook klagen bij de Autoriteit Persoonsgegevens.",
      "We gebruiken essentiële cookies om je ingelogd te houden en je winkelwagen en taal te onthouden. Optionele analysecookies helpen Daarik te verbeteren en plaatsen we alleen met je toestemming.",
      "Voor privacyverzoeken mail je privacy@darna.nl. Ons team reageert binnen een maand en kan om informatie vragen om je identiteit te controleren.",
    ],
  },
  ar: {
    terms: [
      "دارك سوق إلكتروني يربط العملاء بطهاة منزل مستقلين. نحن لسنا الطاهي أو المطبخ أو بائع الطعام. كل طاهٍ يحضّر أطباقه ويبيعها بنفسه.",
      "تحتاج إلى حساب صالح ببيانات تواصل دقيقة للطلب. حافظ على سرية بيانات الدخول وأخبرنا فورًا إذا اعتقدت أن شخصًا آخر استخدم حسابك.",
      "تُسجّل الطلبات لموعد استلام محدد ويجب استلامها في الوقت والمكان المتفق عليهما. لا تنشر دارك عنوان المنزل الدقيق للطاهي أبدًا. أحضر رقم طلبك واتبع تعليمات الاستلام.",
      "تظهر الأسعار ورسوم الخدمة وأي مبالغ مستردة قبل الدفع. تُعالج المدفوعات عبر شريك الدفع. تُعاد المبالغ إلى وسيلة الدفع الأصلية، عادة خلال 3–5 أيام عمل.",
      "يمكنك الإلغاء مجانًا حتى يبدأ الطاهي بالتحضير. بعده قد يرفض الطاهي الاسترداد لأن المكونات استُخدمت. إذا ألغى الطاهي، يُرد المبلغ كاملًا.",
      "الطهاة مسؤولون عن سلامة الغذاء والنظافة ودقة معلومات مسببات الحساسية والحصول على أي تسجيل أو تصريح تطلبه بلديتهم. تراجع دارك المستندات لكنها لا تضمنها.",
      "لا تسئ استخدام المنصة: لا مضايقة أو تمييز أو تقييمات مزيفة أو مدفوعات خارج المنصة أو محاولات للحصول على عنوان الطاهي الخاص. قد نوقف الحسابات المخالفة.",
      "تسعى دارك لسوق آمن ومتاح، لكنها لا تضمن خدمة متواصلة أو نتيجة معينة في أي نزاع. تقتصر المسؤولية، حيث يسمح القانون، على قيمة الطلب المتأثر.",
      "أسئلة عن هذه الشروط؟ راسل hello@daarik.nl. قد نحدّث الشروط وسنوضح التغييرات الجوهرية قبل سريانها.",
    ],
    privacy: [
      "نجمع البيانات التي تقدمها (الاسم، البريد، الهاتف، العنوان)، ومعلومات الطلب والاستلام، وتأكيدات الدفع، والرسائل، وبيانات تقنية مثل الجهاز والموقع التقريبي.",
      "نستخدم بياناتك لإنشاء حسابك وتأمينه، ومعالجة الطلبات والمدفوعات، وتنظيم الاستلام، وإرسال تحديثات الخدمة، وحل النزاعات، وتحسين السوق.",
      "نعالج البيانات لتنفيذ عقدنا معك، والامتثال للالتزامات القانونية (مثل السجلات الضريبية وسلامة الغذاء)، ولمصلحتنا المشروعة في سوق آمن، وبموافقتك للتسويق الاختياري.",
      "يتلقى الطهاة فقط ما يلزم لطلبك، مثل اسمك الأول ومحتوى الطلب وموعد الاستلام. يعالج مقدمو الدفع والاستضافة البيانات نيابة عنا بموجب عقد. لا نبيع بياناتك أبدًا.",
      "نحتفظ بسجلات الطلبات والمدفوعات للمدة التي يطلبها قانون الضرائب. تُحذف بيانات الحساب أو تُجهّل عند إغلاقه، إلا إذا احتجنا إليها لدعوى قانونية.",
      "يمكنك الاطلاع على بياناتك وتصحيحها وتصديرها أو حذفها والاعتراض على بعض المعالجات. استخدم إعدادات ملفك أو راسل privacy@darna.nl. يمكنك أيضًا الشكوى لدى هيئة حماية البيانات الهولندية.",
      "نستخدم ملفات تعريف أساسية لإبقائك مسجّلًا وتذكّر سلتك ولغتك. ملفات التحليلات الاختيارية تساعدنا على تحسين دارك ولا نضعها إلا بموافقتك.",
      "لطلبات الخصوصية، راسل privacy@darna.nl. يرد فريقنا خلال شهر وقد يطلب معلومات للتحقق من هويتك.",
    ],
  },
};

export function getLegalCopy(kind: "terms" | "privacy", lang: Lang) {
  return copy[lang][kind];
}
