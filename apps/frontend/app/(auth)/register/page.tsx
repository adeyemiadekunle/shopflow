"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Store, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, isLoading } = useAuth()
  const phone = searchParams.get("phone") || ""

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
  })
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.displayName.trim()) {
      setError("Please enter your name")
      return
    }

    const result = await register({
      phone,
      displayName: formData.displayName,
      email: formData.email || undefined,
    })

    if (result.success) {
      router.push("/")
    } else {
      setError("Registration failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6">
        <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">Create your account</h1>
            <p className="text-muted-foreground">
              Tell us a bit about yourself
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-muted-foreground">(Optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 rounded-xl gap-2"
              disabled={isLoading || !formData.displayName.trim()}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>
                  Create Account
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
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Seller Option */}
          <Link
            href={`/seller/register?phone=${encodeURIComponent(phone)}`}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-accent transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">Want to sell on Shopflow?</p>
              <p className="text-sm text-muted-foreground">Register as a seller instead</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </Link>
        </div>
      </main>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="h-8 w-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
