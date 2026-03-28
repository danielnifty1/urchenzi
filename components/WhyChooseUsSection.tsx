"use client";

const services = [
  {
    id: 1,
    number: "1",
    icon: "🏍️",
    title: "On-Demand Delivery",
    description: "Fast & Reliable Local Delivery. Packages, Groceries, & More.",
    benefits: ["Real-time tracking", "Multiple vendor support", "Trusted riders"],
  },
  {
    id: 2,
    number: "2",
    icon: "🛒",
    title: "Vendor Marketplace",
    description: "Shop Unique Local Products. Support Local Businesses.",
    benefits: ["Diverse merchants", "Quality assurance", "Exclusive deals"],
  },
  {
    id: 3,
    number: "3",
    icon: "🚗",
    title: "Services & Errands",
    description: "Rides and Errand Assistance when you need it.",
    benefits: ["Professional services", "Flexible scheduling", "Verified providers"],
  },
  {
    id: 4,
    number: "4",
    icon: "💳",
    title: "Integrated Payments",
    description: "Fast, secure in-app payments coming soon!",
    benefits: ["Multiple payment methods", "Secure transactions", "Easy refunds"],
  },
];

export const WhyChooseUsSection = () => {
  return (
    <section className="space-y-12">
      <div className="text-center space-y-4">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">
          What We Offer
        </p>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground">
          We connect people, goods, and businesses seamlessly
        </h2>
        <p className="text-lg text-muted max-w-3xl mx-auto">
          Everything you need in one platform—from fast delivery to local marketplace to services and secure payments.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-2xl bg-surface border-2 border-border p-8 hover:border-accent hover:shadow-lg transition"
          >
            <div className="flex items-start gap-6 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold text-lg">
                {service.number}
              </div>
              <div className="text-4xl">{service.icon}</div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {service.title}
            </h3>
            <p className="text-foreground font-medium mb-4">{service.description}</p>
            <ul className="space-y-2">
              {service.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-brand via-brand-dark to-brand p-12 md:p-16 text-center text-white">
        <h3 className="text-3xl md:text-4xl font-bold mb-4">
          Your Community, Connected
        </h3>
        <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg">
          Join thousands of users and businesses who trust UrchenziConnect to connect them with what they need.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="px-8 py-3 bg-accent text-brand font-bold rounded-full hover:bg-white transition"
          >
            Start Ordering Now
          </a>
          <a
            href="https://www.urchenziconnect.com"
            className="px-8 py-3 bg-white/20 border-2 border-white text-white font-bold rounded-full hover:bg-white/30 transition"
          >
            Visit Our Website
          </a>
        </div>
      </div>
    </section>
  );
};
