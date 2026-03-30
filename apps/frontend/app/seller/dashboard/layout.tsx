"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  Settings, 
  Bell, 
  Menu, 
  X,
  Store,
  ChevronDown,
  LogOut,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { formatNaira } from "@/lib/types"

const navItems = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/dashboard/products", label: "Products", icon: Package },
  { href: "/seller/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/seller/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/seller/dashboard/settings", label: "Settings", icon: Settings },
]

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Mock seller data for demo
  const seller = user as any || {
    displayName: "Sarah Styles",
    storeName: "Fashion Hub NG",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    kycStatus: "verified",
  }

  const pendingBalance = 125000
  const notificationCount = 3

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <Link href="/seller/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-semibold">Seller Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <button className="relative p-2 text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-accent text-[10px] font-medium flex items-center justify-center text-accent-foreground">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <Link href="/seller/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-semibold">Seller Hub</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Seller Profile Card */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={seller.avatarUrl} alt={seller.displayName} />
              <AvatarFallback>{seller.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{seller.storeName}</p>
              <p className="text-xs text-muted-foreground truncate">{seller.displayName}</p>
            </div>
            {seller.kycStatus === "verified" && (
              <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center">
                <Store className="h-3 w-3 text-accent" />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/seller/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Quick Stats */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Pending Earnings</p>
            <p className="text-lg font-semibold">{formatNaira(pendingBalance)}</p>
          </div>
          <Link href="/" className="flex items-center gap-2 mt-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Store className="h-4 w-4" />
            <span>View Storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 h-16 items-center justify-between px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div>
            <h1 className="font-semibold">
              {navItems.find(item => 
                pathname === item.href || 
                (item.href !== "/seller/dashboard" && pathname.startsWith(item.href))
              )?.label || "Dashboard"}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-accent text-[10px] font-medium flex items-center justify-center text-accent-foreground">
                  {notificationCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={seller.avatarUrl} alt={seller.displayName} />
                  <AvatarFallback>{seller.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {isProfileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-border bg-card shadow-lg">
                    <div className="p-3 border-b border-border">
                      <p className="font-medium truncate">{seller.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">{seller.storeName}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/seller/dashboard/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Profile Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout()
                          setIsProfileOpen(false)
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/seller/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 h-full px-3 transition-colors ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
