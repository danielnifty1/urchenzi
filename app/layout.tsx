import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "UrchenziConnect - Fast Delivery at Your Door",
    template: "%s | UrchenziConnect",
  },
  description:
    "Order food, groceries, flowers, and more from local vendors. Fast delivery in minutes with real-time tracking. Download the UrchenziConnect app today!",
  keywords: ["delivery", "food", "groceries", "pharmacy", "marketplace", "fast delivery"],
  authors: [{ name: "UrchenziConnect" }],
  openGraph: {
    title: "UrchenziConnect - Everything Delivered in Minutes",
    description: "Fast delivery service for food, groceries, and more",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var raw = localStorage.getItem("urchenzi-theme");
                  if (!raw) return;
                  var parsed = JSON.parse(raw);
                  var mode = parsed && parsed.state && parsed.state.mode;
                  if (mode === "dark") {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground flex flex-col">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
