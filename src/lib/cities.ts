import { cityMatches } from "@/lib/utils";

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Amsterdam: { lat: 52.3676, lng: 4.9041 },
  Rotterdam: { lat: 51.9244, lng: 4.4777 },
  Utrecht: { lat: 52.0907, lng: 5.1214 },
  "Den Haag": { lat: 52.0705, lng: 4.3007 },
  Eindhoven: { lat: 51.4416, lng: 5.4697 },
  Groningen: { lat: 53.2194, lng: 6.5665 },
  Tilburg: { lat: 51.5555, lng: 5.0913 },
  Almere: { lat: 52.3508, lng: 5.2647 },
  Breda: { lat: 51.5719, lng: 4.7683 },
  Nijmegen: { lat: 51.8126, lng: 5.8372 },
  Haarlem: { lat: 52.3874, lng: 4.6462 },
  Arnhem: { lat: 51.9851, lng: 5.8987 },
  Delft: { lat: 52.0116, lng: 4.3571 },
  Leiden: { lat: 52.1601, lng: 4.4970 },
  Maastricht: { lat: 50.8514, lng: 5.691 },
  Zwolle: { lat: 52.5168, lng: 6.083 },
  Amersfoort: { lat: 52.1561, lng: 5.3878 },
  Enschede: { lat: 52.2215, lng: 6.8937 },
  Apeldoorn: { lat: 52.2112, lng: 5.9699 },
  Dordrecht: { lat: 51.8133, lng: 4.6901 },
};

export function coordsForCity(city: string) {
  const name = Object.keys(CITY_COORDS).find((key) => cityMatches(key, city));
  return name ? CITY_COORDS[name] : null;
}
