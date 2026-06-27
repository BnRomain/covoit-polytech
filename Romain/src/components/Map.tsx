"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Marker {
  lat: number;
  lng: number;
  label?: string;
  type?: "origin" | "destination" | "trip";
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Marker[];
  route?: [number, number][];
  className?: string;
  onMarkerClick?: (index: number) => void;
}

const EMERALD_ICON = (type: Marker["type"] = "trip") => {
  const color = type === "destination" ? "#e11d48" : "#059669";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="13" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
    className: "",
  });
};

const SOPHIA_CENTER: [number, number] = [43.615, 7.07];

export default function Map({
  center = SOPHIA_CENTER,
  zoom = 12,
  markers = [],
  route,
  className = "",
  onMarkerClick,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(center, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers and routes
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Add markers
    markers.forEach((m, i) => {
      const marker = L.marker([m.lat, m.lng], {
        icon: EMERALD_ICON(m.type),
      }).addTo(map);

      if (m.label) {
        marker.bindPopup(
          `<div style="font-weight:600;font-size:13px">${m.label}</div>`,
          { closeButton: false }
        );
      }

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(i));
      }
    });

    // Add route polyline
    if (route && route.length >= 2) {
      L.polyline(route, {
        color: "#059669",
        weight: 3,
        opacity: 0.7,
        dashArray: "8, 8",
      }).addTo(map);
    }

    // Fit bounds if markers exist
    if (markers.length >= 2) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14);
    }
  }, [markers, route, onMarkerClick]);

  return (
    <div
      ref={mapRef}
      className={`z-0 rounded-2xl ${className}`}
      style={{ minHeight: "180px" }}
    />
  );
}
