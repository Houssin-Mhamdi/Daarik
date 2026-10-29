"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L, { type LatLngExpression } from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

export type MapPoint = { lat: number; lng: number };

const defaultCenter: LatLngExpression = [52.1326, 5.2913];
const locationIcon = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border:5px solid #fff;background:#b94f39;border-radius:9999px;box-shadow:0 2px 10px #0005"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function RecenterMap({ point }: { point: MapPoint | null }) {
  const map = useMap();

  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], 14, { duration: 0.45 });
  }, [map, point]);

  return null;
}

function MapClickHandler({
  onSelect,
}: {
  onSelect: (point: MapPoint) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

export default function LocationMap({
  point,
  onSelect,
}: {
  point: MapPoint | null;
  onSelect: (point: MapPoint) => void;
}) {
  return (
    <MapContainer
      center={point ? [point.lat, point.lng] : defaultCenter}
      zoom={point ? 14 : 7}
      scrollWheelZoom={false}
      className="z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {point ? (
        <Marker position={[point.lat, point.lng]} icon={locationIcon} />
      ) : null}
      <RecenterMap point={point} />
      <MapClickHandler onSelect={onSelect} />
    </MapContainer>
  );
}
