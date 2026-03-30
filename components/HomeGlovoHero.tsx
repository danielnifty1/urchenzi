"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { addressFromGoogle, currentPosition, reverseGeocode } from "@/lib/maps/googleMaps";
import { useLocationStore } from "@/store/locationStore";

type HomeGlovoHeroProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export const HomeGlovoHero = ({ search, onSearchChange }: HomeGlovoHeroProps) => {
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const addAddress = useLocationStore((state) => state.addAddress);

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

  return (
    <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-[#FFC244] px-4 pb-14 pt-8 dark:bg-gradient-to-b dark:from-surface dark:to-background md:pb-16 md:pt-10">
      <div className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-white/30 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute -right-12 bottom-8 h-44 w-44 rounded-full bg-[#00A082]/20 blur-2xl" aria-hidden />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-balance text-3xl font-bold leading-tight text-[#10131a] dark:text-foreground md:text-4xl lg:text-5xl">
          Enter your address to know{" "}
          <span className="relative inline-block px-1">
            <span
              className="absolute inset-0 -skew-x-3 rounded-lg bg-white/80 dark:bg-brand/20"
              aria-hidden
            />
            <span className="relative">what&apos;s near you</span>
          </span>
        </h1>
        <p className="mt-3 text-lg font-semibold text-[#10131a]/90 dark:text-muted md:text-xl">
          Food delivery and more — groceries, shops, pharmacies, anything!
        </p>

        <div className="mx-auto mt-8 max-w-xl">
          <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white py-2 pl-4 pr-2 shadow-[0_12px_30px_rgba(0,0,0,0.15)] dark:border dark:border-border dark:bg-surface">
            <span className="text-lg text-[#666] dark:text-muted" aria-hidden>
              📍
            </span>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="What's your address?"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#10131a] placeholder:text-[#888] outline-none dark:text-foreground dark:placeholder:text-muted md:text-base"
            />
            <button
              type="button"
              onClick={() => void onUseCurrent()}
              disabled={loadingCurrent}
              className="hidden shrink-0 rounded-full bg-[#E9F8F5] px-4 py-2 text-sm font-semibold text-[#00A082] transition hover:bg-[#d8f0eb] sm:inline dark:bg-brand/15 dark:text-brand"
            >
              {loadingCurrent ? "Locating..." : "Use current location"}
            </button>
            <span className="pr-3 text-[#888] dark:text-muted sm:hidden" aria-hidden>
              →
            </span>
          </div>
          <button
            type="button"
            onClick={() => void onUseCurrent()}
            disabled={loadingCurrent}
            className="mt-3 w-full rounded-full bg-[#E9F8F5] py-2.5 text-sm font-semibold text-[#00A082] sm:hidden dark:bg-brand/15 dark:text-brand"
          >
            {loadingCurrent ? "Locating..." : "Use current location"}
          </button>
        </div>
      </div>
    </section>
  );
};
