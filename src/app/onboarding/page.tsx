"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ROUTES } from "@/lib/routes";

export default function OnboardingVideoPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-linear-to-br from-accent-primary to-accent-secondary flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Video Container */}
        <div className="relative aspect-video mb-8 rounded-2xl overflow-hidden bg-black shadow-2xl">
          <video
            className="w-full h-full object-cover"
            poster="/videos/testimonial-poster.jpg"
            controls={isPlaying}
            onPlay={() => setIsPlaying(true)}
          >
            <source src="/videos/welcome.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Play Button Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer">
              <button
                onClick={() => setIsPlaying(true)}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-accent-primary hover:scale-110 transition-transform"
              >
                <Play size={40} className="ml-1 fill-current" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-center text-white space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-3">Welcome to Connectiqo</h1>
            <p className="text-lg text-white/80">
              Discover expert mentors and grow together through personalized 1-on-1 sessions
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href={ROUTES.interestsOnboarding}
              className="px-8 py-3 bg-white text-accent-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Continue
            </Link>
            <Link
              href={ROUTES.home}
              className="px-8 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors border border-white/50"
            >
              Skip
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
