"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, Minus, Plus, X, ChevronRight, Tag, Truck, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { useCart } from "@/lib/cart-context"

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart()

  const shipping = subtotal > 100 ? 0 : 9.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center mb-6">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Your cart is empty</h1>
              <p className="text-muted-foreground mt-2 mb-6">
                Looks like you haven&apos;t added anything to your cart yet.
              </p>
              <Link href="/shop">
                <Button size="lg" className="gap-2">
                  Start Shopping
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Shopping Cart</h1>
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground">
              Clear all
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                  className="flex gap-4 p-4 bg-card rounded-xl border border-border"
                >
                  {/* Image */}
                  <Link href={`/product/${item.product.id}`}>
                    <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-lg overflow-hidden shrink-0 bg-secondary">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                        <Link href={`/product/${item.product.id}`}>
                          <h3 className="font-medium hover:text-accent transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        {(item.selectedColor || item.selectedSize) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.selectedColor && `Color: ${item.selectedColor}`}
                            {item.selectedColor && item.selectedSize && " / "}
                            {item.selectedSize && `Size: ${item.selectedSize}`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity */}
                      <div className="flex items-center border border-border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-secondary transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-secondary transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">
                            ${item.product.price} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Continue Shopping */}
              <Link href="/shop" className="block">
                <Button variant="outline" className="w-full gap-2">
                  Continue Shopping
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                {/* Promo Code */}
                <div className="flex gap-2 mb-6">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Promo code" className="pl-10" />
                  </div>
                  <Button variant="secondary">Apply</Button>
                </div>

                <Separator className="mb-4" />

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between mb-6">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold text-lg">${total.toFixed(2)}</span>
                </div>

                {/* Free Shipping Banner */}
                {shipping > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 mb-4">
                    <Truck className="h-5 w-5 text-accent shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Add ${(100 - subtotal).toFixed(2)} more for free shipping!
                    </p>
                  </div>
                )}

                <Button size="lg" className="w-full">
                  Proceed to Checkout
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Secure checkout powered by Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
