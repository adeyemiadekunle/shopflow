"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, PlayIcon, SearchIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";

import { FeedSkeleton, ProductSnippet, SectionHeader, formatNaira } from "@/components/marketplace-ui";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHomeFeed } from "@/lib/marketplace-data";
import { cn } from "@/lib/utils";

export function HomeFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-feed"],
    queryFn: getHomeFeed,
  });
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const deferredQuery = useDeferredValue(query);

  const filteredProducts = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" ? true : product.category === activeCategory;
      const matchesQuery =
        deferredQuery.trim().length === 0
          ? true
          : `${product.title} ${product.seller.name} ${product.summary}`
              .toLowerCase()
              .includes(deferredQuery.trim().toLowerCase());

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, data, deferredQuery]);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6 md:px-8 xl:px-10">
        <FeedSkeleton />
      </div>
    );
  }

  const leadProduct = data.products[0];

  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-8 xl:px-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="surface-panel-strong hero-shadow float-in overflow-hidden rounded-[2rem] border border-brand-line">
          <div className="grid gap-6 p-5 md:grid-cols-[1.05fr_0.95fr] md:p-6">
            <div className="flex flex-col gap-5">
              <Badge className="w-fit rounded-full bg-brand-soft text-primary hover:bg-brand-soft">
                Social commerce feed
              </Badge>
              <div className="flex flex-col gap-3">
                <h1 className="font-heading max-w-xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
                  Rands turns product posts into trusted checkout moments.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                  The first pass focuses on mobile-first discovery, verified sellers, and clean
                  checkout cues while keeping the brand color system fully swappable.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products, categories, or seller names"
                    className="h-12 rounded-full pl-11"
                  />
                </div>
                <Link
                  href={`/product/${leadProduct.slug}`}
                  className={cn(buttonVariants({ size: "lg" }), "justify-center rounded-full")}
                >
                  View lead drop
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {data.trustPoints.map((point) => (
                  <div key={point} className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-2">
                    <ShieldCheckIcon className="size-4 text-primary" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-muted relative overflow-hidden rounded-[1.8rem] border p-4">
              <div className="absolute right-4 top-4 rounded-full bg-slate-950/72 px-3 py-1 text-xs font-medium text-white">
                Trending now
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                <Image
                  src={leadProduct.image}
                  alt={leadProduct.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 40vw, 100vw"
                />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-heading text-xl font-semibold">{leadProduct.title}</p>
                  <div className="flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-primary">
                    {leadProduct.mediaType === "video" ? (
                      <PlayIcon className="size-4" />
                    ) : (
                      <SparklesIcon className="size-4" />
                    )}
                    {leadProduct.mediaType}
                  </div>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{leadProduct.summary}</p>
                <div className="flex items-center justify-between gap-4">
                  <p className="font-heading text-2xl font-semibold">{formatNaira(leadProduct.price)}</p>
                  <Link
                    href={`/store/${leadProduct.seller.slug}`}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "justify-center rounded-full",
                    )}
                  >
                    Seller profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="surface-panel-strong rounded-[2rem] border p-5">
            <SectionHeader
              eyebrow="Today"
              title="What the app shell already supports."
              description="Bottom navigation, search, inbox, checkout, and profile routes are live so we can layer real APIs next."
            />
            <div className="mt-5 grid gap-3">
              {data.readiness.map((item) => (
                <div key={item.label} className="surface-muted rounded-[1.4rem] border p-4">
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="surface-panel-strong rounded-[2rem] border p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Categories"
            title="Discovery starts with a fast visual filter row."
            description="Category chips stay thumb-friendly on mobile and convert into a calmer control row on desktop."
          />
          <Link
            href="/search"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
          >
            Explore search
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </div>

        <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-1">
          {data.categories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={activeCategory === category ? "default" : "outline"}
              className="snap-start rounded-full"
              onClick={() =>
                startTransition(() => {
                  setActiveCategory(category);
                })
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductSnippet key={product.slug} product={product} />
        ))}
      </section>
    </div>
  );
}
