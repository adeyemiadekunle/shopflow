"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Store, User, MapPin, CreditCard, FileCheck, Check } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { NIGERIAN_STATES, NIGERIAN_BANKS } from "@/lib/types"

const STEPS = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Store Details", icon: Store },
  { id: 3, title: "Business Address", icon: MapPin },
  { id: 4, title: "Bank Details", icon: CreditCard },
  { id: 5, title: "Verification", icon: FileCheck },
]

function SellerRegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { registerSeller, isLoading } = useAuth()
  const phone = searchParams.get("phone") || ""

  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    // Personal
    displayName: "",
    email: "",
    // Store
    storeName: "",
    storeDescription: "",
    // Address
    street: "",
    city: "",
    state: "",
    lga: "",
    // Bank
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
    // KYC
    idType: "" as "nin" | "drivers_license" | "voters_card" | "passport" | "",
    idNumber: "",
    agreedToTerms: false,
  })

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.displayName.trim()) {
          setError("Please enter your full name")
          return false
        }
        break
      case 2:
        if (!formData.storeName.trim()) {
          setError("Please enter your store name")
          return false
        }
        break
      case 3:
        if (!formData.street || !formData.city || !formData.state) {
          setError("Please fill in all required address fields")
          return false
        }
        break
      case 4:
        if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
          setError("Please fill in all bank details")
          return false
        }
        if (formData.accountNumber.length !== 10) {
          setError("Account number must be 10 digits")
          return false
        }
        break
      case 5:
        if (!formData.idType || !formData.idNumber) {
          setError("Please fill in your ID details")
          return false
        }
        if (!formData.agreedToTerms) {
          setError("Please agree to the terms and conditions")
          return false
        }
        break
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError("")
    }
  }

  const handleSubmit = async () => {
    const result = await registerSeller({
      phone,
      displayName: formData.displayName,
      email: formData.email || undefined,
      storeName: formData.storeName,
      storeDescription: formData.storeDescription || undefined,
      businessAddress: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        lga: formData.lga,
      },
      idType: formData.idType as "nin" | "drivers_license" | "voters_card" | "passport",
      idNumber: formData.idNumber,
      bankName: formData.bankName,
      bankCode: formData.bankCode,
      accountNumber: formData.accountNumber,
      accountName: formData.accountName,
    })

    if (result.success) {
      router.push("/seller/onboarding-success")
    } else {
      setError("Registration failed. Please try again.")
    }
  }

  const handleBankSelect = (bankName: string) => {
    const bank = NIGERIAN_BANKS.find(b => b.name === bankName)
    if (bank) {
      updateField("bankName", bank.name)
      updateField("bankCode", bank.code)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="relative flex items-center justify-between border-b border-border p-4 md:p-6">
        <button 
          onClick={currentStep === 1 ? () => router.back() : handleBack}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <BrandLogo className="absolute left-1/2 -translate-x-1/2" />
        <div className="w-16" aria-hidden="true" />
      </header>

      {/* Progress Steps */}
      <div className="px-4 py-6 border-b border-border overflow-x-auto">
        <div className="flex items-center justify-center gap-2 min-w-max mx-auto">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                  currentStep > step.id 
                    ? "bg-accent text-accent-foreground"
                    : currentStep === step.id 
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                }`}>
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs mt-1 hidden md:block ${
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-8 md:w-12 h-0.5 mx-2 ${
                  currentStep > step.id ? "bg-accent" : "bg-border"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Personal Information</h2>
                <p className="text-sm text-muted-foreground">Tell us about yourself</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => updateField("displayName", e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="your@email.com"
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Store Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Store Details</h2>
                <p className="text-sm text-muted-foreground">Set up your online store</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Name *</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => updateField("storeName", e.target.value)}
                    placeholder="e.g., Fashion Hub NG"
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be your store&apos;s public name
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Description (Optional)</label>
                  <textarea
                    value={formData.storeDescription}
                    onChange={(e) => updateField("storeDescription", e.target.value)}
                    placeholder="Tell buyers what makes your store special..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Business Address */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Business Address</h2>
                <p className="text-sm text-muted-foreground">Where is your business located?</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Street Address *</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => updateField("street", e.target.value)}
                    placeholder="e.g., 25 Fashion Street"
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State *</label>
                    <select
                      value={formData.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    >
                      <option value="">Select State</option>
                      {NIGERIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="e.g., Lekki"
                      className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LGA (Optional)</label>
                  <input
                    type="text"
                    value={formData.lga}
                    onChange={(e) => updateField("lga", e.target.value)}
                    placeholder="Local Government Area"
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Bank Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Bank Details</h2>
                <p className="text-sm text-muted-foreground">Where should we send your earnings?</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bank Name *</label>
                  <select
                    value={formData.bankName}
                    onChange={(e) => handleBankSelect(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    <option value="">Select Bank</option>
                    {NIGERIAN_BANKS.map(bank => (
                      <option key={bank.code} value={bank.name}>{bank.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Number *</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => updateField("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit account number"
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Name *</label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) => updateField("accountName", e.target.value)}
                    placeholder="Name on account"
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    This should match the name registered with your bank
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Verification */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Identity Verification</h2>
                <p className="text-sm text-muted-foreground">Help us verify your identity</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID Type *</label>
                  <select
                    value={formData.idType}
                    onChange={(e) => updateField("idType", e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    <option value="">Select ID Type</option>
                    <option value="nin">National ID (NIN)</option>
                    <option value="drivers_license">Driver&apos;s License</option>
                    <option value="voters_card">Voter&apos;s Card</option>
                    <option value="passport">International Passport</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID Number *</label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => updateField("idNumber", e.target.value)}
                    placeholder="Enter your ID number"
                    className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Terms */}
                <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={(e) => updateField("agreedToTerms", e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-ring"
                    />
                    <span className="text-sm">
                      I agree to Shopflow&apos;s{" "}
                      <Link href="/terms" className="text-accent hover:underline">Seller Terms</Link>,{" "}
                      <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>, and{" "}
                      <Link href="/fees" className="text-accent hover:underline">Fee Structure</Link>
                    </span>
                  </label>
                </div>

                {/* Info Box */}
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <p className="text-sm">
                    <strong>What happens next?</strong><br />
                    Your application will be reviewed within 24-48 hours. 
                    You&apos;ll receive a notification once approved to start selling.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="sticky bottom-0 p-4 bg-background border-t border-border">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full h-12 rounded-xl gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : currentStep === 5 ? (
              <>
                Submit Application
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default function SellerRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="h-8 w-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SellerRegisterContent />
    </Suspense>
  )
}
