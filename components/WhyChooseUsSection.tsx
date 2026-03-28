"use client";

const features = [
  {
    id: 1,
    icon: "⚡",
    title: "Lightning Fast Delivery",
    description: "Most orders delivered in under 20 minutes. Real-time tracking so you know exactly when your order arrives.",
  },
  {
    id: 2,
    icon: "🛡️",
    title: "100% Safe & Secure",
    description: "Your data and payments are protected with industry-leading encryption and security protocols.",
  },
  {
    id: 3,
    icon: "💰",
    title: "Best Prices Guaranteed",
    description: "Compare prices across vendors and enjoy daily promotions, exclusive deals, and loyalty rewards.",
  },
  {
    id: 4,
    icon: "🎯",
    title: "Wide Selection",
    description: "Food, groceries, pharmacy, flowers, and everything else in one app. All from your favorite local shops.",
  },
  {
    id: 5,
    icon: "🤝",
    title: "24/7 Customer Support",
    description: "Our dedicated support team is always available to help. Chat, call, or email us anytime.",
  },
  {
    id: 6,
    icon: "✨",
    title: "Premium Experience",
    description: "Seamless ordering, multiple payment options, saved addresses, and one-tap checkout for convenience.",
  },
];

export const WhyChooseUsSection = () => {
  return (
    <section className="space-y-12">
      <div className="text-center space-y-4">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">
          Why Choose Us
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Experience the difference
        </h2>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          We&apos;re not just a delivery app—we&apos;re your trusted partner for everything you need.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="rounded-2xl bg-surface border border-border p-8 hover:border-brand hover:shadow-lg transition space-y-4"
          >
            <div className="text-5xl">{feature.icon}</div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-12 md:p-16 text-center text-white">
        <h3 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to get started?
        </h3>
        <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg">
          Join millions of satisfied customers who trust UrchenziConnect for their delivery needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="px-8 py-3 bg-white text-brand font-bold rounded-full hover:bg-accent transition"
          >
            Start Ordering Now
          </a>
          <a
            href="#"
            className="px-8 py-3 bg-white/20 border-2 border-white text-white font-bold rounded-full hover:bg-white/30 transition"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
};
