"use client"

import Link from "next/link"
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Wallet, 
  Eye,
  ArrowRight,
  Clock,
  CheckCircle,
  Truck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNaira } from "@/lib/types"

// Mock dashboard data
const stats = [
  {
    label: "Total Sales",
    value: formatNaira(2450000),
    change: "+12.5%",
    trend: "up",
    icon: Wallet,
  },
  {
    label: "Total Orders",
    value: "156",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
  },
  {
    label: "Active Products",
    value: "24",
    change: "+2",
    trend: "up",
    icon: Package,
  },
  {
    label: "Store Views",
    value: "2,847",
    change: "-3.1%",
    trend: "down",
    icon: Eye,
  },
]

const recentOrders = [
  {
    id: "ORD-2024-001",
    customer: "Adebayo Johnson",
    amount: 45000,
    status: "processing",
    items: 2,
    date: "2 hours ago",
  },
  {
    id: "ORD-2024-002",
    customer: "Chioma Eze",
    amount: 28500,
    status: "shipped",
    items: 1,
    date: "5 hours ago",
  },
  {
    id: "ORD-2024-003",
    customer: "Mohammed Ibrahim",
    amount: 72000,
    status: "delivered",
    items: 3,
    date: "1 day ago",
  },
  {
    id: "ORD-2024-004",
    customer: "Ngozi Okonkwo",
    amount: 15000,
    status: "pending",
    items: 1,
    date: "1 day ago",
  },
]

const topProducts = [
  {
    id: 1,
    name: "Ankara Print Dress",
    image: "https://images.unsplash.com/photo-1590400516695-36e82e20f5f5?w=100&h=100&fit=crop",
    sales: 45,
    revenue: 675000,
  },
  {
    id: 2,
    name: "Leather Crossbody Bag",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop",
    sales: 38,
    revenue: 456000,
  },
  {
    id: 3,
    name: "Beaded Necklace Set",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
    sales: 32,
    revenue: 192000,
  },
]

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-500 bg-yellow-500/10" },
  processing: { label: "Processing", icon: Package, color: "text-blue-500 bg-blue-500/10" },
  shipped: { label: "Shipped", icon: Truck, color: "text-purple-500 bg-purple-500/10" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
}

export default function SellerDashboardPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, Sarah!</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your store today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/seller/dashboard/products/new">
            <Button variant="outline" className="gap-2">
              <Package className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4 md:p-6 rounded-xl border border-border bg-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className={`text-xs font-medium flex items-center gap-1 ${
                stat.trend === "up" ? "text-green-500" : "text-red-500"
              }`}>
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link href="/seller/dashboard/orders" className="text-sm text-accent hover:underline flex items-center gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig]
              return (
                <Link
                  key={order.id}
                  href={`/seller/dashboard/orders/${order.id}`}
                  className="flex items-center gap-4 p-4 md:px-6 hover:bg-secondary/50 transition-colors"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${status.color}`}>
                    <status.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{order.customer}</p>
                      <p className="font-semibold shrink-0">{formatNaira(order.amount)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        {order.id} • {order.items} item{order.items > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground shrink-0">{order.date}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
            <h2 className="font-semibold">Top Products</h2>
            <Link href="/seller/dashboard/products" className="text-sm text-accent hover:underline flex items-center gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {topProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-4 md:px-6"
              >
                <span className="text-sm font-medium text-muted-foreground w-4">
                  {index + 1}
                </span>
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.sales} sold • {formatNaira(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/seller/dashboard/products/new"
          className="p-4 rounded-xl border border-border bg-card hover:border-accent transition-colors text-center"
        >
          <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Add Product</p>
        </Link>
        <Link
          href="/seller/dashboard/orders"
          className="p-4 rounded-xl border border-border bg-card hover:border-accent transition-colors text-center"
        >
          <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Manage Orders</p>
        </Link>
        <Link
          href="/seller/dashboard/wallet"
          className="p-4 rounded-xl border border-border bg-card hover:border-accent transition-colors text-center"
        >
          <Wallet className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Withdraw Funds</p>
        </Link>
        <Link
          href="/seller/dashboard/settings"
          className="p-4 rounded-xl border border-border bg-card hover:border-accent transition-colors text-center"
        >
          <Eye className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Store Settings</p>
        </Link>
      </div>
    </div>
  )
}
