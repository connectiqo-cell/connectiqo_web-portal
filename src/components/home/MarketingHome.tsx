"use client";

import { ChevronRight, Search, Clock, Shield, MapPin, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ROUTES } from "@/lib/routes";

const CREATORS = [
  { name: "Ankur Warikoo", role: "Entrepreneur & Content Creator", rating: 4.9, count: "2.1k", price: 499, category: "Business" },
  { name: "Prajakta Koli", role: "YouTuber & Influencer", rating: 4.9, count: "1.8k", price: 399, category: "Entertainment" },
  { name: "Andrej Karpathy", role: "AI Researcher", rating: 4.9, count: "967", price: 799, category: "AI" },
  { name: "Yogini Melania", role: "Yoga & Wellness Expert", rating: 4.8, count: "1.2k", price: 499, category: "Health" },
];

const CATEGORIES = [
  { id: "Business", label: "Business & Startup", icon: "📊" },
  { id: "Finance", label: "Finance & Investing", icon: "📈" },
  { id: "AI", label: "AI & Technology", icon: "🤖" },
  { id: "Health", label: "Health & Fitness", icon: "💪" },
  { id: "Spirituality", label: "Spirituality", icon: "✨" },
  { id: "Education", label: "Education", icon: "🎓" },
  { id: "Entertainment", label: "Entertainment", icon: "🎬" },
  { id: "Lifestyle", label: "Lifestyle", icon: "🛍️" },
];

function MarketingHome() {
  const [activeCategory, setActiveCategory] = useState("Business");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");

  const filteredCreators = CREATORS.filter(c => activeCategory === "All" || c.category === activeCategory);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-200 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-purple-600">Connectiqo</div>

          <nav className="hidden lg:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-purple-600 pb-1">Home</a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">Discover Creators</a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">Categories</a>
            <a href={ROUTES.login} className="text-sm font-medium text-gray-600 hover:text-gray-900">Become a Creator</a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-purple-50 rounded-full transition">
              <Search size={18} className="text-gray-600" />
            </button>
            <Link href={ROUTES.login} className="px-5 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-full hover:border-purple-400 hover:text-purple-600 transition">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-50 to-white px-6 sm:px-8 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-600 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              ✦ Connect · Learn · Grow · Earn
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
              Connect with <span className="text-purple-600">Connectiqo</span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-md">
              Join 1-on-1 video sessions with your favorite creators, mentors &amp; experts. Build real connections and grow together.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search creators, mentors, experts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={() => showToast(searchQuery ? `Searching for "${searchQuery}"...` : "Type something to search")}
                className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition whitespace-nowrap"
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2"><Clock size={16} className="text-purple-600" /> 1-on-1 Video Calls</span>
              <span className="flex items-center gap-2"><Shield size={16} className="text-purple-600" /> Trusted Creators</span>
              <span className="flex items-center gap-2"><MapPin size={16} className="text-purple-600" /> Secure &amp; Safe</span>
              <span className="flex items-center gap-2"><Calendar size={16} className="text-purple-600" /> Easy Booking</span>
            </div>
          </div>

          <div className="hidden lg:block relative aspect-square">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-purple-600 rounded-3xl opacity-20 blur-3xl" />
            <div className="relative h-full bg-gradient-to-br from-purple-200 to-purple-400 rounded-3xl flex items-center justify-center text-9xl">
              👋
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        <div className="flex gap-2 overflow-x-auto pb-4 border border-gray-200 rounded-2xl p-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition flex-shrink-0 ${
                activeCategory === cat.id
                  ? "bg-purple-100 text-purple-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">Trending Creators 🔥</h2>
            <p className="text-gray-600 text-sm">Top creators loved by our community</p>
          </div>
          <a href="#" className="text-purple-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition">
            View All <ChevronRight size={16} />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCreators.map((creator) => (
            <div key={creator.name} className="border border-gray-200 rounded-2xl p-4 hover:shadow-lg hover:-translate-y-1 transition bg-white">
              <div className="aspect-video bg-gradient-to-br from-purple-300 to-purple-600 rounded-xl mb-4" />

              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                {creator.name}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-purple-600">
                  <path d="M12 2l2.4 2.2 3.2-.6.9 3.1 3.1.9-.6 3.2L23 12l-2.2 2.4.6 3.2-3.1.9-.9 3.1-3.2-.6L12 23l-2.4-2.2-3.2.6-.9-3.1-3.1-.9.6-3.2L1 12l2.2-2.4-.6-3.2 3.1-.9.9-3.1 3.2.6z" />
                </svg>
              </div>

              <p className="text-xs text-gray-600 mb-2">{creator.role}</p>

              <div className="flex items-center gap-2 text-xs font-semibold mb-4">
                ⭐ {creator.rating} <span className="text-gray-500 font-normal">({creator.count})</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">₹{creator.price} / session</span>
                <button
                  onClick={() => showToast(`Session request sent to ${creator.name}`)}
                  className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-20">
        <div className="bg-gradient-to-r from-purple-600 to-purple-900 rounded-3xl p-8 sm:p-12 text-white">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">👥</div>
              <div>
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-xs sm:text-sm text-white/75">Active Creators</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">▶️</div>
              <div>
                <div className="text-2xl font-bold">50K+</div>
                <div className="text-xs sm:text-sm text-white/75">Sessions Booked</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">😊</div>
              <div>
                <div className="text-2xl font-bold">100K+</div>
                <div className="text-xs sm:text-sm text-white/75">Happy Users</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">⭐</div>
              <div>
                <div className="text-2xl font-bold">4.8/5</div>
                <div className="text-xs sm:text-sm text-white/75">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

export { MarketingHome };
