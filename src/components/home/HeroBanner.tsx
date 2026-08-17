"use client";

import { useEffect, useState } from "react";

import { fetchActiveHeroSlides, type HeroSlideRow } from "@/lib/api/contentApi";
import OptimizedImage from "@/components/OptimizedImage";

const AUTO_ADVANCE_MS = 5000;

/** Admin-managed promotional banner carousel — reads `hero_slides` from Supabase. */
export function HeroBanner() {
  const [slides, setSlides] = useState<HeroSlideRow[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await fetchActiveHeroSlides();
      if (!cancelled) setSlides(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="w-full">
      <div className="relative aspect-[970/250] w-full overflow-hidden rounded-2xl bg-surface-chip">
        {slides.map((slide, i) => (
          <OptimizedImage
            key={slide.id}
            src={slide.image_url}
            alt=""
            width={970}
            height={250}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {slides.length > 1 ? (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
