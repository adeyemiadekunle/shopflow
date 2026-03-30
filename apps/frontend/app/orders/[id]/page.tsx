"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin,
  Phone,
  MessageSquare,
  Copy,
  CheckCircle2,
  Shield,
  AlertCircle,
  Store
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatNaira } from "@/lib/types"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"

// Mock order data
const mockOrder = {
  id: "ORD-2024-001",
  status: "shipped",
  paymentStatus: "paid",
  createdAt: "2024-03-15T10:30:00",
  estimatedDelivery: "2024-03-18",
  trackingNumber: "GIG1234567890",
  carrier: "GIG Logistics",
  items: [
    {
      id: "item_1",
      name: "Ankara Print Dress",
      image: "https://images.unsplash.com/photo-1590400516695-36e82e20f5f5?w=200&h=200&fit=crop",
      price: 15000,
      quantity: 1,
      variant: "Size: M, Color: Blue",
    },
    {
      id: "item_2",
      name: "Beaded Necklace Set",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop",
      price: 6000,
      quantity: 1,
    },
  ],
  seller: {
    name: "Fashion Hub NG",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    phone: "08087654321",
    isVerified: true,
  },
  deliveryAddress: {
    fullName: "John Doe",
    phone: "08012345678",
    street: "25 Allen Avenue, Ikeja",
    city: "Lagos",
    state: "Lagos",
  },
  subtotal: 21000,
  deliveryFee: 2500,
  serviceFee: 525,
  total: 24025,
  timeline: [
    {
      status: "order_placed",
      title: "Order Placed",
      description: "Your order has been received",
      timestamp: "2024-03-15T10:30:00",
      completed: true,
    },
    {
      status: "payment_confirmed",
      title: "Payment Confirmed",
      description: "Payment received and held in escrow",
      timestamp: "2024-03-15T10:32:00",
      completed: true,
    },
    {
      status: "processing",
      title: "Processing",
      description: "Seller is preparing your order",
      timestamp: "2024-03-15T14:00:00",
      completed: true,
    },
    {
      status: "shipped",
      title: "Shipped",
      description: "Package handed to GIG Logistics",
      timestamp: "2024-03-16T09:15:00",
      completed: true,
    },
    {
      status: "out_for_delivery",
      title: "Out for Delivery",
      description: "Package is on its way to you",
      timestamp: null,
      completed: false,
    },
    {
      status: "delivered",
      title: "Delivered",
      description: "Package delivered successfully",
      timestamp: null,
      completed: false,
    },
  ],
}

const statusConfig = {
  pending: { label: "Pending", color: "text-yellow-500 bg-yellow-500/10" },
  processing: { label: "Processing", color: "text-blue-500 bg-blue-500/10" },
  shipped: { label: "Shipped", color: "text-purple-500 bg-purple-500/10" },
  out_for_delivery: { label: "Out for Delivery", color: "text-orange-500 bg-orange-500/10" },
  delivered: { label: "Delivered", color: "text-green-500 bg-green-500/10" },
  cancelled: { label: "Cancelled", color: "text-red-500 bg-red-500/10" },
}

export default function OrderTrackingPage() {
  const params = useParams()
  const orderId = params.id as string
  const [copied, setCopied] = useState(false)
  const [showConfirmDelivery, setShowConfirmDelivery] = useState(false)

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(mockOrder.trackingNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const currentStatus = statusConfig[mockOrder.status as keyof typeof statusConfig]

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <main className="pt-16 max-w-4xl mx-auto px-4 py-6">
        {/* Back Link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Order Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{orderId}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            </div>
            <p className="text-muted-foreground">
              Placed on {formatDate(mockOrder.createdAt)}
            </p>
          </div>
          {mockOrder.status === "delivered" && (
            <Button onClick={() => setShowConfirmDelivery(true)}>
              Confirm Delivery
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Timeline */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-6">Order Timeline</h2>
              <div className="relative">
                {mockOrder.timeline.map((event, index) => (
                  <div key={event.status} className="flex gap-4 pb-8 last:pb-0">
                    {/* Line */}
                    <div className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        event.completed 
                          ? "bg-accent text-accent-foreground" 
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {event.completed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      {index < mockOrder.timeline.length - 1 && (
                        <div className={`w-0.5 flex-1 min-h-[40px] ${
                          event.completed ? "bg-accent" : "bg-border"
                        }`} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <p className={`font-medium ${!event.completed && "text-muted-foreground"}`}>
                        {event.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      {event.timestamp && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(event.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Number */}
            {mockOrder.trackingNumber && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tracking Number</p>
                      <p className="font-mono font-medium">{mockOrder.trackingNumber}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyTrackingNumber}>
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Carrier: {mockOrder.carrier}
                </p>
              </div>
            )}

            {/* Order Items */}
            <div className="rounded-xl border border-border bg-card">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">Order Items</h2>
              </div>
              <div className="divide-y divide-border">
                {mockOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.name}</p>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">{item.variant}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">{formatNaira(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                  <p className="font-medium">{mockOrder.deliveryAddress.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {mockOrder.deliveryAddress.street}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {mockOrder.deliveryAddress.city}, {mockOrder.deliveryAddress.state}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mockOrder.deliveryAddress.phone}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-3">Sold by</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={mockOrder.seller.avatar} alt={mockOrder.seller.name} />
                  <AvatarFallback>{mockOrder.seller.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium">{mockOrder.seller.name}</p>
                    {mockOrder.seller.isVerified && (
                      <CheckCircle className="h-4 w-4 text-accent" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Verified Seller</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Store className="h-4 w-4" />
                  View Store
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatNaira(mockOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatNaira(mockOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span>{formatNaira(mockOrder.serviceFee)}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatNaira(mockOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Escrow Status */}
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Payment Protected</p>
                  <p className="text-sm text-muted-foreground">
                    Your payment of {formatNaira(mockOrder.total)} is held securely. 
                    It will be released to the seller once you confirm delivery.
                  </p>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Need Help?</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Having issues with your order?
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileNav />

      {/* Confirm Delivery Modal */}
      {showConfirmDelivery && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowConfirmDelivery(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-4">
            <div className="rounded-xl border border-border bg-card shadow-lg">
              <div className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Confirm Delivery</h2>
                <p className="text-muted-foreground mb-6">
                  By confirming, you acknowledge that you&apos;ve received your order in good condition. 
                  The payment will be released to the seller.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirmDelivery(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-green-500 hover:bg-green-600">
                    Confirm Delivery
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
