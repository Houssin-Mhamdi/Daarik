"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MapPin, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/overlays";
import type { MapPoint } from "@/components/app/location-map";

const LocationMap = dynamic(() => import("@/components/app/location-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-muted">
      Loading map...
    </div>
  ),
});

async function reverseGeocode(point: MapPoint) {
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    zoom: "12",
    lat: String(point.lat),
    lon: String(point.lng),
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const addr = data?.address ?? {};
  const city = addr.city || addr.town || addr.municipality || addr.village || "";
  const label = data?.display_name?.split(",").slice(0, 3).join(",") ?? "";
  return { city, label };
}

export function MeetingPointPicker({
  open,
  onClose,
  onCommit,
}: {
  open: boolean;
  onClose: () => void;
  onCommit: (point: { name: string; address: string; lat: number; lng: number }) => void;
}) {
  const [point, setPoint] = useState<MapPoint | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) {
      setPoint(null);
      setName("");
      setAddress("");
    }
  }, [open]);

  const handleSelect = async (p: MapPoint) => {
    setPoint(p);
    setLocating(true);
    try {
      const place = await reverseGeocode(p);
      if (place) {
        if (!name) setName(place.city || "Meeting point");
        setAddress(place.label || `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`);
      } else {
        if (!name) setName("Meeting point");
        setAddress(`${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`);
      }
    } finally {
      setLocating(false);
    }
  };

  const commit = () => {
    if (!point) return;
    onCommit({
      name: name.trim() || "Meeting point",
      address: address.trim() || `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
      lat: point.lat,
      lng: point.lng,
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add meeting point" className="md:max-w-2xl">
      <div className="space-y-3 pt-1">
        <div className="h-64 overflow-hidden rounded-2xl border border-line bg-cream-100 md:h-80">
          <LocationMap point={point} onSelect={handleSelect} pins={[]} radiusKm={0} />
        </div>
        {locating ? (
          <p className="flex items-center gap-2 text-[13px] text-muted">
            <LoaderCircle className="size-4 animate-spin" /> Locating...
          </p>
        ) : null}
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. Eindhoven station)"
          className="h-11 rounded-xl"
        />
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          className="h-11 rounded-xl"
        />
        <Button type="button" onClick={commit} disabled={!point} className="w-full">
          Use this location
        </Button>
      </div>
    </Sheet>
  );
}
