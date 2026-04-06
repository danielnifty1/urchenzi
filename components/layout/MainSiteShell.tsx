import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export function MainSiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="relative z-0 mx-auto w-full max-w-6xl flex-1 overflow-x-hidden px-4 py-6 md:py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
