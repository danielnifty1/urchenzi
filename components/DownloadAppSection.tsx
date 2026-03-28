"use client";

export const DownloadAppSection = () => {
  return (
    <section className="rounded-3xl bg-gradient-to-r from-brand to-brand-dark overflow-hidden">
      <div className="grid gap-8 md:gap-12 md:grid-cols-2 items-center px-8 md:px-12 py-16 md:py-24">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-3">
              Download Our App
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight text-balance">
              Get deliveries in minutes
            </h2>
          </div>

          <p className="text-lg text-white/90 leading-relaxed">
            Download the UrchenziConnect app and enjoy exclusive mobile-only deals, push notifications for promotions, and seamless one-tap ordering.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <a
              href="#"
              className="flex items-center justify-center gap-3 px-6 py-3 bg-white text-brand font-bold rounded-full hover:bg-accent transition shadow-lg hover:shadow-xl"
            >
              <span className="text-xl">🍎</span>
              App Store
            </a>
            <a
              href="#"
              className="flex items-center justify-center gap-3 px-6 py-3 bg-white text-brand font-bold rounded-full hover:bg-accent transition shadow-lg hover:shadow-xl"
            >
              <span className="text-xl">🤖</span>
              Google Play
            </a>
          </div>

          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-white">2M+</p>
              <p className="text-sm text-white/80">Downloads</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">4.8★</p>
              <p className="text-sm text-white/80">Rating</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-sm text-white/80">Reviews</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-xs">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl"></div>
            <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <div className="space-y-4">
                <div className="h-12 bg-white/20 rounded-lg"></div>
                <div className="space-y-3">
                  <div className="h-6 bg-white/20 rounded w-3/4"></div>
                  <div className="h-6 bg-white/20 rounded w-1/2"></div>
                </div>
                <div className="h-32 bg-white/20 rounded-lg mt-6"></div>
                <div className="h-10 bg-white/30 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
