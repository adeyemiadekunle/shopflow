"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleUserRoundIcon,
  HouseIcon,
  MessageCircleMoreIcon,
  SearchIcon,
  ShoppingBagIcon,
} from "lucide-react";

import { BrandThemeToggle } from "@/components/brand-theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/",
    label: "Home",
    icon: HouseIcon,
  },
  {
    href: "/search",
    label: "Search",
    icon: SearchIcon,
  },
  {
    href: "/inbox",
    label: "Inbox",
    icon: MessageCircleMoreIcon,
  },
  {
    href: "/cart",
    label: "Cart",
    icon: ShoppingBagIcon,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: CircleUserRoundIcon,
  },
];

function isRouteActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="surface-panel-strong hidden w-[280px] shrink-0 flex-col border-r px-6 py-6 lg:flex">
          <Link href="/" className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="glow-pulse rounded-[1.1rem] bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                R
              </div>
              <div>
                <p className="font-heading text-lg font-semibold tracking-tight">Rands</p>
                <p className="text-sm text-muted-foreground">Social commerce, buyer first.</p>
              </div>
            </div>
          </Link>

          <div className="mt-8 flex flex-col gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isRouteActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[1.1rem] px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-soft text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-8">
            <BrandThemeToggle />
          </div>

          <div className="surface-muted mt-auto rounded-[1.6rem] border p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Theme-ready</p>
            <p className="mt-3 font-heading text-xl font-semibold text-balance">
              Brand color stays flexible while the layout system settles.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Tokens drive buttons, highlights, seller trust blocks, and navigation so the final
              identity can shift without rebuilding the UI.
            </p>
            <Link
              href="/store/kosi-market"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-5 justify-center rounded-full",
              )}
            >
              Preview storefront
            </Link>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="surface-panel sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <div className="rounded-[1rem] bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                R
              </div>
              <div>
                <p className="font-heading text-base font-semibold tracking-tight">Rands</p>
                <p className="text-xs text-muted-foreground">Discover. Trust. Checkout.</p>
              </div>
            </Link>
            <BrandThemeToggle compact />
          </header>

          <main className="flex-1 pb-24 lg:pb-10">{children}</main>
        </div>
      </div>

      <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-4 lg:hidden">
        <div className="surface-panel-strong pointer-events-auto mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.6rem] border p-2 shadow-[0_18px_60px_rgba(15,23,42,0.14)]">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[1rem] px-2 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-brand-soft text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
