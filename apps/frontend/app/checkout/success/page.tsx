"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, Package, ArrowRight, Copy, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId") || "ORD-000000"
  const [copied, setCopied] = useState(false)

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 flex items-center justify-center border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-sm">S</span>
          </div>
          <span className="font-semibold">Shopflow</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Success Animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">Order Placed Successfully!</h1>
            <p className="text-muted-foreground">
              Thank you for your order. We&apos;ve sent a confirmation to your phone.
            </p>
          </div>

          {/* Order ID */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground mb-1">Order Number</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg font-mono font-semibold">{orderId}</p>
              <button
                onClick={copyOrderId}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* What's Next */}
          <div className="space-y-4 text-left">
            <h2 className="font-semibold text-center">What happens next?</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-accent">1</span>
                </div>
                <div>
                  <p className="font-medium">Order Confirmation</p>
                  <p className="text-sm text-muted-foreground">Seller will confirm and prepare your order</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold">2</span>
                </div>
                <div>
                  <p className="font-medium">Shipping Updates</p>
                  <p className="text-sm text-muted-foreground">Track your package in real-time</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold">3</span>
                </div>
                <div>
                  <p className="font-medium">Delivery & Confirmation</p>
                  <p className="text-sm text-muted-foreground">Confirm receipt to release payment to seller</p>
                </div>
              </div>
            </div>
          </div>

          {/* Escrow Notice */}
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-3 text-left">
            <Package className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Your payment is protected</p>
              <p className="text-sm text-muted-foreground">
                Funds are held in escrow until you confirm delivery
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Link href={`/orders/${orderId}`}>
              <Button size="lg" className="w-full h-12 rounded-xl gap-2">
                Track Your Order
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="w-full h-12 rounded-xl">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="h-8 w-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
