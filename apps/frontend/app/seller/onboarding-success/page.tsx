"use client"

import Link from "next/link"
import { Check, Clock, Bell, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OnboardingSuccessPage() {
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
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-accent/20 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center">
                  <Check className="h-8 w-8 text-accent-foreground" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background border-4 border-background">
                <div className="h-full w-full rounded-full bg-secondary flex items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold">Application Submitted!</h1>
            <p className="text-muted-foreground">
              Your seller application is now under review. We&apos;ll verify your details and get back to you within 24-48 hours.
            </p>
          </div>

          {/* What's Next */}
          <div className="space-y-4">
            <h2 className="font-semibold">What happens next?</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-accent">1</span>
                </div>
                <div>
                  <p className="font-medium">Identity Verification</p>
                  <p className="text-sm text-muted-foreground">We&apos;ll verify your ID documents</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold">2</span>
                </div>
                <div>
                  <p className="font-medium">Bank Verification</p>
                  <p className="text-sm text-muted-foreground">Confirming your bank account details</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold">3</span>
                </div>
                <div>
                  <p className="font-medium">Approval Notification</p>
                  <p className="text-sm text-muted-foreground">You&apos;ll receive an SMS when approved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Prompt */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-left">
              We&apos;ll notify you via SMS when your store is approved
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Link href="/">
              <Button size="lg" className="w-full h-12 rounded-xl gap-2">
                Explore Shopflow
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/seller/dashboard">
              <Button variant="outline" size="lg" className="w-full h-12 rounded-xl">
                Go to Seller Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
