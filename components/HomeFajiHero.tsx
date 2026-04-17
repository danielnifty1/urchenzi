"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  addressFromGoogle,
  currentPosition,
  geocodePlace,
  reverseGeocode,
  searchPlaces,
} from "@/lib/maps/googleMaps";
import { useLocationStore } from "@/store/locationStore";

type HomeFajiHeroProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export const HomeFajiHero = ({ search, onSearchChange }: HomeFajiHeroProps) => {
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [predictions, setPredictions] = useState<Array<{ placeId: string; description: string }>>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [selectingPrediction, setSelectingPrediction] = useState(false);
  const addAddress = useLocationStore((state) => state.addAddress);
  const selectAddress = useLocationStore((state) => state.selectAddress);

  const onUseCurrent = async () => {
    setLoadingCurrent(true);
    try {
      const coords = await currentPosition();
      const address = await reverseGeocode(coords);
      addAddress(
        addressFromGoogle({
          address,
          lat: coords.lat,
          lng: coords.lng,
          label: "Other",
        }),
      );
      onSearchChange(address);
      toast.success("Current location selected.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not get current location.");
    } finally {
      setLoadingCurrent(false);
    }
  };

  const onSearchAddress = async (value: string) => {
    onSearchChange(value);
    if (!value.trim()) {
      setPredictions([]);
      return;
    }
    setLoadingPredictions(true);
    try {
      const results = await searchPlaces(value);
      setPredictions(results);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to load address suggestions.");
      setPredictions([]);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const onSelectPrediction = async (placeId: string) => {
    setSelectingPrediction(true);
    try {
      const place = await geocodePlace(placeId);
      const entry = addressFromGoogle({
        address: place.address,
        lat: place.coords.lat,
        lng: place.coords.lng,
        label: "Other",
      });
      addAddress(entry);
      selectAddress(entry);
      onSearchChange(place.address);
      setPredictions([]);
      toast.success("Address selected.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not select that address.");
    } finally {
      setSelectingPrediction(false);
    }
  };

  return (
    <section className="relative z-[2] w-full max-w-full overflow-x-clip bg-gradient-to-b from-[#fff5ed] from-0% via-[var(--accent)] via-40% to-[#d97238] to-100% px-4 pb-20 pt-2 dark:from-surface dark:via-background dark:to-background md:pb-16 md:pt-10">
      {/* Blur layers confuse iOS hit-testing; keep on md+ only. */}
      <div
        className="pointer-events-none absolute -left-16 top-8 hidden h-40 w-40 rounded-full bg-white/30 blur-2xl md:block"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-12 bottom-8 hidden h-44 w-44 rounded-full bg-brand/20 blur-2xl md:block"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto max-w-3xl touch-manipulation text-center">
        <h1 className="text-balance text-3xl font-bold leading-tight text-foreground dark:text-foreground md:text-4xl lg:text-5xl">
          Enter your address to know{" "}
          <span className="relative inline-block px-1">
            <span
              className="absolute inset-0 -skew-x-3 rounded-lg bg-white/80 dark:bg-brand/20"
              aria-hidden="true"
            />
            <span className="relative">what&apos;s near you</span>
          </span>
        </h1>
        <p className="mt-3 text-lg font-semibold text-[#1a1a1a]/90 dark:text-muted md:text-xl">
          Food delivery and more — groceries, shops, pharmacies, anything!
        </p>

        <div className="relative z-20 mx-auto mt-8 max-w-xl">
          <div className="flex items-center gap-2 rounded-full border border-white/70 bg-surface py-2 pl-4 pr-2 shadow-[0_12px_30px_rgba(0,0,0,0.15)] dark:border-border dark:bg-surface">
            <span className="text-lg text-muted dark:text-muted" aria-hidden="true">
              📍
            </span>
            <input
              value={search}
              onChange={(e) => void onSearchAddress(e.target.value)}
              placeholder="What's your address?"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted outline-none dark:text-foreground dark:placeholder:text-muted md:text-base"
            />
            <button
              type="button"
              onClick={() => void onUseCurrent()}
              disabled={loadingCurrent}
              className="hidden min-h-11 min-w-[44px] shrink-0 touch-manipulation rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/20 active:opacity-90 sm:inline dark:bg-brand/15 dark:text-accent"
            >
              {loadingCurrent ? "Locating..." : "Use current location"}
            </button>
            <span className="pr-3 text-muted dark:text-muted sm:hidden" aria-hidden="true">
              →
            </span>
          </div>
          {(loadingPredictions || predictions.length > 0) && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-white/30 bg-surface shadow-[0_12px_24px_rgba(0,0,0,0.16)] dark:border-border">
              {loadingPredictions ? (
                <p className="px-4 py-3 text-sm text-muted">Searching addresses...</p>
              ) : (
                predictions.map((p) => (
                  <button
                    key={p.placeId}
                    type="button"
                    disabled={selectingPrediction}
                    onClick={() => void onSelectPrediction(p.placeId)}
                    className="block w-full border-b border-border/60 px-4 py-3 text-left text-sm text-foreground transition hover:bg-brand/10 disabled:opacity-60"
                  >
                    {p.description}
                  </button>
                ))
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => void onUseCurrent()}
            disabled={loadingCurrent}
            aria-label="Use current location"
            className="mt-3 min-h-12 w-full touch-manipulation rounded-full border border-brand/25 bg-white/95 py-3 text-sm font-semibold text-[#1a3a52] shadow-md active:opacity-90 sm:hidden dark:border-border dark:bg-surface dark:text-foreground"
          >
            {loadingCurrent ? "Locating..." : "Use current location"}
          </button>
        </div>
      </div>
    </section>
  );
};
