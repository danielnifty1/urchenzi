"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const footerLinks = {
  company: [
    { label: "About Us", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Contact", href: "#" },
  ],
  services: [
    { label: "Delivery", href: "#" },
    { label: "For Restaurants", href: "#" },
    { label: "For Groceries", href: "#" },
    { label: "For Pharmacies", href: "#" },
    { label: "For Shops", href: "#" },
  ],
  support: [
    { label: "Help Center", href: "#" },
    { label: "Safety & Trust", href: "#" },
    { label: "Track Order", href: "#" },
    { label: "Promotions", href: "#" },
    { label: "Gift Cards", href: "#" },
  ],
  legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Accessibility", href: "#" },
  ],
};

export const Footer = () => {
  const pathname = usePathname();
  const showHomeWave = pathname === "/";

  return (
    <footer className="bg-gradient-to-b from-[#1a1a1a] to-[#10131a] text-white">
      {showHomeWave && (
        <div className="relative z-0 -mt-14 w-full leading-[0] text-[#1a1a1a] dark:text-[#0a0a0a] md:-mt-20">
          <svg
            className="block h-10 w-full md:h-14"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.39C1132.19,118.92,1055.71,111.91,985.66,92.83Z"
            />
          </svg>
        </div>
      )}
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Community first delivery</p>
            <h3 className="mt-2 text-xl font-bold text-white">Everything nearby, delivered with style.</h3>
          </div>
          <a
            href="#"
            className="mt-4 inline-flex rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black transition hover:brightness-95 md:mt-0"
          >
            Start ordering
          </a>
        </div>
        {/* Main Footer Content */}
        <div className="grid gap-12 md:grid-cols-5 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <div className="font-black text-accent text-2xl">U</div>
                <div className="font-black text-white text-2xl">C</div>
              </div>
              <div>
                <div className="font-bold text-lg">URCHENZI</div>
                <div className="text-xs text-white/70">CONNECT</div>
              </div>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              We connect people, goods, and businesses seamlessly. Your community marketplace for everything you need.
            </p>
            <p className="text-sm font-semibold text-accent">www.urchenziconnect.com</p>
            {/* Social Links */}
            <div className="flex gap-4 pt-2">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand transition flex items-center justify-center"
                title="Facebook"
              >
                f
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand transition flex items-center justify-center"
                title="Twitter"
              >
                𝕏
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand transition flex items-center justify-center"
                title="Instagram"
              >
                📷
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand transition flex items-center justify-center"
                title="LinkedIn"
              >
                in
              </a>
            </div>
          </div>

          {/* Links Sections */}
          <div className="flex flex-wrap gap-6 md:col-span-3 md:grid md:grid-cols-3 md:gap-6">
            <div className="min-w-[140px] flex-1">
              <h4 className="font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 hover:text-brand transition"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-[140px] flex-1">
              <h4 className="font-bold mb-4 text-white">Services</h4>
              <ul className="space-y-3">
                {footerLinks.services.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 hover:text-brand transition"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-[140px] flex-1">
              <h4 className="font-bold mb-4 text-white">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 hover:text-brand transition"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-bold text-white">Get Offers</h4>
            <p className="text-sm text-white/70">
              Subscribe to get exclusive deals and the latest updates.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-brand focus:outline-none"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark transition font-semibold text-white"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
            {/* App Links */}
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
              <a
                href="#"
                className="px-4 py-2 bg-white/10 hover:bg-brand/20 rounded-lg text-sm font-semibold transition"
              >
                iOS App
              </a>
              <a
                href="#"
                className="px-4 py-2 bg-white/10 hover:bg-brand/20 rounded-lg text-sm font-semibold transition"
              >
                Android App
              </a>
              <a
                href="#"
                className="px-4 py-2 bg-white/10 hover:bg-brand/20 rounded-lg text-sm font-semibold transition"
              >
                Web App
              </a>
            </div>

            {/* Legal Links */}
            <div className="grid grid-cols-2 gap-3 text-xs text-white/70 sm:flex sm:flex-wrap sm:gap-4">
              {footerLinks.legal.map((link) => (
                <a key={link.label} href={link.href} className="hover:text-brand transition">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} UrchenziConnect. All rights reserved. • Designed & built with care
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
