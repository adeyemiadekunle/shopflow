import { Header } from "@/components/header"
import { Stories } from "@/components/stories"
import { FeedTabs } from "@/components/feed-tabs"
import { TrendingProductGrid } from "@/components/trending-product-grid"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { feedPosts } from "@/lib/feed-data"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-8">
          {/* Stories */}
          <Stories />

          {/* Trending Products */}
          <TrendingProductGrid />

          {/* Feed */}
          <FeedTabs initialPosts={feedPosts} />
        </main>

        {/* Sidebar - visible on xl screens */}
        <Sidebar />
      </div>

      {/* Footer - visible on desktop */}
      <Footer />

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  )
}
