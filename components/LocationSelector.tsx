"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  addressFromGoogle,
  currentPosition,
  geocodePlace,
  reverseGeocode,
  searchPlaces,
} from "@/lib/maps/googleMaps";
import { useLocationStore } from "@/store/locationStore";

type LocationSelectorProps = {
  variant?: "default" | "glovo";
};

export const LocationSelector = ({ variant = "default" }: LocationSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState<"Home" | "Work" | "Other">("Other");
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Array<{ placeId: string; description: string }>>([]);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [adding, setAdding] = useState(false);
  const addresses = useLocationStore((state) => state.addresses);
  const selected = useLocationStore((state) => state.selectedAddress);
  const addAddress = useLocationStore((state) => state.addAddress);
  const selectAddress = useLocationStore((state) => state.selectAddress);

  const isGlovo = variant === "glovo";
  const title = useMemo(
    () => (isGlovo ? selected.address.split(",")[0]?.trim() || selected.label : selected.label),
    [isGlovo, selected.address, selected.label],
  );

  const onSelect = (address: (typeof addresses)[number]) => {
    selectAddress(address);
    setIsOpen(false);
  };

  const onSearchAddress = async (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setPredictions([]);
      return;
    }
    try {
      const results = await searchPlaces(value);
      setPredictions(results);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to load address suggestions.");
      setPredictions([]);
    }
  };

  const onUseCurrentLocation = async () => {
    setLoadingCurrent(true);
    try {
      const coords = await currentPosition();
      const address = await reverseGeocode(coords);
      const entry = addressFromGoogle({
        address,
        lat: coords.lat,
        lng: coords.lng,
        label: "Other",
      });
      addAddress(entry);
      toast.success("Current location selected.");
      setIsOpen(false);
      setShowAdd(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not get current location.");
    } finally {
      setLoadingCurrent(false);
    }
  };

  const onAddFromPrediction = async (placeId: string) => {
    setAdding(true);
    try {
      const place = await geocodePlace(placeId);
      addAddress(
        addressFromGoogle({
          address: place.address,
          lat: place.coords.lat,
          lng: place.coords.lng,
          label: newLabel,
        }),
      );
      toast.success("Address added.");
      setQuery("");
      setPredictions([]);
      setShowAdd(false);
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add address.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={
          isGlovo
            ? "flex max-w-[min(100%,280px)] items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] shadow-md transition hover:bg-white/95 dark:bg-surface dark:text-foreground"
            : "flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-border"
        }
      >
        <span className={isGlovo ? "text-[#666]" : ""}>📍</span>
        <span
          className={
            isGlovo
              ? "max-w-[140px] truncate sm:max-w-[200px]"
              : "hidden max-w-xs truncate sm:inline"
          }
        >
          {title}
        </span>
        {!isGlovo && (
          <span className="sm:hidden max-w-[100px] truncate text-xs">{selected.label}</span>
        )}
        <span className={`text-xs ${isGlovo ? "text-[#666]" : "text-muted"}`}>
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-[70] mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl">
            {addresses.map((address) => (
              <button
                key={address.id}
                onClick={() => onSelect(address)}
                className={`w-full px-4 py-3 text-left text-sm transition hover:bg-background ${
                  selected.id === address.id ? "bg-brand/10 text-brand font-medium" : ""
                }`}
              >
                <div className="font-medium">{address.label}</div>
                <div className="text-xs text-muted truncate">{address.address}</div>
              </button>
            ))}
            <button
              onClick={onUseCurrentLocation}
              disabled={loadingCurrent}
              className="w-full border-t border-border px-4 py-3 text-left text-sm font-medium text-brand hover:bg-background disabled:opacity-60"
            >
              {loadingCurrent ? "Getting your location..." : "Use current location"}
            </button>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="w-full border-t border-border px-4 py-3 text-left text-sm font-medium text-brand hover:bg-background"
            >
              + Add new address
            </button>
            {showAdd && (
              <div className="space-y-2 border-t border-border bg-surface p-3">
                <select
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value as "Home" | "Work" | "Other")}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  value={query}
                  onChange={(e) => void onSearchAddress(e.target.value)}
                  placeholder="Search address"
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand/30"
                />
                <div className="max-h-56 overflow-auto rounded-md border border-border bg-background">
                  {predictions.length ? (
                    predictions.map((p) => (
                      <button
                        key={p.placeId}
                        onClick={() => void onAddFromPrediction(p.placeId)}
                        disabled={adding}
                        className="block w-full border-b border-border px-2 py-2 text-left text-xs hover:bg-brand/10 disabled:opacity-60"
                      >
                        {p.description}
                      </button>
                    ))
                  ) : (
                    <p className="px-2 py-2 text-xs text-muted">Start typing to search addresses.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
