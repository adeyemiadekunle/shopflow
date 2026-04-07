"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, ShoppingBag, Store, User, LogIn } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function MobileNav() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()
  const isSeller = user?.role === "seller"

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Search", href: "/search" },
    isSeller
      ? { icon: Store, label: "Store", href: "/seller/dashboard" }
      : { icon: ShoppingBag, label: "Shop", href: "/shop" },
    isAuthenticated
      ? { icon: User, label: "Account", href: "/account" }
      : { icon: LogIn, label: "Login", href: "/login" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-bottom">
      <div className="grid h-16 grid-cols-4 items-center pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 h-full px-3 sm:px-4 transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isActive ? "fill-current" : ""}`} />
              <span className="text-[10px] sm:text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
