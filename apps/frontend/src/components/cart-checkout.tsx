"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { CreditCardIcon, ShieldCheckIcon, TruckIcon } from "lucide-react";

import { SectionHeader, formatNaira } from "@/components/marketplace-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCartData } from "@/lib/marketplace-data";

export function CartCheckout() {
  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCartData,
  });

  if (isLoading || !data) {
    return (
      <div className="px-4 py-6 md:px-8 xl:px-10">
        <div className="surface-panel-strong rounded-[2rem] border p-6">
          <p className="text-sm text-muted-foreground">Loading cart and checkout summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-8 xl:px-10">
      <section className="surface-panel-strong rounded-[2rem] border p-5">
        <SectionHeader
          eyebrow="Cart and checkout"
          title="Safe, short, and seller-aware."
          description="The flow keeps seller grouping visible, pulls trust cues higher up the page, and reduces the cognitive load before payment."
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          <div className="surface-panel-strong rounded-[2rem] border p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Seller group</p>
                <p className="mt-2 font-heading text-2xl font-semibold">{data.sellerName}</p>
              </div>
              <Badge className="rounded-full bg-brand-soft text-primary hover:bg-brand-soft">
                Seller-scoped checkout
              </Badge>
            </div>

            <div className="mt-5 grid gap-4">
              {data.items.map((item) => (
                <div key={item.title} className="surface-muted grid gap-4 rounded-[1.6rem] border p-4 md:grid-cols-[92px_minmax(0,1fr)_auto] md:items-center">
                  <div className="relative aspect-square overflow-hidden rounded-[1.2rem]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="92px"
                    />
                  </div>
                  <div className="grid gap-2">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.variant} · Qty {item.quantity}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.deliveryEstimate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-xl font-semibold">{formatNaira(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="surface-panel-strong rounded-[2rem] border p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-brand-soft p-3 text-primary">
                  <TruckIcon className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Shipping address</p>
                  <p className="text-sm text-muted-foreground">{data.address.name}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{data.address.detail}</p>
              <div className="mt-4 grid gap-2">
                {data.shippingMethods.map((method) => (
                  <div key={method.name} className="surface-muted rounded-[1.4rem] border p-3">
                    <p className="font-medium">{method.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{method.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-panel-strong rounded-[2rem] border p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-brand-soft p-3 text-primary">
                  <CreditCardIcon className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Payment method</p>
                  <p className="text-sm text-muted-foreground">Choose the safest route for this order.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {data.paymentMethods.map((method) => (
                  <div key={method.name} className="surface-muted rounded-[1.4rem] border p-3">
                    <p className="font-medium">{method.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{method.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="surface-panel-strong flex h-fit flex-col gap-5 rounded-[2rem] border p-5 xl:sticky xl:top-6">
          <SectionHeader
            eyebrow="Order review"
            title="Trust stays beside the pay button."
            description="Important delivery and refund cues are visible without sending buyers into another screen."
          />

          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatNaira(data.summary.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{formatNaira(data.summary.delivery)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Protection fee</span>
              <span>{formatNaira(data.summary.protection)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-medium">Total</span>
            <span className="font-heading text-2xl font-semibold">{formatNaira(data.summary.total)}</span>
          </div>

          <div className="grid gap-3">
            {data.protectionPoints.map((point) => (
              <div key={point} className="surface-muted flex items-start gap-3 rounded-[1.4rem] border p-3">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">{point}</p>
              </div>
            ))}
          </div>

          <Button size="lg" className="rounded-full">
            Proceed to payment
          </Button>
        </aside>
      </section>
    </div>
  );
}
