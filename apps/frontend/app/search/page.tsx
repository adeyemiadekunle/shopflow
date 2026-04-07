"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Search, Heart, Star, X, TrendingUp, Clock, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { FollowButton } from "@/components/follow-button"
import { products } from "@/lib/products-data"

const trendingSearches = [
  "Minimalist watch",
  "Wireless earbuds",
  "Sustainable fashion",
  "Home decor",
  "Skincare routine",
  "Tech gadgets",
]

const popularSellers = [
  {
    name: "Alex Style",
    username: "alexstyle",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    verified: true,
    followers: "245K",
  },
  {
    name: "Tech Guru",
    username: "techguru",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    verified: true,
    followers: "1.2M",
  },
  {
    name: "Sarah Mitchell",
    username: "sarahstyle",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    verified: true,
    followers: "890K",
  },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(initialQuery)
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "leather bag",
    "headphones",
    "sneakers",
  ])
  const [likedProducts, setLikedProducts] = useState<number[]>([])

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
    }
  }, [initialQuery])

  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.brand.toLowerCase().includes(lowerQuery) ||
        product.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery)
    )
  }, [query])

  const sellerResults = useMemo(() => {
    if (!query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    return popularSellers.filter(
      (seller) =>
        seller.name.toLowerCase().includes(lowerQuery) ||
        seller.username.toLowerCase().includes(lowerQuery)
    )
  }, [query])

  const toggleLike = (productId: number) => {
    setLikedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    if (searchTerm && !recentSearches.includes(searchTerm)) {
      setRecentSearches((prev) => [searchTerm, ...prev.slice(0, 4)])
    }
  }

  const clearRecentSearch = (searchTerm: string) => {
    setRecentSearches((prev) => prev.filter((s) => s !== searchTerm))
  }

  const hasResults = query.trim() && (searchResults.length > 0 || sellerResults.length > 0)
  const noResults = query.trim() && searchResults.length === 0 && sellerResults.length === 0

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, creators, categories..."
              className="w-full h-14 pl-12 pr-12 rounded-2xl bg-secondary border-0 text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {hasResults && (
            <div className="mt-8">
              <Tabs defaultValue="products">
                <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 gap-8 mb-6">
                  <TabsTrigger
                    value="products"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent pb-3"
                  >
                    Products ({searchResults.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="sellers"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent pb-3"
                  >
                    Sellers ({sellerResults.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="products">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchResults.map((product) => (
                      <Link key={product.id} href={`/product/${product.id}`}>
                        <div className="group bg-card rounded-xl overflow-hidden border border-border hover:border-accent/50 transition-all">
                          <div className="relative aspect-square overflow-hidden">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                toggleLike(product.id)
                              }}
                              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  likedProducts.includes(product.id)
                                    ? "fill-red-500 text-red-500"
                                    : "text-foreground"
                                }`}
                              />
                            </button>
                            {product.originalPrice && (
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                                Sale
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-muted-foreground">{product.brand}</p>
                            <h3 className="text-sm font-medium mt-0.5 truncate">{product.name}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 fill-accent text-accent" />
                              <span className="text-xs">{product.rating}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm font-semibold">${product.price}</span>
                              {product.originalPrice && (
                                <span className="text-xs text-muted-foreground line-through">
                                  ${product.originalPrice}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="sellers">
                  <div className="space-y-4">
                    {sellerResults.map((seller) => (
                      <Link key={seller.username} href={`/seller/${seller.username}`}>
                        <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-accent/50 transition-all">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={seller.avatar} />
                            <AvatarFallback>{seller.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{seller.name}</span>
                              {seller.verified && (
                                <BadgeCheck className="h-4 w-4 text-accent" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">@{seller.username}</p>
                            <p className="text-xs text-muted-foreground mt-1">{seller.followers} followers</p>
                          </div>
                          <FollowButton variant="secondary" size="pill-sm" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* No Results */}
          {noResults && (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold">No results for &quot;{query}&quot;</h2>
              <p className="text-muted-foreground mt-2">
                Try searching for something else or check the spelling
              </p>
            </div>
          )}

          {/* Default State - No Query */}
          {!query.trim() && (
            <div className="mt-8 space-y-8">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h2 className="font-medium">Recent Searches</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors group"
                      >
                        <span
                          className="text-sm"
                          onClick={() => handleSearch(search)}
                        >
                          {search}
                        </span>
                        <X
                          className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearRecentSearch(search)
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h2 className="font-medium">Trending Searches</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-sm"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Sellers */}
              <div>
                <h2 className="font-medium mb-4">Popular Sellers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {popularSellers.map((seller) => (
                    <Link key={seller.username} href={`/seller/${seller.username}`}>
                      <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-accent/50 transition-all">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={seller.avatar} />
                          <AvatarFallback>{seller.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium truncate">{seller.name}</span>
                            {seller.verified && (
                              <BadgeCheck className="h-4 w-4 text-accent shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{seller.followers} followers</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
            <div className="h-14 rounded-2xl bg-secondary animate-pulse" />
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
