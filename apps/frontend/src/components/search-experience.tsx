"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FilterIcon, SearchIcon } from "lucide-react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";

import { ProductSnippet, SectionHeader, SellerIdentity } from "@/components/marketplace-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSearchIndex } from "@/lib/marketplace-data";

export function SearchExperience() {
  const { data, isLoading } = useQuery({
    queryKey: ["search-index"],
    queryFn: getSearchIndex,
  });
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sheetOpen, setSheetOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const filteredProducts = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.products.filter((product) => {
      const matchesFilter = activeFilter === "All" ? true : product.tags.includes(activeFilter);
      const matchesQuery =
        deferredQuery.trim().length === 0
          ? true
          : `${product.title} ${product.summary} ${product.seller.name}`
              .toLowerCase()
              .includes(deferredQuery.trim().toLowerCase());

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, data, deferredQuery]);

  const filteredSellers = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.sellers.filter((seller) =>
      `${seller.name} ${seller.location} ${seller.headline}`
        .toLowerCase()
        .includes(deferredQuery.trim().toLowerCase() || ""),
    );
  }, [data, deferredQuery]);

  if (isLoading || !data) {
    return (
      <div className="px-4 py-6 md:px-8 xl:px-10">
        <div className="surface-panel-strong rounded-[2rem] border p-6">
          <p className="text-sm text-muted-foreground">Loading search surfaces...</p>
        </div>
      </div>
    );
  }

  const filtersPanel = (
    <div className="grid gap-3">
      {data.filters.map((filter) => (
        <Button
          key={filter}
          type="button"
          variant={filter === activeFilter ? "default" : "outline"}
          className="justify-start rounded-full"
          onClick={() =>
            startTransition(() => {
              setActiveFilter(filter);
              setSheetOpen(false);
            })
          }
        >
          {filter}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-8 xl:px-10">
      <section className="surface-panel-strong rounded-[2rem] border p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Search"
            title="Products, sellers, and filters live in one calm discovery surface."
            description="This route is where TanStack Query can swap from demo data to the real catalog and seller APIs without replacing the screen architecture."
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-full md:hidden"
            onClick={() => setSheetOpen(true)}
          >
            <FilterIcon data-icon="inline-start" />
            Filters
          </Button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="surface-muted hidden rounded-[1.6rem] border p-4 lg:block">{filtersPanel}</div>

          <div className="grid gap-5">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for products, storefronts, or styles"
                className="h-12 rounded-full pl-11"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList variant="line" className="w-full justify-start overflow-x-auto rounded-none p-0">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="sellers">Sellers</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="pt-5">
                <div className="grid gap-8">
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.slice(0, 3).map((product) => (
                      <ProductSnippet key={product.slug} product={product} compact />
                    ))}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredSellers.map((seller) => (
                      <Link
                        key={seller.slug}
                        href={`/store/${seller.slug}`}
                        className="surface-muted rounded-[1.6rem] border p-4"
                      >
                        <SellerIdentity seller={seller} />
                        <p className="mt-4 text-sm leading-6 text-muted-foreground">
                          {seller.headline}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {seller.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="rounded-full">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="products" className="pt-5">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductSnippet key={product.slug} product={product} compact />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="sellers" className="pt-5">
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredSellers.map((seller) => (
                    <Link
                      key={seller.slug}
                      href={`/store/${seller.slug}`}
                      className="surface-muted rounded-[1.6rem] border p-4"
                    >
                      <SellerIdentity seller={seller} />
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">{seller.headline}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {seller.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="rounded-full">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[2rem]">
          <SheetHeader>
            <SheetTitle>Search filters</SheetTitle>
            <SheetDescription>
              Keep filtering simple on mobile and let the results stay visual.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">{filtersPanel}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
