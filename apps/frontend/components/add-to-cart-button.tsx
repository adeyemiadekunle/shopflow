"use client"

import { useState } from "react"
import { ShoppingBag, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddToCartButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  productId: number | string
  className?: string
  showText?: boolean
  label?: string
}

export function AddToCartButton({
  productId,
  className,
  showText = true,
  label = "Add to Cart",
  ...props
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    // In a real app, trigger cart context/mutation here.
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <button
      onClick={handleAddToCart}
      className={cn(
        "rounded-full text-xs font-medium flex items-center justify-center gap-1.5 shadow-lg transition-all z-10",
        isAdded
          ? "bg-green-600 text-white cursor-default scale-100"
          : "bg-primary text-primary-foreground hover:scale-105",
        className
      )}
      {...props}
    >
      {isAdded ? (
        <Check className="h-3.5 w-3.5 animate-in zoom-in" />
      ) : (
        <ShoppingBag className="h-3.5 w-3.5" />
      )}
      {showText && <span>{isAdded ? "Added" : label}</span>}
    </button>
  )
}
