"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Heart, Bell, Menu, X, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeLabel = mounted
    ? `${theme ?? "system"} -> ${resolvedTheme ?? "unknown"}`
    : "theme...";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight">shopflow.</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-foreground hover:text-accent transition-colors"
          >
            Discover
          </Link>
          <Link
            href="/search"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sellers
          </Link>
          <Link
            href="/shop"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Shop
          </Link>
          <Link
            href="/live"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            Live
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </Link>
        </nav>

        {/* Search Bar */}
        <form
          action="/search"
          method="get"
          className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-md mx-4 lg:mx-8"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, sellers..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </form>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <div className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {themeLabel}
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-[10px] font-medium flex items-center justify-center text-accent-foreground">
              3
            </span>
          </Button>
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5" />
          </Button>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-[10px] font-medium flex items-center justify-center text-accent-foreground">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/seller/register">
            <Button size="sm" className="rounded-full gap-2">
              <Plus className="h-4 w-4" />
              Sell
            </Button>
          </Link>
          <Link href={isAuthenticated ? "/account" : "/login"}>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage
                src={
                  user?.avatarUrl ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop"
                }
              />
              <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative h-11 w-11">
              <ShoppingCart className="h-8 w-8" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-[10px] font-medium flex items-center justify-center text-accent-foreground">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-8 w-8" />
            ) : (
              <Menu className="h-8 w-8" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="p-4 space-y-4">
            <div className="rounded-full border border-border bg-secondary px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {themeLabel}
            </div>
            <Link href="/search" className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <div className="w-full h-10 pl-10 pr-4 rounded-full bg-secondary text-sm text-muted-foreground flex items-center">
                Search products, creators...
              </div>
            </Link>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm font-medium text-foreground py-2 px-3 rounded-lg hover:bg-secondary"
              >
                Discover
              </Link>
              <Link
                href="/search"
                className="text-sm font-medium text-muted-foreground py-2 px-3 rounded-lg hover:bg-secondary"
              >
                Sellers
              </Link>
              <Link
                href="/shop"
                className="text-sm font-medium text-muted-foreground py-2 px-3 rounded-lg hover:bg-secondary"
              >
                Shop
              </Link>
              <Link
                href="/live"
                className="text-sm font-medium text-muted-foreground py-2 px-3 rounded-lg hover:bg-secondary flex items-center gap-1.5"
              >
                Live
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
