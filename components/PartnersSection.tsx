"use client";

const partners = [
  { id: 1, name: "Burger King", icon: "🍔" },
  { id: 2, name: "Whole Foods", icon: "🥕" },
  { id: 3, name: "Starbucks", icon: "☕" },
  { id: 4, name: "Pharmacy Plus", icon: "💊" },
  { id: 5, name: "Fresh Market", icon: "🌽" },
  { id: 6, name: "Florist Co", icon: "🌺" },
  { id: 7, name: "Wine Shop", icon: "🍷" },
  { id: 8, name: "Local Bakery", icon: "🥐" },
];

export const PartnersSection = () => {
  return (
    <section className="space-y-12">
      <div className="text-center space-y-4">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">
          Our Partners
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Trusted by thousands of merchants
        </h2>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Join the fastest-growing delivery network with restaurants, groceries, pharmacies, and shops across the city.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="group rounded-2xl border border-border bg-surface p-6 hover:border-brand hover:shadow-lg transition flex flex-col items-center text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition">
              {partner.icon}
            </div>
            <p className="font-semibold text-foreground text-sm md:text-base">
              {partner.name}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-brand/10 border-2 border-brand rounded-2xl p-8 md:p-12 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Become a Partner
        </h3>
        <p className="text-muted mb-6 max-w-2xl mx-auto">
          Grow your business with UrchenziConnect. Access millions of customers and increase your sales.
        </p>
        <a
          href="#"
          className="inline-block px-8 py-3 bg-brand text-white font-bold rounded-full hover:bg-brand-dark transition"
        >
          Start Selling
        </a>
      </div>
    </section>
  );
};
