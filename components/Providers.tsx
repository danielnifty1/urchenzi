"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/AuthProvider";
import { FirebaseAnalytics } from "@/components/FirebaseAnalytics";
import { RiderGlobalNotifications } from "@/components/RiderGlobalNotifications";
import { VendorGlobalNotifications } from "@/components/VendorGlobalNotifications";
import { ThemeController } from "@/components/ThemeController";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeController />
      <FirebaseAnalytics />
      <AuthProvider>
        <RiderGlobalNotifications />
        <VendorGlobalNotifications>{children}</VendorGlobalNotifications>
      </AuthProvider>
      <Toaster position="top-right" containerStyle={{ zIndex: 11000 }} />
    </QueryClientProvider>
  );
};
