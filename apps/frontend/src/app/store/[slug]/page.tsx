import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircleIcon, ShieldCheckIcon, StoreIcon } from "lucide-react";

import { ProductSnippet, SectionHeader } from "@/components/marketplace-ui";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getProductsForStore, getStoreBySlug } from "@/lib/marketplace-data";
import { cn } from "@/lib/utils";

type StorePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const store = getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const products = getProductsForStore(store.slug);

  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-8 xl:px-10">
      <section className="surface-panel-strong hero-shadow overflow-hidden rounded-[2rem] border">
        <div className="relative aspect-[16/7] min-h-[220px]">
          <Image
            src={store.banner}
            alt={store.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 text-white md:flex-row md:items-end md:justify-between md:p-8">
            <div className="flex max-w-2xl flex-col gap-3">
              <Badge className="w-fit rounded-full bg-white/12 text-white hover:bg-white/12">
                Verified storefront
              </Badge>
              <div className="flex flex-col gap-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
                  {store.name}
                </h1>
                <p className="max-w-xl text-sm leading-6 text-white/82">{store.headline}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-white/18 bg-white/12 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-white/64">Followers</p>
                <p className="mt-2 text-lg font-semibold">{store.followers}</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/18 bg-white/12 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-white/64">Rating</p>
                <p className="mt-2 text-lg font-semibold">{store.rating.toFixed(1)}</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/18 bg-white/12 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-white/64">Response</p>
                <p className="mt-2 text-lg font-semibold">{store.responseTime}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-8">
          <div className="surface-panel-strong rounded-[2rem] border p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <SectionHeader
                eyebrow="Storefront"
                title="A seller page that feels branded before a final logo exists."
                description={store.bio}
              />
              <div className="flex flex-wrap gap-3">
                <Link href="/inbox" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
                  <MessageCircleIcon data-icon="inline-start" />
                  Chat seller
                </Link>
                <Link
                  href="/profile"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-full",
                  )}
                >
                  Follow store
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {store.serviceHighlights.map((item) => (
                <div key={item.title} className="surface-muted rounded-[1.5rem] border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-brand-soft p-2 text-primary">
                      {item.title === "Protected checkout" ? (
                        <ShieldCheckIcon className="size-5" />
                      ) : (
                        <StoreIcon className="size-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel-strong rounded-[2rem] border p-5">
            <SectionHeader
              eyebrow="Featured collections"
              title="Collections make a seller page feel like a mini shop."
              description="Each collection gives buyers a clear path from inspiration to checkout."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {store.collections.map((collection) => (
                <div key={collection.name} className="surface-muted rounded-[1.5rem] border p-4">
                  <p className="font-medium">{collection.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{collection.description}</p>
                  <p className="mt-4 text-sm font-medium text-primary">{collection.itemCount} live items</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel-strong rounded-[2rem] border p-5">
            <SectionHeader
              eyebrow="Products"
              title="Visual-first product browsing."
              description="Large imagery, quick trust cues, and fast actions keep the store discoverable."
            />
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {products.map((product) => (
                <ProductSnippet key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </div>

        <aside className="grid h-fit gap-4 xl:sticky xl:top-6">
          <div className="surface-panel-strong rounded-[2rem] border p-5">
            <SectionHeader
              eyebrow="Recent posts"
              title="Content still drives commerce."
              description="Recent social posts double as discovery surfaces."
            />
            <div className="mt-4 grid gap-3">
              {store.recentPosts.map((post) => (
                <div key={post.caption} className="surface-muted rounded-[1.5rem] border p-4">
                  <p className="text-sm font-medium">{post.caption}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {post.engagement}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
