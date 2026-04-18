"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DayScheduleItem } from "@/lib/types";

// Custom numbered marker (teardrop shape, match app theme)
function makeIcon(n: number) {
  const html = `
    <div style="
      position: relative;
      width: 34px;
      height: 42px;
    ">
      <svg viewBox="0 0 34 42" width="34" height="42" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0 C7.6 0 0 7.6 0 17 C0 29.75 17 42 17 42 C17 42 34 29.75 34 17 C34 7.6 26.4 0 17 0 Z"
              fill="#cc5d3f" stroke="#fff" stroke-width="2"/>
        <circle cx="17" cy="16" r="10" fill="#fff"/>
      </svg>
      <div style="
        position:absolute; top:6px; left:0; right:0;
        text-align:center; font: 600 13px/20px system-ui, -apple-system, sans-serif;
        color:#cc5d3f;
      ">${n}</div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -36],
  });
}

interface Props {
  items: DayScheduleItem[];
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

export function DayScheduleMap({ items }: Props) {
  const points = useMemo<[number, number][]>(
    () => items
      .filter((i) => i.lat !== null && i.lng !== null)
      .map((i) => [i.lat as number, i.lng as number]),
    [items]
  );

  if (points.length === 0) return null;

  const center = points[0];

  return (
    <div className="h-80 sm:h-96 w-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.length > 1 ? (
          <Polyline positions={points} pathOptions={{ color: "#cc5d3f", weight: 3, dashArray: "6 6", opacity: 0.7 }} />
        ) : null}
        {items.map((item, idx) => {
          if (item.lat === null || item.lng === null) return null;
          return (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              icon={makeIcon(idx + 1)}
            >
              <Popup>
                <div className="space-y-1 min-w-[180px]">
                  <div className="text-xs font-semibold text-[#cc5d3f]">
                    {item.start_time.slice(0, 5)}
                    {item.end_time ? ` – ${item.end_time.slice(0, 5)}` : ""}
                  </div>
                  <div className="font-semibold">{item.title}</div>
                  {item.location_name ? (
                    <div className="text-sm">{item.location_name}</div>
                  ) : null}
                  {item.address ? (
                    <div className="text-xs text-gray-600">{item.address}</div>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}
