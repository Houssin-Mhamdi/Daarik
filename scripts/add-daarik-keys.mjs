import fs from "node:fs";

const enMap = {
daarikHowTitle: "How Daarik works",
daarikHowSub: "From your order to your door, in four simple steps.",
daarikStep1Title: "Order",
daarikStep1Desc: "Choose your dishes and send your order.",
daarikStep2Title: "Preparing",
daarikStep2Desc: "We cook it fresh at home, just for you.",
daarikStep3Title: "Delivery",
daarikStep3Desc: "Your food is packed warm and brought to your door.",
daarikStep4Title: "Get paid",
daarikStep4Desc: "Payment received, and the meal is yours. Bon appétit!",
daarikFinal: "Bon appétit!",
daarikBrand: "DAARIK · TUNISIA",
};
const nlMap = {
daarikHowTitle: "Hoe Daarik werkt",
daarikHowSub: "Van je bestelling tot je deur, in vier eenvoudige stappen.",
daarikStep1Title: "Bestellen",
daarikStep1Desc: "Kies je gerechten en verstuur je bestelling.",
daarikStep2Title: "Bereiden",
daarikStep2Desc: "Wij koken het vers thuis, speciaal voor jou.",
daarikStep3Title: "Bezorging",
daarikStep3Desc: "Je eten wordt warm verpakt en naar je deur gebracht.",
daarikStep4Title: "Betaling",
daarikStep4Desc: "Betaling ontvangen, en de maaltijd is van jou. Eet smakelijk!",
daarikFinal: "Eet smakelijk!",
daarikBrand: "DAARIK · TUNISIË",
};
const arMap = {
daarikHowTitle: "كيف نعمل",
daarikHowSub: "من طلبك إلى بابك، في أربع خطوات بسيطة.",
daarikStep1Title: "اطلب",
daarikStep1Desc: "اختر أطباقك وأرسل طلبك.",
daarikStep2Title: "نحضّر",
daarikStep2Desc: "نطبخها طازجة في المنزل، خصيصاً لك.",
daarikStep3Title: "توصيل",
daarikStep3Desc: "يُعبأ طعامك دافئاً ويُوصل إلى بابك.",
daarikStep4Title: "الدفع",
daarikStep4Desc: "تم استلام الدفعة، والوجبة لك. بالهنا والشفا!",
daarikFinal: "بالهنا والشفا",
daarikBrand: "DAARIK · TUNISIA",
};

function patch(file, map) {
  let text = fs.readFileSync(file, "utf8");
  const idx = text.lastIndexOf("};");
  const before = text.slice(0, idx);
  const after = text.slice(idx);
  let insert = "";
  for (const [k, v] of Object.entries(map)) {
    if (new RegExp("^\\s{2}" + k + ":", "m").test(text)) continue;
    insert += `  ${k}: ${JSON.stringify(v)},\n`;
  }
  text = before + insert + after;
  fs.writeFileSync(file, text);
}

patch("C:/Users/dell2/darna/src/lib/i18n/en.ts", enMap);
patch("C:/Users/dell2/darna/src/lib/i18n/nl.ts", nlMap);
patch("C:/Users/dell2/darna/src/lib/i18n/ar.ts", arMap);
console.log("done");