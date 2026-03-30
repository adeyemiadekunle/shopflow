"use client"

import { useState } from "react"
import Image from "next/image"
import { TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TrendingProductCard, type TrendingProduct } from "@/components/trending-product-card"

const trendingProducts: TrendingProduct[] = [
  {
    id: 1,
    name: "Minimalist Watch",
    brand: "Nordgreen",
    price: 229,
    originalPrice: 299,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 1243,
    seller: "@alexstyle",
  },
  {
    id: 2,
    name: "Wireless Earbuds Pro",
    brand: "SoundCore",
    price: 79,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
    rating: 4.7,
    reviews: 892,
    seller: "@techguru",
  },
  {
    id: 3,
    name: "Canvas Sneakers",
    brand: "Veja",
    price: 145,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    rating: 4.8,
    reviews: 2156,
    seller: "@fashionmike",
  },
  {
    id: 4,
    name: "Leather Crossbody",
    brand: "Madewell",
    price: 168,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    rating: 4.6,
    reviews: 567,
    seller: "@stylewithsara",
  },
  {
    id: 5,
    name: "Ceramic Vase Set",
    brand: "West Elm",
    price: 89,
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 234,
    seller: "@homevibes",
  },
  {
    id: 6,
    name: "Sunglasses Classic",
    brand: "Ray-Ban",
    price: 161,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
    rating: 4.8,
    reviews: 3421,
    seller: "@summerready",
  },
]

export function TrendingProductGrid() {
  const [likedProducts, setLikedProducts] = useState<number[]>([])

  const toggleLike = (productId: number) => {
    setLikedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  return (
    <section className="px-4 md:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">Trending Now</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          See all
        </Button>
      </div>

      {/* Horizontal scrolling on mobile, grid on larger screens */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-3 md:overflow-x-visible">
        {trendingProducts.slice(0, 5).map((product) => (
          <TrendingProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
