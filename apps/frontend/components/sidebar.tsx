"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FollowButton } from "@/components/follow-button"
import { LiveShoppingCard, type LiveShoppingEvent } from "@/components/live-shopping-card"
import { SectionActionButton } from "@/components/section-action-button"
import { Radio, Flame } from "lucide-react"

const suggestedSellers = [
  {
    id: 1,
    name: "Emma Watson",
    username: "@emmastyle",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop",
    followers: "2.1M",
    isVerified: true,
    category: "Fashion",
  },
  {
    id: 2,
    name: "David Chen",
    username: "@davidtech",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop",
    followers: "890K",
    isVerified: true,
    category: "Tech",
  },
  {
    id: 3,
    name: "Sophia Lin",
    username: "@sophiabeauty",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop",
    followers: "1.5M",
    isVerified: false,
    category: "Beauty",
  },
  {
    id: 4,
    name: "Home Haven",
    username: "@homehaven",
    avatar: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop",
    followers: "456K",
    isVerified: true,
    category: "Home",
  },
]

const liveNow: LiveShoppingEvent[] = [
  {
    id: 1,
    title: "Summer Collection Launch",
    host: "Nike Official",
    viewers: "12.4K",
    thumbnail: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200&h=280&fit=crop",
  },
  {
    id: 2,
    title: "Tech Unboxing",
    host: "TechReviews",
    viewers: "8.2K",
    thumbnail: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=200&h=280&fit=crop",
  },
]

const categories = [
  { name: "Fashion", emoji: "👗", count: "12.5K" },
  { name: "Tech", emoji: "📱", count: "8.9K" },
  { name: "Beauty", emoji: "💄", count: "15.2K" },
  { name: "Home", emoji: "🏠", count: "6.7K" },
  { name: "Sports", emoji: "⚽", count: "9.1K" },
]

export function Sidebar() {
  return (
    <aside className="hidden xl:block w-80 shrink-0 border-l border-border p-6 space-y-8 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
      {/* Live Shopping */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold">Live Shopping</h3>
          </div>
          <SectionActionButton />
        </div>
        <div className="space-y-3">
          {liveNow.map((live) => (
            <LiveShoppingCard key={live.id} liveEvent={live} />
          ))}
        </div>
      </section>

      {/* Suggested Creators */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold">Suggested Sellers</h3>
          </div>
          <SectionActionButton />
        </div>
        <div className="space-y-3">
          {suggestedSellers.map((seller) => (
            <div
              key={seller.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={seller.avatar} />
                  <AvatarFallback>{seller.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{seller.name}</span>
                    {seller.isVerified && (
                      <svg className="h-3.5 w-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{seller.followers} followers</p>
                </div>
              </div>
              <FollowButton variant="outline" />
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h3 className="text-sm font-semibold mb-4">Browse Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.name}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-xs font-medium transition-colors"
            >
              <span>{category.emoji}</span>
              <span>{category.name}</span>
              <span className="text-muted-foreground">({category.count})</span>
            </button>
          ))}
        </div>
      </section>

      {/* Footer Links */}
      <footer className="text-xs text-muted-foreground pt-4 border-t border-border">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a href="#" className="hover:text-foreground">About</a>
          <a href="#" className="hover:text-foreground">Help</a>
          <a href="#" className="hover:text-foreground">Press</a>
          <a href="#" className="hover:text-foreground">API</a>
          <a href="#" className="hover:text-foreground">Jobs</a>
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
        </div>
        <p className="mt-3">© 2026 Shopflow</p>
      </footer>
    </aside>
  )
}
