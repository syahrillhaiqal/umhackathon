"use client";

import { Autocomplete, GoogleMap, Libraries, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { useMemo, useRef, useState } from "react";

export interface IncidentCoordinates {
  lat: number;
  lng: number;
}

interface IncidentMapPickerProps {
  value: IncidentCoordinates | null;
  onChange: (nextValue: IncidentCoordinates) => void;
  onLocationLabelChange?: (label: string) => void;
}

const defaultCenter: IncidentCoordinates = {
  lat: 3.139,
  lng: 101.6869,
};

const mapContainerStyle = {
  width: "100%",
  height: "280px",
};

const libraries: Libraries = ["places"];

function toCoordinateLabel(point: IncidentCoordinates): string {
  return `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
}

export function IncidentMapPicker({ value, onChange, onLocationLabelChange }: IncidentMapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [geoStatus, setGeoStatus] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "gridguard-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  const center = useMemo(() => value ?? defaultCenter, [value]);

  const reverseGeocode = async (point: IncidentCoordinates): Promise<string> => {
    if (typeof google === "undefined") {
      return toCoordinateLabel(point);
    }

    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: point }, (results, status) => {
        if (status === "OK" && results && results.length > 0) {
          resolve(results[0].formatted_address);
          return;
        }

        resolve(toCoordinateLabel(point));
      });
    });
  };

  const setLocation = (point: IncidentCoordinates, statusText: string, label: string) => {
    onChange(point);
    onLocationLabelChange?.(label);
    setSearchText(label);
    setGeoStatus(statusText);
    mapRef.current?.panTo(point);
  };

  const onPlaceChanged = () => {
    if (!autocomplete) {
      return;
    }

    const place = autocomplete.getPlace();
    const geometry = place.geometry?.location;

    if (!geometry) {
      setGeoStatus("Selected place has no map coordinates.");
      return;
    }

    const point = { lat: geometry.lat(), lng: geometry.lng() };
    const label = place.formatted_address || place.name || toCoordinateLabel(point);
    setLocation(point, "Location selected from search.", label);
  };

  const onUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const label = await reverseGeocode(nextPoint);
        setLocation(nextPoint, "Current location pinned successfully.", label);
      },
      () => {
        setGeoStatus("Unable to get your location. Please pin manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-[#3f5573] bg-[#111c2c] p-4 text-sm text-[#a8bcda]">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local to enable location pinning.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-[#6b4e64] bg-[#2a1c2a] p-4 text-sm text-[#efbfd8]">
        Google Maps failed to load. Check your API key and enabled APIs.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-[#9cb3d2]">Search location (Places API)</label>
        {isLoaded ? (
          <Autocomplete
            onLoad={(instance) => {
              setAutocomplete(instance);
            }}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#405a7e] bg-[#17273c] px-3 text-sm text-[#dbe7f8] outline-none ring-[#5977a5] placeholder:text-[#7f97b7] focus:ring-2"
              placeholder="Search road, district, or landmark"
            />
          </Autocomplete>
        ) : (
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#405a7e] bg-[#17273c] px-3 text-sm text-[#dbe7f8] outline-none ring-[#5977a5] placeholder:text-[#7f97b7] focus:ring-2"
            placeholder="Loading Places API..."
            disabled
          />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#334864] bg-[#0f1a2b]">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={14}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onClick={(event) => {
              if (!event.latLng) {
                return;
              }

              const point = { lat: event.latLng.lat(), lng: event.latLng.lng() };
              void reverseGeocode(point).then((label) => {
                setLocation(point, "Incident pin updated.", label);
              });
            }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {value ? <MarkerF position={value} /> : null}
          </GoogleMap>
        ) : (
          <div className="flex h-[280px] items-center justify-center text-sm text-[#9cb3d2]">Loading map...</div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onUseCurrentLocation}
          className="rounded-lg border border-[#455f84] bg-[#1f314a] px-3 py-1.5 text-sm font-semibold text-[#d3e2f6] transition hover:bg-[#263c5c]"
        >
          Use Current Location
        </button>
        <p className="text-xs text-[#8ca4c5]">Tap map to pin incident location and capture latitude/longitude.</p>
      </div>

      {geoStatus ? <p className="text-xs text-[#a9bdd7]">{geoStatus}</p> : null}
    </div>
  );
}
