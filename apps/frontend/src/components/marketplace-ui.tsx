import Image from "next/image";
import Link from "next/link";
import { CheckIcon, HeartIcon, MapPinIcon, MessageCircleIcon, ShoppingBagIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedProduct, SellerSummary } from "@/lib/marketplace-data";
import { cn } from "@/lib/utils";

export function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function SellerIdentity({ seller }: { seller: SellerSummary }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-11 border border-brand-line">
        <AvatarImage src={seller.avatar} alt={seller.name} />
        <AvatarFallback>{seller.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{seller.name}</p>
          {seller.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-primary">
              <CheckIcon className="size-3" />
              Verified
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPinIcon className="size-3.5" />
          <span>{seller.location}</span>
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-[0.26em] text-primary">{eyebrow}</p>
      <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance">{title}</h2>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function ProductSnippet({
  product,
  compact = false,
}: {
  product: FeedProduct;
  compact?: boolean;
}) {
  return (
    <article className="surface-muted overflow-hidden rounded-[1.6rem] border">
      <Link href={`/product/${product.slug}`} className="block">
        <div className={cn("relative overflow-hidden", compact ? "aspect-[16/11]" : "aspect-[4/5]")}>
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 hover:scale-[1.03]"
            sizes={compact ? "(min-width: 768px) 20vw, 100vw" : "(min-width: 768px) 30vw, 100vw"}
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <Badge className="rounded-full bg-white/82 text-slate-900 hover:bg-white/82">
              {product.category}
            </Badge>
            {product.mediaType === "video" ? (
              <Badge className="rounded-full bg-slate-950/76 text-white hover:bg-slate-950/76">
                Video
              </Badge>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-4 p-4">
        <SellerIdentity seller={product.seller} />
        <div className="flex flex-col gap-2">
          <Link href={`/product/${product.slug}`} className="font-heading text-lg font-semibold tracking-tight">
            {product.title}
          </Link>
          <p className="text-sm leading-6 text-muted-foreground">{product.summary}</p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-heading text-xl font-semibold">{formatNaira(product.price)}</p>
            <p className="text-sm text-muted-foreground">{product.deliveryEstimate}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <HeartIcon className="size-4" />
              {product.likes}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircleIcon className="size-4" />
              {product.comments}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/product/${product.slug}`}
            className={cn(buttonVariants({ size: "lg" }), "justify-center rounded-full")}
          >
            View product
          </Link>
          <Link
            href="/cart"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "justify-center rounded-full",
            )}
          >
            <ShoppingBagIcon data-icon="inline-start" />
            Save
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FeedSkeleton() {
  return (
    <div className="grid gap-5">
      {[1, 2, 3].map((item) => (
        <div key={item} className="surface-panel-strong overflow-hidden rounded-[1.8rem] border p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="mt-4 aspect-[4/5] w-full rounded-[1.5rem]" />
          <div className="mt-4 grid gap-2">
            <Skeleton className="h-5 w-2/3 rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
