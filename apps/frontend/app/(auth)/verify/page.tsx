"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { formatPhone } from "@/lib/types"

export default function VerifyPage() {
  const router = useRouter()
  const { verifyOtp, login, isLoading } = useAuth()
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Get phone from session storage
    const storedPhone = sessionStorage.getItem("auth_phone")
    if (!storedPhone) {
      router.push("/login")
      return
    }
    setPhone(storedPhone)
  }, [router])

  useEffect(() => {
    // Countdown timer
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits entered
    if (value && index === 5) {
      const fullOtp = newOtp.join("")
      if (fullOtp.length === 6) {
        handleVerify(fullOtp)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pastedData) {
      const newOtp = pastedData.split("").concat(Array(6 - pastedData.length).fill(""))
      setOtp(newOtp)
      if (pastedData.length === 6) {
        handleVerify(pastedData)
      } else {
        inputRefs.current[pastedData.length]?.focus()
      }
    }
  }

  const handleVerify = async (otpCode: string) => {
    const result = await verifyOtp(phone, otpCode)
    
    if (result.success) {
      sessionStorage.removeItem("auth_phone")
      
      if (result.isNewUser) {
        // Redirect to registration with phone
        router.push(`/register?phone=${encodeURIComponent(phone)}`)
      } else if (result.user?.role === "seller") {
        router.push("/seller/dashboard")
      } else {
        router.push("/")
      }
    } else {
      setError("Invalid OTP. Please try again.")
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    
    setCanResend(false)
    setResendTimer(60)
    setError("")
    setOtp(["", "", "", "", "", ""])
    
    await login(phone)
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
            <h1 className="text-2xl md:text-3xl font-bold">Verify your number</h1>
            <p className="text-muted-foreground">
              Enter the 6-digit code sent to{" "}
              <span className="text-foreground font-medium">{formatPhone(phone)}</span>
            </p>
          </div>

          {/* OTP Input */}
          <div className="space-y-6">
            <div className="flex justify-center gap-2 md:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-11 h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-semibold rounded-xl bg-secondary border-2 transition-colors focus:outline-none focus:border-accent ${
                    error ? "border-destructive" : "border-border"
                  }`}
                  disabled={isLoading}
                />
              ))}
            </div>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}

            {isLoading && (
              <div className="flex justify-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              </div>
            )}
          </div>

          {/* Resend */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the code?
            </p>
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={!canResend || isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${!canResend ? "" : ""}`} />
              {canResend ? "Resend Code" : `Resend in ${resendTimer}s`}
            </Button>
          </div>
        </div>
      </main>

      {/* Demo Hint */}
      <footer className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Demo OTP: <span className="font-mono bg-secondary px-1.5 py-0.5 rounded">123456</span>
        </p>
      </footer>
    </div>
  )
}
