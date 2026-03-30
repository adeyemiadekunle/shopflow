"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  User, Package, Heart, MapPin, CreditCard, Bell, Shield, 
  HelpCircle, LogOut, ChevronRight, Store, Settings, Star,
  BadgeCheck, Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { useAuth } from "@/lib/auth-context"

const menuItems = [
  {
    section: "Shopping",
    items: [
      { icon: Package, label: "My Orders", href: "/orders", badge: "2" },
      { icon: Heart, label: "Wishlist", href: "/wishlist", badge: "12" },
      { icon: Star, label: "Reviews", href: "/reviews" },
    ]
  },
  {
    section: "Account",
    items: [
      { icon: User, label: "Personal Info", href: "/account/profile" },
      { icon: MapPin, label: "Saved Addresses", href: "/account/addresses" },
      { icon: CreditCard, label: "Payment Methods", href: "/account/payments" },
    ]
  },
  {
    section: "Seller",
    items: [
      { icon: Store, label: "Seller Dashboard", href: "/seller/dashboard" },
      { icon: Settings, label: "Store Settings", href: "/seller/dashboard/settings" },
    ]
  },
  {
    section: "Settings",
    items: [
      { icon: Bell, label: "Notifications", href: "/account/notifications" },
      { icon: Shield, label: "Privacy & Security", href: "/account/security" },
      { icon: HelpCircle, label: "Help Center", href: "/help" },
    ]
  }
]

export default function AccountPage() {
  const { user, logout, isAuthenticated } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 pb-20 md:pb-8">
          <div className="max-w-md mx-auto px-4 py-12 text-center">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to your account</h1>
            <p className="text-muted-foreground mb-6">
              Access your orders, wishlist, and seller dashboard
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
          {/* Profile Header */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-xl">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{user?.name || "User"}</h1>
                  {user?.isSeller && (
                    <BadgeCheck className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{user?.phone}</p>
                {user?.isSeller && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                    <Store className="h-3 w-3" />
                    Verified Seller
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold">8</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold">24</p>
              <p className="text-xs text-muted-foreground">Wishlist</p>
            </div>
          </div>

          {/* Menu Sections */}
          <div className="space-y-6">
            {menuItems.map((section) => (
              <div key={section.section}>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                  {section.section}
                </h2>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  {section.items.map((item, index) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors ${
                        index !== section.items.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                          <item.icon className="h-5 w-5 text-foreground" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Push Notifications Toggle */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get updates on orders and deals
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </div>

            {/* Become a Seller CTA */}
            {!user?.isSeller && (
              <div className="bg-gradient-to-r from-accent/20 to-accent/5 rounded-2xl border border-accent/20 p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Store className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Start Selling on Shopflow</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Reach millions of buyers and grow your business with our trusted platform.
                    </p>
                    <Button asChild size="sm">
                      <Link href="/seller/register">Become a Seller</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border hover:bg-secondary/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-500" />
              </div>
              <span className="font-medium text-red-500">Log Out</span>
            </button>
          </div>

          {/* App Version */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            Shopflow v1.0.0
          </p>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
