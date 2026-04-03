import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export default function MainShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-8">{children}</main>
      <Footer />
    </>
  );
}
