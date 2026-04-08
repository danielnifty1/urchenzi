import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export function MainSiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="relative z-0 mx-auto w-full max-w-6xl flex-1 overflow-x-hidden px-4 pb-6 max-md:pt-[calc(8.5rem+env(safe-area-inset-top,0px))] md:py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
