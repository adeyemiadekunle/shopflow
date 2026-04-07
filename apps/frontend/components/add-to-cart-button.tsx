"use client"

import { useState } from "react"
import { ShoppingBag, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AddToCartButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "children" | "onClick"> {
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
  size,
  onClick,
  ...props
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    // In a real app, trigger cart context/mutation here.
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
    onClick?.(e)
  }

  return (
    <Button
      type="button"
      onClick={handleAddToCart}
      size={size ?? (showText ? "pill" : "icon")}
      className={cn(
        "z-10 shadow-lg transition-all",
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
    </Button>
  )
}
