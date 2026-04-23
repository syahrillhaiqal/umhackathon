"use client";

import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultCenter = [51.505, -0.09];

// Custom marker icon
const customIcon = L.divIcon({
  html: `
    <div style="
      background:#2563eb;
      width:22px;
      height:22px;
      border-radius:50%;
      border:4px solid white;
      box-shadow:0 4px 12px rgba(0,0,0,0.25);
    "></div>
  `,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function LocationMarker({ setPosition }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
    },
  });

  return null;
}

export default function MyMap() {
  const [position, setPosition] = useState(null);

  return (
    <div
      style={{
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        border: "1px solid #e5e7eb",
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{
          height: "500px",
          width: "100%",
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <LocationMarker setPosition={setPosition} />

        {position && (
          <>
            {/* Soft radius glow */}
            <Circle
              center={position}
              radius={120}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#60a5fa",
                fillOpacity: 0.2,
              }}
            />

            {/* Pin */}
            <Marker position={position} icon={customIcon}>
              <Popup>
                <div style={{ minWidth: "180px" }}>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "16px",
                      fontWeight: "700",
                    }}
                  >
                    📍 Selected Location
                  </h3>

                  <p style={{ margin: "4px 0", color: "#555" }}>
                    Latitude: {position[0].toFixed(5)}
                  </p>

                  <p style={{ margin: "4px 0", color: "#555" }}>
                    Longitude: {position[1].toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
      {position}
    </div>
  );
}