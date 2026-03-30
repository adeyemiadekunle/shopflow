"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, PlusSquare, ShoppingBag, User } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Search", href: "/search" },
  { icon: PlusSquare, label: "Create", href: "/seller/dashboard" },
  { icon: ShoppingBag, label: "Shop", href: "/shop" },
  { icon: User, label: "Account", href: "/account" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 pb-safe">
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
