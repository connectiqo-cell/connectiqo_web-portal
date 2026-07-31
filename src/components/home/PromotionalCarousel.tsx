"use client";

import { useState } from "react";
import { ChevronRight, Zap } from "lucide-react";
import Link from "next/link";

const PROMOTIONAL_CARDS = [
  {
    id: 1,
    type: "gaming",
    title: "Join Gaming Session with Hazel Joshi!",
    subtitle: "Level up your skills with India's top female gamer and content creator.",
    tag: "1-on-1 Sessions",
    tagIcon: "⚡",
    image: "https://images.unsplash.com/photo-1599920917128-e4176e5b6e63?q=80&w=1000&auto=format&fit=crop",
    button: "Connect Now",
    gradient: "from-purple-900 via-purple-800 to-purple-900",
    textColor: "text-white",
    badgeText: "PLAY FOCUS WIN",
  },
  {
    id: 2,
    type: "coaching",
    title: "Join a session with Surbhi sharma!",
    subtitle: "Book a live 1-on-1 video session today.",
    tag: "1-on-1 Sessions",
    button: "Connect Now",
    gradient: "from-yellow-200 via-cyan-300 to-cyan-400",
    textColor: "text-gray-900",
    buttonBg: "bg-white text-purple-600",
  },
];

export function PromotionalCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCard = PROMOTIONAL_CARDS[activeIndex];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div
        className={`relative w-full rounded-2xl lg:rounded-3xl overflow-hidden bg-gradient-to-r ${activeCard.gradient} p-8 lg:p-12 min-h-96`}
        style={{
          backgroundImage:
            activeCard.type === "gaming"
              ? "url('https://images.unsplash.com/photo-1599920917128-e4176e5b6e63?q=80&w=1000&auto=format&fit=crop')"
              : "none",
          backgroundSize: activeCard.type === "gaming" ? "cover" : "auto",
          backgroundPosition: activeCard.type === "gaming" ? "center right" : "center",
        }}
      >
        {activeCard.type === "gaming" && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-purple-900/20 pointer-events-none" />
        )}

        <div className="relative z-10 max-w-2xl h-full flex flex-col justify-between">
          {/* Top badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg">⚡</span>
            <span className={`text-sm font-semibold ${activeCard.textColor} opacity-90`}>
              {activeCard.tag}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h2 className={`text-3xl lg:text-4xl font-bold ${activeCard.textColor} mb-4 leading-tight`}>
              {activeCard.title.split(" ").map((word, i) => {
                const isHighlight = word.toLowerCase().includes("hazel") || word.toLowerCase().includes("surbhi");
                return isHighlight ? (
                  <span key={i} className="text-yellow-400">
                    {word}{" "}
                  </span>
                ) : (
                  <span key={i}>{word} </span>
                );
              })}
            </h2>
            <p className={`text-lg ${activeCard.textColor} opacity-90 mb-8`}>
              {activeCard.subtitle}
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <Link
              href="/discover"
              className={`px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition hover:scale-105 ${
                activeCard.buttonBg || "bg-yellow-400 text-purple-900 hover:bg-yellow-300"
              }`}
            >
              {activeCard.button}
              <ChevronRight size={18} />
            </Link>

            {/* Badge text for gaming */}
            {activeCard.type === "gaming" && (
              <div className="text-right">
                <p className="text-purple-300 text-sm font-bold tracking-widest">
                  {activeCard.badgeText}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carousel dots */}
      <div className="flex gap-2 justify-center mt-6">
        {PROMOTIONAL_CARDS.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex ? "bg-purple-600 w-8" : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
