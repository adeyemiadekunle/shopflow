"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  MapPin, 
  Truck, 
  CreditCard, 
  Shield, 
  Check,
  Plus,
  ChevronRight,
  Clock,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { formatNaira, NIGERIAN_STATES } from "@/lib/types"

type CheckoutStep = "address" | "delivery" | "payment" | "review"

// Mock addresses
const mockAddresses = [
  {
    id: "addr_1",
    label: "Home",
    fullName: "John Doe",
    phone: "08012345678",
    street: "25 Allen Avenue, Ikeja",
    city: "Lagos",
    state: "Lagos",
    lga: "Ikeja",
    isDefault: true,
  },
  {
    id: "addr_2",
    label: "Office",
    fullName: "John Doe",
    phone: "08012345678",
    street: "12 Admiralty Way, Lekki Phase 1",
    city: "Lagos",
    state: "Lagos",
    lga: "Lekki",
    isDefault: false,
  },
]

// Mock delivery options
const mockDeliveryOptions = [
  {
    id: "standard",
    name: "Standard Delivery",
    carrier: "GIG Logistics",
    estimatedDays: "3-5 business days",
    price: 2500,
  },
  {
    id: "express",
    name: "Express Delivery",
    carrier: "DHL",
    estimatedDays: "1-2 business days",
    price: 5000,
  },
  {
    id: "economy",
    name: "Economy Delivery",
    carrier: "Fez Delivery",
    estimatedDays: "5-7 business days",
    price: 1500,
  },
]

const steps: { id: CheckoutStep; label: string; icon: typeof MapPin }[] = [
  { id: "address", label: "Address", icon: MapPin },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "review", label: "Review", icon: Check },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const { isAuthenticated } = useAuth()
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("address")
  const [selectedAddress, setSelectedAddress] = useState(mockAddresses[0])
  const [selectedDelivery, setSelectedDelivery] = useState(mockDeliveryOptions[0])
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [deliveryQuote, setDeliveryQuote] = useState<typeof mockDeliveryOptions | null>(null)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const [newAddress, setNewAddress] = useState({
    label: "",
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    lga: "",
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && items.length > 0) {
      // For demo, we'll allow guest checkout
    }
  }, [isAuthenticated, items.length])

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart")
    }
  }, [items.length, router])

  const serviceFee = Math.round(totalPrice * 0.025) // 2.5% service fee
  const grandTotal = totalPrice + (deliveryQuote ? selectedDelivery.price : 0) + serviceFee

  const handleGetDeliveryQuote = async () => {
    setIsLoadingQuote(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setDeliveryQuote(mockDeliveryOptions)
    setIsLoadingQuote(false)
    setCurrentStep("delivery")
  }

  const handlePlaceOrder = async () => {
    setIsProcessing(true)
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate order ID
    const orderId = `ORD-${Date.now()}`
    
    // Clear cart and redirect to success
    clearCart()
    router.push(`/checkout/success?orderId=${orderId}`)
  }

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/cart" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold">Checkout</h1>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                    currentStepIndex > index 
                      ? "bg-accent text-accent-foreground"
                      : currentStepIndex === index 
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                  }`}>
                    {currentStepIndex > index ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${
                    currentStepIndex >= index ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-2 ${
                    currentStepIndex > index ? "bg-accent" : "bg-border"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Address Selection */}
            {currentStep === "address" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Delivery Address</h2>
                
                <div className="space-y-3">
                  {mockAddresses.map((address) => (
                    <button
                      key={address.id}
                      onClick={() => setSelectedAddress(address)}
                      className={`w-full p-4 rounded-xl border text-left transition-colors ${
                        selectedAddress.id === address.id
                          ? "border-accent bg-accent/5"
                          : "border-border bg-card hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{address.label}</p>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-secondary">Default</span>
                            )}
                          </div>
                          <p className="text-sm mt-1">{address.fullName}</p>
                          <p className="text-sm text-muted-foreground">{address.phone}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {address.street}, {address.city}, {address.state}
                          </p>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          selectedAddress.id === address.id 
                            ? "border-accent" 
                            : "border-muted-foreground"
                        }`}>
                          {selectedAddress.id === address.id && (
                            <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddAddress(true)}
                  className="w-full p-4 rounded-xl border border-dashed border-border hover:border-accent transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-5 w-5" />
                  Add New Address
                </button>

                <Button 
                  className="w-full h-12"
                  onClick={handleGetDeliveryQuote}
                  disabled={isLoadingQuote}
                >
                  {isLoadingQuote ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Getting delivery quote...
                    </span>
                  ) : (
                    <>
                      Get Delivery Quote
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: Delivery Selection */}
            {currentStep === "delivery" && deliveryQuote && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Delivery Options</h2>
                  <p className="text-sm text-muted-foreground">
                    Delivering to: {selectedAddress.street}, {selectedAddress.city}
                  </p>
                </div>

                <div className="space-y-3">
                  {deliveryQuote.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedDelivery(option)}
                      className={`w-full p-4 rounded-xl border text-left transition-colors ${
                        selectedDelivery.id === option.id
                          ? "border-accent bg-accent/5"
                          : "border-border bg-card hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            <Truck className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{option.name}</p>
                            <p className="text-sm text-muted-foreground">{option.carrier}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <Clock className="h-3.5 w-3.5" />
                              {option.estimatedDays}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatNaira(option.price)}</p>
                          <div className={`mt-2 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            selectedDelivery.id === option.id 
                              ? "border-accent" 
                              : "border-muted-foreground"
                          }`}>
                            {selectedDelivery.id === option.id && (
                              <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setCurrentStep("address")}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1 h-12"
                    onClick={() => setCurrentStep("payment")}
                  >
                    Continue to Payment
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === "payment" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Payment Method</h2>

                {/* Escrow Notice */}
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-3">
                  <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Protected by Escrow</p>
                    <p className="text-sm text-muted-foreground">
                      Your payment is held securely until you confirm delivery. 
                      If there&apos;s any issue, you can request a refund.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full p-4 rounded-xl border border-accent bg-accent/5 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#0BA4DB]/10 flex items-center justify-center">
                          <span className="font-bold text-[#0BA4DB]">P</span>
                        </div>
                        <div>
                          <p className="font-medium">Pay with Paystack</p>
                          <p className="text-sm text-muted-foreground">Card, Bank Transfer, USSD</p>
                        </div>
                      </div>
                      <div className="h-5 w-5 rounded-full border-2 border-accent flex items-center justify-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setCurrentStep("delivery")}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1 h-12"
                    onClick={() => setCurrentStep("review")}
                  >
                    Review Order
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === "review" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Review Your Order</h2>

                {/* Delivery Address */}
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Delivery Address</p>
                    <button 
                      onClick={() => setCurrentStep("address")}
                      className="text-sm text-accent hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="font-medium">{selectedAddress.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedAddress.phone}</p>
                </div>

                {/* Delivery Method */}
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Delivery Method</p>
                    <button 
                      onClick={() => setCurrentStep("delivery")}
                      className="text-sm text-accent hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="font-medium">{selectedDelivery.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDelivery.carrier} • {selectedDelivery.estimatedDays}
                  </p>
                </div>

                {/* Order Items */}
                <div className="rounded-xl border border-border bg-card">
                  <div className="p-4 border-b border-border">
                    <p className="font-medium">Order Items ({items.length})</p>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-4">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">{formatNaira(item.product.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setCurrentStep("payment")}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1 h-12"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <>Pay {formatNaira(grandTotal)}</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Order Summary</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">{formatNaira(item.product.price * item.quantity)}</p>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-sm text-muted-foreground">+{items.length - 3} more items</p>
                  )}
                </div>

                <div className="h-px bg-border" />

                {/* Costs */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatNaira(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>{deliveryQuote ? formatNaira(selectedDelivery.price) : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Fee (2.5%)</span>
                    <span>{formatNaira(serviceFee)}</span>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatNaira(grandTotal)}</span>
                </div>

                {/* Trust Badge */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 text-sm">
                  <Shield className="h-4 w-4 text-accent" />
                  <span>Buyer Protection Guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Address Modal */}
      {showAddAddress && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAddAddress(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto p-4">
            <div className="rounded-xl border border-border bg-card shadow-lg">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold">Add New Address</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Label</label>
                    <input
                      type="text"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      placeholder="e.g., Home, Office"
                      className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <input
                      type="text"
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <input
                      type="tel"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Street Address</label>
                    <input
                      type="text"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State</label>
                    <select
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    >
                      <option value="">Select</option>
                      {NIGERIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddAddress(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1">
                    Save Address
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
