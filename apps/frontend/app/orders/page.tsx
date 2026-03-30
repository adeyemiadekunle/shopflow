"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Package, ChevronRight, Search, Filter, Clock, CheckCircle2, Truck, XCircle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"

const orders = [
  {
    id: "ORD-2024-001234",
    date: "Mar 28, 2024",
    status: "in_transit",
    total: 45500,
    items: [
      {
        id: "1",
        name: "Classic White Sneakers",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&h=200&fit=crop",
        price: 35000,
        quantity: 1,
        seller: "Urban Style Co"
      }
    ],
    estimatedDelivery: "Mar 30, 2024"
  },
  {
    id: "ORD-2024-001198",
    date: "Mar 25, 2024",
    status: "delivered",
    total: 128000,
    items: [
      {
        id: "2",
        name: "Wireless Earbuds Pro",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&h=200&fit=crop",
        price: 45000,
        quantity: 1,
        seller: "TechZone"
      },
      {
        id: "3",
        name: "Smart Watch Series X",
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&h=200&fit=crop",
        price: 83000,
        quantity: 1,
        seller: "TechZone"
      }
    ],
    deliveredDate: "Mar 27, 2024"
  },
  {
    id: "ORD-2024-001156",
    date: "Mar 20, 2024",
    status: "processing",
    total: 18500,
    items: [
      {
        id: "4",
        name: "Organic Face Serum",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop",
        price: 18500,
        quantity: 1,
        seller: "Glow Beauty"
      }
    ],
    estimatedDelivery: "Apr 2, 2024"
  },
  {
    id: "ORD-2024-001089",
    date: "Mar 15, 2024",
    status: "cancelled",
    total: 67000,
    items: [
      {
        id: "5",
        name: "Designer Handbag",
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&h=200&fit=crop",
        price: 67000,
        quantity: 1,
        seller: "Luxe Accessories"
      }
    ],
    cancelledDate: "Mar 16, 2024"
  }
]

const statusConfig = {
  processing: { label: "Processing", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  in_transit: { label: "In Transit", icon: Truck, color: "text-blue-500", bg: "bg-blue-500/10" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" }
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0
  }).format(amount)
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === "all" || order.status === activeTab
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesTab && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">Track and manage your orders</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full justify-start bg-secondary/50 p-1 rounded-xl overflow-x-auto">
              <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
              <TabsTrigger value="processing" className="rounded-lg">Processing</TabsTrigger>
              <TabsTrigger value="in_transit" className="rounded-lg">In Transit</TabsTrigger>
              <TabsTrigger value="delivered" className="rounded-lg">Delivered</TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-lg">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-1">No orders found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "You haven't placed any orders yet"}
                </p>
                <Button asChild className="mt-4">
                  <Link href="/shop">Start Shopping</Link>
                </Button>
              </div>
            ) : (
              filteredOrders.map(order => {
                const status = statusConfig[order.status as keyof typeof statusConfig]
                const StatusIcon = status.icon
                
                return (
                  <Link 
                    key={order.id} 
                    href={`/orders/${order.id}`}
                    className="block bg-card rounded-2xl border border-border p-4 hover:border-accent/50 transition-colors"
                  >
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-mono text-sm font-medium">{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.date}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                        <StatusIcon className={`h-3.5 w-3.5 ${status.color}`} />
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3 mb-4">
                      {order.items.map(item => (
                        <div key={item.id} className="flex gap-3">
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">by {item.seller}</p>
                            <p className="text-sm font-medium mt-1">{formatPrice(item.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {order.status === "delivered" && `Delivered on ${order.deliveredDate}`}
                          {order.status === "cancelled" && `Cancelled on ${order.cancelledDate}`}
                          {(order.status === "processing" || order.status === "in_transit") && 
                            `Est. delivery: ${order.estimatedDelivery}`}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <ShieldCheck className="h-3 w-3 text-green-500" />
                          <span>Protected by Escrow</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatPrice(order.total)}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
