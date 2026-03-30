import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircleIcon, ShieldCheckIcon, StarIcon, TruckIcon } from "lucide-react";

import { ProductSnippet, SectionHeader, SellerIdentity, formatNaira } from "@/components/marketplace-ui";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProductBySlug, getProductsForStore, getStoreBySlug } from "@/lib/marketplace-data";
import { cn } from "@/lib/utils";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const store = getStoreBySlug(product.seller.slug);

  if (!store) {
    notFound();
  }

  const similarProducts = getProductsForStore(store.slug).filter(
    (item) => item.slug !== product.slug,
  );

  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-8 xl:px-10">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_minmax(320px,420px)]">
        <div className="grid gap-3">
          <div className="surface-panel-strong hero-shadow float-in relative overflow-hidden rounded-[2rem] border border-brand-line">
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
              <Badge className="rounded-full bg-brand-soft text-primary hover:bg-brand-soft">
                {product.mediaType === "video" ? "Video post" : "Photo post"}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {product.deliveryEstimate}
              </Badge>
            </div>
            <div className="relative aspect-[4/5]">
              <Image
                src={product.gallery[0]}
                alt={product.title}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {product.gallery.slice(1).map((image, index) => (
              <div key={image} className="surface-panel relative overflow-hidden rounded-[1.4rem] border">
                <div className="relative aspect-square">
                  <Image
                    src={image}
                    alt={`${product.title} preview ${index + 2}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 20vw, 33vw"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="content-fade surface-panel-strong flex h-fit flex-col gap-5 rounded-[2rem] border p-5 lg:sticky lg:top-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="rounded-full bg-brand-soft text-primary hover:bg-brand-soft">
              {product.category}
            </Badge>
            <span>Rated {product.rating.toFixed(1)}</span>
            <span>·</span>
            <span>{product.reviewCount} reviews</span>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
              {product.title}
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {product.summary}
            </p>
          </div>

          <div className="flex items-end gap-3">
            <p className="font-heading text-3xl font-semibold">{formatNaira(product.price)}</p>
            {product.originalPrice ? (
              <p className="pb-1 text-sm text-muted-foreground line-through">
                {formatNaira(product.originalPrice)}
              </p>
            ) : null}
          </div>

          <div className="surface-muted flex flex-col gap-3 rounded-[1.5rem] border border-brand-line p-4">
            <SellerIdentity seller={product.seller} />
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <StarIcon className="size-4 text-primary" />
                <span>{product.rating.toFixed(1)} average rating with verified buyer feedback.</span>
              </div>
              <div className="flex items-center gap-2">
                <TruckIcon className="size-4 text-primary" />
                <span>{product.deliveryEstimate} for Lagos Mainland orders.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="size-4 text-primary" />
                <span>Buyer protection and return policy are visible before payment.</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.colors.map((color) => (
                  <Badge key={color} variant="secondary" className="rounded-full px-3 py-1">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.sizes.map((size) => (
                  <Badge key={size} variant="outline" className="rounded-full px-3 py-1">
                    {size}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/cart" className={cn(buttonVariants({ size: "lg" }), "justify-center rounded-full")}>
              Buy now
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/cart"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "justify-center rounded-full",
                )}
              >
                Add to cart
              </Link>
              <Link
                href="/inbox"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "justify-center rounded-full",
                )}
              >
                <MessageCircleIcon data-icon="inline-start" />
                Chat seller
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Tabs defaultValue="details" className="surface-panel-strong rounded-[2rem] border p-5">
          <TabsList variant="line" className="w-full justify-start overflow-x-auto rounded-none p-0">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="returns">Returns</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="pt-5">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <SectionHeader
                  eyebrow="Product story"
                  title="Made for discovery, styled for repeat orders."
                  description={product.description}
                />
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground">
                {product.highlights.map((item) => (
                  <div key={item} className="surface-muted rounded-[1.25rem] border p-4 leading-6">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="pt-5">
            <div className="grid gap-4">
              {product.reviews.map((review) => (
                <div key={review.author} className="surface-muted rounded-[1.5rem] border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{review.author}</p>
                    <p className="text-sm text-muted-foreground">{review.date}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.body}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="returns" className="pt-5">
            <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
              <p>
                Rands keeps return and refund information close to the buy action so buyers can
                make a confident decision without leaving the product page.
              </p>
              <p>
                Seller funds are held until the delivery window closes, and disputes can be opened
                before payout is released.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <aside className="flex flex-col gap-4">
          <div className="surface-panel-strong rounded-[2rem] border p-5">
            <SectionHeader
              eyebrow="Seller storefront"
              title={store.name}
              description={store.bio}
            />
            <Link
              href={`/store/${store.slug}`}
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 justify-center rounded-full")}
            >
              Visit store
            </Link>
          </div>
          <div className="surface-panel-strong rounded-[2rem] border p-5">
            <SectionHeader
              eyebrow="More like this"
              title="Keep the basket moving."
              description="Related products from the same verified seller."
            />
            <div className="mt-4 grid gap-4">
              {similarProducts.map((item) => (
                <ProductSnippet key={item.slug} product={item} compact />
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
