"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Search, 
  Filter, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  ShoppingCart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNaira } from "@/lib/types"

// Mock orders data
const mockOrders = [
  {
    id: "ORD-2024-001",
    customer: {
      name: "Adebayo Johnson",
      phone: "08012345678",
      address: "25 Allen Avenue, Ikeja, Lagos",
    },
    items: [
      { name: "Ankara Print Dress", quantity: 1, price: 15000, image: "https://images.unsplash.com/photo-1590400516695-36e82e20f5f5?w=100&h=100&fit=crop" },
      { name: "Beaded Necklace Set", quantity: 1, price: 6000, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop" },
    ],
    subtotal: 21000,
    deliveryFee: 2500,
    total: 23500,
    status: "pending",
    paymentStatus: "paid",
    date: "2024-03-15T10:30:00",
  },
  {
    id: "ORD-2024-002",
    customer: {
      name: "Chioma Eze",
      phone: "08098765432",
      address: "12 Trans Amadi Road, Port Harcourt, Rivers",
    },
    items: [
      { name: "Leather Crossbody Bag", quantity: 1, price: 12000, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop" },
    ],
    subtotal: 12000,
    deliveryFee: 3500,
    total: 15500,
    status: "processing",
    paymentStatus: "paid",
    date: "2024-03-14T14:20:00",
  },
  {
    id: "ORD-2024-003",
    customer: {
      name: "Mohammed Ibrahim",
      phone: "08055544433",
      address: "45 Ahmadu Bello Way, Kaduna",
    },
    items: [
      { name: "Handwoven Basket Bag", quantity: 2, price: 8500, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=100&h=100&fit=crop" },
      { name: "African Print Headwrap", quantity: 3, price: 3500, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=100&h=100&fit=crop" },
    ],
    subtotal: 27500,
    deliveryFee: 4000,
    total: 31500,
    status: "shipped",
    paymentStatus: "paid",
    date: "2024-03-13T09:15:00",
  },
  {
    id: "ORD-2024-004",
    customer: {
      name: "Ngozi Okonkwo",
      phone: "08033322211",
      address: "8 Ogui Road, Enugu",
    },
    items: [
      { name: "Ankara Print Dress", quantity: 1, price: 15000, image: "https://images.unsplash.com/photo-1590400516695-36e82e20f5f5?w=100&h=100&fit=crop" },
    ],
    subtotal: 15000,
    deliveryFee: 3000,
    total: 18000,
    status: "delivered",
    paymentStatus: "paid",
    date: "2024-03-10T16:45:00",
  },
  {
    id: "ORD-2024-005",
    customer: {
      name: "Emeka Obi",
      phone: "08077766655",
      address: "20 Awolowo Road, Ikoyi, Lagos",
    },
    items: [
      { name: "Beaded Necklace Set", quantity: 2, price: 6000, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop" },
    ],
    subtotal: 12000,
    deliveryFee: 1500,
    total: 13500,
    status: "cancelled",
    paymentStatus: "refunded",
    date: "2024-03-08T11:00:00",
  },
]

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-500 bg-yellow-500/10", action: "Accept Order" },
  processing: { label: "Processing", icon: Package, color: "text-blue-500 bg-blue-500/10", action: "Mark as Shipped" },
  shipped: { label: "Shipped", icon: Truck, color: "text-purple-500 bg-purple-500/10", action: "Track Shipment" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-500 bg-green-500/10", action: null },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-500 bg-red-500/10", action: null },
}

const tabs = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
]

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || order.status === activeTab
    return matchesSearch && matchesTab
  })

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

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage and track your orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.id !== "all" && (
              <span className="ml-1.5 text-xs">
                ({mockOrders.filter(o => o.status === tab.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by order ID or customer name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status as keyof typeof statusConfig]
            return (
              <Link
                key={order.id}
                href={`/seller/dashboard/orders/${order.id}`}
                className="block rounded-xl border border-border bg-card hover:border-accent transition-colors"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${status.color}`}>
                      <status.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(order.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <img
                          key={index}
                          src={item.image}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover border-2 border-card"
                        />
                      ))}
                      {order.items.length > 3 && (
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center border-2 border-card text-xs font-medium">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {order.items.map(i => i.name).join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.reduce((acc, i) => acc + i.quantity, 0)} item(s)
                      </p>
                    </div>
                    <p className="font-semibold">{formatNaira(order.total)}</p>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-sm font-medium">{order.customer.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {order.customer.address}
                      </p>
                    </div>
                    {status.action && (
                      <Button size="sm" variant="outline" onClick={(e) => e.preventDefault()}>
                        {status.action}
                      </Button>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-border bg-card">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No orders found</h3>
          <p className="text-sm text-muted-foreground text-center">
            {searchQuery || activeTab !== "all"
              ? "Try adjusting your search or filters"
              : "Orders will appear here when customers make purchases"
            }
          </p>
        </div>
      )}
    </div>
  )
}
