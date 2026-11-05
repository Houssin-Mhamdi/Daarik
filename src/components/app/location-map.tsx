"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L, { type LatLngExpression } from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

export type MapPoint = { lat: number; lng: number };

export type CookPin = {
  city: string;
  lat: number;
  lng: number;
  cooks: { id: string; name: string; avatar: string; area: string }[];
};

const defaultCenter: LatLngExpression = [52.1326, 5.2913];
const cookIcon = (count: number) =>
  L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border:3px solid #fff;background:#5f6b4a;color:#fff;font:700 13px system-ui;display:grid;place-items:center;border-radius:9999px;box-shadow:0 2px 10px #0005">${count}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
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
  pins = [],
}: {
  point: MapPoint | null;
  onSelect: (point: MapPoint) => void;
  pins?: CookPin[];
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
      {pins.map((pin) => (
        <Marker
          key={`${pin.lat},${pin.lng}`}
          position={[pin.lat, pin.lng]}
          icon={cookIcon(pin.cooks.length)}
          eventHandlers={{
            mouseover: (event) => event.target.openTooltip(),
            mouseout: (event) => event.target.closeTooltip(),
            click: () => onSelect({ lat: pin.lat, lng: pin.lng }),
          }}
        >
          <Tooltip direction="top" offset={[0, -14]}>
            <div style={{ minWidth: 150 }}>
              <strong>{pin.city}</strong>
              {pin.cooks.map((cook) => (
                <div
                  key={cook.id}
                  style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cook.avatar || "/img/daarik-logo.png"}
                    alt=""
                    width={28}
                    height={28}
                    style={{ borderRadius: 9999, objectFit: "cover" }}
                  />
                  <span>
                    {cook.name}
                    {cook.area ? (
                      <span style={{ display: "block", fontSize: 11, opacity: 0.7 }}>
                        {cook.area}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </Tooltip>
        </Marker>
      ))}
      {point ? (
        <Marker position={[point.lat, point.lng]} icon={locationIcon} />
      ) : null}
      <RecenterMap point={point} />
      <MapClickHandler onSelect={onSelect} />
    </MapContainer>
  );
}
