import { cityMatches } from "@/lib/utils";

export type GeoPoint = { lat: number; lng: number };

// Fixed list of Dutch cities. Cooks can only pick from these. Keep one
// entry per line: backend/src/common/nl-cities.ts is generated from it.
export const CITY_COORDS: Record<string, GeoPoint> = {
  "Alkmaar": { lat: 52.6324, lng: 4.7534 },
  "Almelo": { lat: 52.3567, lng: 6.6625 },
  "Almere": { lat: 52.3508, lng: 5.2647 },
  "Alphen aan den Rijn": { lat: 52.1292, lng: 4.6575 },
  "Amersfoort": { lat: 52.1561, lng: 5.3878 },
  "Amstelveen": { lat: 52.308, lng: 4.8722 },
  "Amsterdam": { lat: 52.3676, lng: 4.9041 },
  "Apeldoorn": { lat: 52.2112, lng: 5.9699 },
  "Arnhem": { lat: 51.9851, lng: 5.8987 },
  "Assen": { lat: 52.9929, lng: 6.5642 },
  "Barendrecht": { lat: 51.8567, lng: 4.535 },
  "Barneveld": { lat: 52.14, lng: 5.5833 },
  "Bergen op Zoom": { lat: 51.495, lng: 4.29 },
  "Best": { lat: 51.51, lng: 5.39 },
  "Beverwijk": { lat: 52.4833, lng: 4.6567 },
  "Boxmeer": { lat: 51.645, lng: 5.9467 },
  "Boxtel": { lat: 51.59, lng: 5.3283 },
  "Breda": { lat: 51.5719, lng: 4.7683 },
  "Brielle": { lat: 51.9025, lng: 4.1633 },
  "Bussum": { lat: 52.2733, lng: 5.16 },
  "Capelle aan den IJssel": { lat: 51.93, lng: 4.578 },
  "Castricum": { lat: 52.5483, lng: 4.6583 },
  "Cuijk": { lat: 51.7283, lng: 5.8783 },
  "Culemborg": { lat: 51.955, lng: 5.2278 },
  "Delft": { lat: 52.0116, lng: 4.3571 },
  "Delfzijl": { lat: 53.33, lng: 6.92 },
  "Den Haag": { lat: 52.0705, lng: 4.3007 },
  "Den Helder": { lat: 52.9563, lng: 4.7608 },
  "Deurne": { lat: 51.4633, lng: 5.7933 },
  "Deventer": { lat: 52.2551, lng: 6.1639 },
  "Doetinchem": { lat: 51.965, lng: 6.288 },
  "Dokkum": { lat: 53.3254, lng: 5.997 },
  "Dordrecht": { lat: 51.8133, lng: 4.6901 },
  "Drachten": { lat: 53.1114, lng: 6.0989 },
  "Ede": { lat: 52.0402, lng: 5.6649 },
  "Eindhoven": { lat: 51.4416, lng: 5.4697 },
  "Elburg": { lat: 52.4467, lng: 5.835 },
  "Emmen": { lat: 52.7792, lng: 6.9006 },
  "Enschede": { lat: 52.2215, lng: 6.8937 },
  "Etten-Leur": { lat: 51.57, lng: 4.635 },
  "Geldrop": { lat: 51.4217, lng: 5.5583 },
  "Geleen": { lat: 50.9708, lng: 5.8283 },
  "Goes": { lat: 51.5047, lng: 3.8892 },
  "Goirle": { lat: 51.52, lng: 5.0667 },
  "Gorinchem": { lat: 51.835, lng: 4.975 },
  "Gouda": { lat: 52.0115, lng: 4.7107 },
  "Groningen": { lat: 53.2194, lng: 6.5665 },
  "Haarlem": { lat: 52.3874, lng: 4.6462 },
  "Harderwijk": { lat: 52.3422, lng: 5.6208 },
  "Harlingen": { lat: 53.1747, lng: 5.4208 },
  "Heemskerk": { lat: 52.51, lng: 4.6667 },
  "Heerenveen": { lat: 52.9594, lng: 5.9214 },
  "Heerhugowaard": { lat: 52.6667, lng: 4.8333 },
  "Heerlen": { lat: 50.8882, lng: 5.9795 },
  "Hellevoetsluis": { lat: 51.83, lng: 4.1333 },
  "Helmond": { lat: 51.4793, lng: 5.6611 },
  "Hengelo": { lat: 52.2658, lng: 6.7931 },
  "'s-Hertogenbosch": { lat: 51.6978, lng: 5.3037 },
  "Hilversum": { lat: 52.2292, lng: 5.1669 },
  "Hoofddorp": { lat: 52.303, lng: 4.6907 },
  "Hoogeveen": { lat: 52.7231, lng: 6.4758 },
  "Hoorn": { lat: 52.6425, lng: 5.0597 },
  "Houten": { lat: 52.0283, lng: 5.1683 },
  "Huizen": { lat: 52.2967, lng: 5.24 },
  "IJsselstein": { lat: 52.02, lng: 5.0433 },
  "Kampen": { lat: 52.555, lng: 5.9114 },
  "Katwijk": { lat: 52.204, lng: 4.4 },
  "Kerkrade": { lat: 50.8658, lng: 6.0622 },
  "Leeuwarden": { lat: 53.2012, lng: 5.7999 },
  "Leiden": { lat: 52.1601, lng: 4.497 },
  "Lelystad": { lat: 52.5185, lng: 5.4714 },
  "Leusden": { lat: 52.13, lng: 5.43 },
  "Lisse": { lat: 52.2583, lng: 4.5583 },
  "Maassluis": { lat: 51.9233, lng: 4.25 },
  "Maastricht": { lat: 50.8514, lng: 5.691 },
  "Meppel": { lat: 52.6958, lng: 6.1936 },
  "Middelburg": { lat: 51.4988, lng: 3.611 },
  "Naarden": { lat: 52.295, lng: 5.1617 },
  "Nieuwegein": { lat: 52.0292, lng: 5.0806 },
  "Nijmegen": { lat: 51.8126, lng: 5.8372 },
  "Noordwijk": { lat: 52.235, lng: 4.435 },
  "Nunspeet": { lat: 52.3767, lng: 5.7833 },
  "Oisterwijk": { lat: 51.58, lng: 5.19 },
  "Oldenzaal": { lat: 52.3133, lng: 6.9292 },
  "Oosterhout": { lat: 51.645, lng: 4.8597 },
  "Oss": { lat: 51.765, lng: 5.5181 },
  "Papendrecht": { lat: 51.8333, lng: 4.6833 },
  "Purmerend": { lat: 52.505, lng: 4.9597 },
  "Putten": { lat: 52.2583, lng: 5.6083 },
  "Rhenen": { lat: 51.96, lng: 5.5667 },
  "Ridderkerk": { lat: 51.8667, lng: 4.6 },
  "Rijswijk": { lat: 52.0367, lng: 4.325 },
  "Roermond": { lat: 51.1942, lng: 5.9875 },
  "Roosendaal": { lat: 51.5308, lng: 4.4653 },
  "Rotterdam": { lat: 51.9244, lng: 4.4777 },
  "Schagen": { lat: 52.7869, lng: 4.7992 },
  "Schiedam": { lat: 51.9192, lng: 4.3889 },
  "Sittard": { lat: 51.0, lng: 5.87 },
  "Sneek": { lat: 53.0325, lng: 5.6603 },
  "Soest": { lat: 52.1733, lng: 5.2917 },
  "Spijkenisse": { lat: 51.845, lng: 4.329 },
  "Stadskanaal": { lat: 52.99, lng: 6.95 },
  "Steenwijk": { lat: 52.7875, lng: 6.1181 },
  "Terneuzen": { lat: 51.335, lng: 3.828 },
  "Tiel": { lat: 51.8867, lng: 5.43 },
  "Tilburg": { lat: 51.5555, lng: 5.0913 },
  "Uden": { lat: 51.66, lng: 5.6167 },
  "Utrecht": { lat: 52.0907, lng: 5.1214 },
  "Valkenburg": { lat: 50.865, lng: 5.8317 },
  "Valkenswaard": { lat: 51.35, lng: 5.4583 },
  "Veendam": { lat: 53.1067, lng: 6.88 },
  "Veenendaal": { lat: 52.0267, lng: 5.5583 },
  "Veghel": { lat: 51.6167, lng: 5.5467 },
  "Veldhoven": { lat: 51.42, lng: 5.4 },
  "Velsen-Zuid": { lat: 52.46, lng: 4.6167 },
  "Venlo": { lat: 51.3704, lng: 6.1724 },
  "Vianen": { lat: 51.9917, lng: 5.0917 },
  "Vlaardingen": { lat: 51.9125, lng: 4.3419 },
  "Vlissingen": { lat: 51.4423, lng: 3.5736 },
  "Volendam": { lat: 52.495, lng: 5.07 },
  "Waalwijk": { lat: 51.685, lng: 5.07 },
  "Wageningen": { lat: 51.9692, lng: 5.6654 },
  "Wassenaar": { lat: 52.145, lng: 4.4 },
  "Weert": { lat: 51.2514, lng: 5.7064 },
  "Weesp": { lat: 52.3067, lng: 5.0417 },
  "Wijchen": { lat: 51.8083, lng: 5.7233 },
  "Winschoten": { lat: 53.145, lng: 7.0356 },
  "Winterswijk": { lat: 51.9717, lng: 6.72 },
  "Woerden": { lat: 52.085, lng: 4.8836 },
  "Zaandam": { lat: 52.4391, lng: 4.829 },
  "Zeist": { lat: 52.0883, lng: 5.2333 },
  "Zevenaar": { lat: 51.93, lng: 6.0767 },
  "Zoetermeer": { lat: 52.0575, lng: 4.4931 },
  "Zutphen": { lat: 52.1383, lng: 6.2008 },
  "Zwijndrecht": { lat: 51.8167, lng: 4.6333 },
  "Zwolle": { lat: 52.5168, lng: 6.083 },
};

export const CITY_NAMES = Object.keys(CITY_COORDS).sort((a, b) =>
  a.localeCompare(b, "nl"),
);

export const RADIUS_OPTIONS_KM = [5, 10, 15, 25, 50] as const;

// A kitchen pin must stay close to the chosen city.
export const MAX_PIN_DISTANCE_KM = 25;

export function coordsForCity(city: string) {
  const name = CITY_NAMES.find((key) => cityMatches(key, city));
  return name ? CITY_COORDS[name] : null;
}

export function distanceKm(a: GeoPoint, b: GeoPoint) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function nearestCity(point: GeoPoint, maxKm = 30) {
  let best: { name: string; km: number } | null = null;
  for (const name of CITY_NAMES) {
    const km = distanceKm(point, CITY_COORDS[name]);
    if (!best || km < best.km) best = { name, km };
  }
  return best && best.km <= maxKm ? best.name : null;
}

type CookLike = { city: string; latitude?: number; longitude?: number };

export function cookPoint(cook: CookLike): GeoPoint | null {
  if (typeof cook.latitude === "number" && typeof cook.longitude === "number") {
    return { lat: cook.latitude, lng: cook.longitude };
  }
  return coordsForCity(cook.city);
}

export function cooksWithin<T extends CookLike>(
  cooks: T[],
  center: GeoPoint,
  radiusKm: number,
) {
  return cooks.filter((cook) => {
    const point = cookPoint(cook);
    return point ? distanceKm(center, point) <= radiusKm : false;
  });
}
