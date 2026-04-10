"use client";

import { Address } from "@/types";

type Prediction = { placeId: string; description: string };
type Coords = { lat: number; lng: number };

let mapsLoader: Promise<void> | null = null;

function mapsKey(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
}

function getGoogle(): any {
  return (window as Window & { google?: any }).google;
}

export async function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return;
  if (getGoogle()?.maps?.places) return;
  if (mapsLoader) return mapsLoader;

  const key = mapsKey();
  if (!key) throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");

  mapsLoader = new Promise<void>((resolve, reject) => {
    const host = window.location.hostname;
    const onFailure = () => {
      mapsLoader = null;
      reject(
        new Error(
          `Failed to load Google Maps script for host "${host}". Add this host to Google Maps API key allowed referrers (for example: http://localhost:3001/* and http://${host}:3001/*).`,
        ),
      );
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="1"]');
    if (existing) {
      if (getGoogle()?.maps?.places) {
        resolve();
        return;
      }
      existing.remove();
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "1";
    script.onload = () => resolve();
    script.onerror = onFailure;
    document.head.appendChild(script);
  });

  return mapsLoader;
}

export async function searchPlaces(input: string): Promise<Prediction[]> {
  const query = input.trim();
  if (!query) return [];
  await loadGoogleMaps();
  const g = getGoogle();
  if (!g?.maps?.places) return [];

  return new Promise((resolve) => {
    const service = new g.maps.places.AutocompleteService();
    service.getPlacePredictions(
      { input: query, types: ["address"] },
      (predictions: any[] | null, status: string) => {
        if (status !== g.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }
        resolve(
          predictions.slice(0, 6).map((p) => ({
            placeId: p.place_id as string,
            description: p.description as string,
          })),
        );
      },
    );
  });
}

export async function geocodePlace(placeId: string): Promise<{ address: string; coords: Coords }> {
  await loadGoogleMaps();
  const g = getGoogle();

  return new Promise((resolve, reject) => {
    const service = new g.maps.places.PlacesService(document.createElement("div"));
    service.getDetails(
      { placeId, fields: ["formatted_address", "geometry"] },
      (result: any, status: string) => {
        if (status !== g.maps.places.PlacesServiceStatus.OK || !result?.geometry?.location) {
          reject(new Error("Could not resolve this address."));
          return;
        }
        resolve({
          address: (result.formatted_address as string) || "Selected location",
          coords: {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          },
        });
      },
    );
  });
}

export async function reverseGeocode(coords: Coords): Promise<string> {
  await loadGoogleMaps();
  const g = getGoogle();

  return new Promise((resolve, reject) => {
    const geocoder = new g.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results: any[] | null, status: string) => {
      if (status !== "OK" || !results?.length) {
        reject(new Error("Could not resolve your current location."));
        return;
      }
      resolve(results[0].formatted_address as string);
    });
  });
}

export function currentPosition(): Promise<Coords> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("Geolocation is not supported in this browser."));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Location permission denied.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  });
}

export function addressFromGoogle(input: {
  address: string;
  lat: number;
  lng: number;
  label?: Address["label"];
  isDefault?: boolean;
}): Address {
  return {
    id: `addr-${Date.now()}`,
    label: input.label ?? "Other",
    address: input.address,
    latitude: input.lat,
    longitude: input.lng,
    isDefault: input.isDefault ?? false,
  };
}
