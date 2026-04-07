"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Phone, ArrowRight, Store, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/brand-logo"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")

  const formatPhoneInput = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")
    // Limit to 11 digits for Nigerian numbers
    return digits.slice(0, 11)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (phone.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    const result = await login(phone)
    
    if (result.success) {
      // Store phone for OTP verification
      sessionStorage.setItem("auth_phone", phone)
      router.push("/verify")
    } else {
      setError(result.message || "Failed to send OTP")
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6">
        <BrandLogo />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-balance">Welcome to Shopflow</h1>
            <p className="text-muted-foreground">
              Enter your phone number to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">+234</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                  placeholder="801 234 5678"
                  className="w-full h-12 pl-20 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                We&apos;ll send you a one-time verification code
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 rounded-xl gap-2"
              disabled={isLoading || phone.length < 10}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending OTP...
                </span>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or continue as</span>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/"
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-accent transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Guest</p>
                <p className="text-xs text-muted-foreground">Browse & Shop</p>
              </div>
            </Link>
            <Link
              href="/seller/register"
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-accent transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-accent" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Become a Seller</p>
                <p className="text-xs text-muted-foreground">Start selling</p>
              </div>
            </Link>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-foreground hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-foreground hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </main>

      {/* Demo Hint */}
      <footer className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Demo: Use OTP <span className="font-mono bg-secondary px-1.5 py-0.5 rounded">123456</span> for any phone number
        </p>
      </footer>
    </div>
  )
}
