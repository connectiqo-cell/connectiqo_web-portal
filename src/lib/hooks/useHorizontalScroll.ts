"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared drag-free horizontal scroll-strip behavior: tracks whether the left/
 * right arrow buttons should show, and scrolls by one item's width + gap.
 * Items must carry the given `itemSelector` (e.g. "[data-card]") so the
 * scroll amount matches their actual rendered width.
 */
export function useHorizontalScroll<T>(items: T[], itemSelector: string, gap = 16) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const item = el.querySelector(itemSelector) as HTMLElement | null;
    const amount = (item?.offsetWidth ?? el.clientWidth) + gap;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return { scrollRef, canScrollLeft, canScrollRight, scroll };
}
