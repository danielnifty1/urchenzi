"use client";

import Link from "next/link";

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
  return (
    <footer className="bg-foreground text-white">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        {/* Main Footer Content */}
        <div className="grid gap-12 md:grid-cols-5 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-3xl font-bold text-brand">🚀</div>
              <div>
                <div className="font-bold text-lg">Urchenzi</div>
                <div className="text-xs text-white/70">Connect</div>
              </div>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              Fast delivery of everything you need, from restaurants to groceries, right to your door.
            </p>
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
          <div>
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

          <div>
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

          <div>
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
            <div className="flex flex-col sm:flex-row gap-3">
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
            <div className="flex flex-wrap gap-4 text-xs text-white/70">
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
