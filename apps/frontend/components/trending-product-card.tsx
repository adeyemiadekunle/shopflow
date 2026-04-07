"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, Star } from "lucide-react"
import { AddToCartButton } from "@/components/add-to-cart-button"

export interface TrendingProduct {
  id: number | string
  name: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  seller: string
}

interface TrendingProductCardProps {
  product: TrendingProduct
}

export function TrendingProductCard({ product }: TrendingProductCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-accent/50">
      {/* Image Frame */}
      <div className="relative aspect-[4/3.45] overflow-hidden sm:aspect-[4/5]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Like Toggle */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setIsLiked(!isLiked)
          }}
          className="absolute top-2.5 right-2.5 h-9 w-9 z-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isLiked ? "fill-red-500 text-red-500" : "text-foreground"
            }`}
          />
        </button>

        {/* Sale Badge */}
        {product.originalPrice && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium z-10">
            Sale
          </div>
        )}

        {/* Action Button - Reusable */}
        <AddToCartButton 
          productId={product.id} 
          className="absolute bottom-3 right-6 left-6 h-9 md:opacity-0 md:group-hover:opacity-100" 
        />
      </div>

      {/* Product Details Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-[11px] font-semibold">{product.rating}</span>
            <span className="text-[10px] text-muted-foreground">({product.reviews})</span>
          </div>
        </div>
        <h3 className="text-sm font-medium mt-1 truncate" title={product.name}>
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-md font-bold text-foreground">${product.price}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>

        <div className="mt-auto pt-1 border-t border-border/30">
          <p className="text-xs text-accent font-medium truncate" title={`Sold by ${product.seller}`}>
            Sold by {product.seller}
          </p>
        </div>
      </div>
    </div>
  )
}
