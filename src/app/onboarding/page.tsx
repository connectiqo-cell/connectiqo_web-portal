"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ROUTES } from "@/lib/routes";

export default function OnboardingVideoPage() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleContinue = () => {
    router.push(ROUTES.categoriesOnboarding);
  };

  const handleSkip = () => {
    router.push(ROUTES.home);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-accent-primary via-accent-secondary to-accent-primary p-6">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        {/* Header */}
        <div className="text-center text-white">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-2">Welcome to Connectiqo</h1>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            Discover expert mentors and grow together through personalized 1-on-1 sessions
          </p>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl group">
          <video
            className="w-full h-full object-cover"
            poster="/videos/testimonial-poster.jpg"
            controls={isPlaying}
            onPlay={() => setIsPlaying(true)}
            playsInline
          >
            <source src="/videos/welcome.mp4" type="video/mp4" />
          </video>

          {/* Play Button Overlay */}
          {!isPlaying && (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group-hover:bg-black/50 cursor-pointer"
              aria-label="Play video"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-accent-primary hover:scale-110 transition-transform shadow-lg">
                <Play size={40} className="ml-1 fill-current" />
              </div>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-white text-accent-primary font-extrabold rounded-full hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl active:scale-95"
          >
            Continue
          </button>
          <button
            onClick={handleSkip}
            className="px-8 py-3 bg-white/20 text-white font-extrabold rounded-full hover:bg-white/30 transition-colors border border-white/50 hover:border-white/80 backdrop-blur-sm"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
