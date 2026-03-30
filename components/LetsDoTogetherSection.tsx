"use client";

import Image from "next/image";
import Link from "next/link";

const items = [
  {
    title: "Become a rider",
    description:
      "Enjoy flexibility, freedom, and competitive earnings by delivering with UrchenziConnect.",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    href: "#",
    cta: "Register here",
  },
  {
    title: "Become a partner",
    description:
      "Grow with us. Our technology and customer base help you boost sales and reach new customers.",
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop",
    href: "#",
    cta: "Register here",
  },
  {
    title: "Careers",
    description:
      "Ready for a new challenge? If you are ambitious and love working with others, we want to hear from you.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop",
    href: "#",
    cta: "Register here",
  },
];

export const LetsDoTogetherSection = () => {
  return (
    <section className="bg-white px-4 pb-24 pt-14 md:pb-28 md:pt-20 dark:bg-surface">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-[#10131a] dark:text-foreground md:text-4xl">
          Let&apos;s do it together
        </h2>
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {items.map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center">
              <div className="relative mb-6 h-40 w-40 overflow-hidden rounded-full shadow-lg ring-4 ring-[#00A082]/15 dark:ring-[#1db39f]/25 md:h-44 md:w-44">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 160px, 176px"
                />
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#10131a] dark:text-foreground">
                {item.title}
              </h3>
              <p className="mb-6 max-w-xs text-sm leading-relaxed text-[#4a5568] dark:text-muted">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="inline-flex rounded-full bg-[#00A082] px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#008f72] dark:bg-[#1db39f] dark:hover:bg-[#179b8a]"
              >
                {item.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
