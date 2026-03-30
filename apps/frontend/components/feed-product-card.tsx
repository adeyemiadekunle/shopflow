"use client"

import { AddToCartButton } from "@/components/add-to-cart-button"

export interface FeedProduct {
  id: number | string
  name: string
  price: number
}

interface FeedProductCardProps {
  product: FeedProduct
}

export function FeedProductCard({ product }: FeedProductCardProps) {
  if (!product) return null

  return (
    <>
      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-xs font-medium shadow-sm z-10 border border-border/50">
        {product.name}
      </div>

      <AddToCartButton 
        productId={product.id}
        className="absolute bottom-4 right-4 h-9 px-4 md:opacity-0 hover:scale-105 group-hover/feed-media:opacity-100"
      />
    </>
  )
}
