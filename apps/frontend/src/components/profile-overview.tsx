"use client";

import { useQuery } from "@tanstack/react-query";
import { HeartIcon, MapPinIcon, PackageCheckIcon, ShieldCheckIcon } from "lucide-react";

import { SectionHeader } from "@/components/marketplace-ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProfileData } from "@/lib/marketplace-data";

export function ProfileOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfileData,
  });

  if (isLoading || !data) {
    return (
      <div className="px-4 py-6 md:px-8 xl:px-10">
        <div className="surface-panel-strong rounded-[2rem] border p-6">
          <p className="text-sm text-muted-foreground">Loading account profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-8 xl:px-10">
      <section className="surface-panel-strong rounded-[2rem] border p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border border-brand-line">
              <AvatarImage src={data.avatar} alt={data.name} />
              <AvatarFallback>{data.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <h1 className="font-heading text-3xl font-semibold tracking-tight">{data.name}</h1>
              <p className="text-sm text-muted-foreground">{data.handle}</p>
            </div>
          </div>
          <Badge className="rounded-full bg-brand-soft px-4 py-2 text-primary hover:bg-brand-soft">
            {data.tier}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="surface-muted rounded-[1.6rem] border p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Orders</p>
            <p className="mt-2 font-heading text-3xl font-semibold">{data.stats.orders}</p>
          </div>
          <div className="surface-muted rounded-[1.6rem] border p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Saved items</p>
            <p className="mt-2 font-heading text-3xl font-semibold">{data.stats.saved}</p>
          </div>
          <div className="surface-muted rounded-[1.6rem] border p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Address book</p>
            <p className="mt-2 font-heading text-3xl font-semibold">{data.stats.addresses}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="surface-panel-strong rounded-[2rem] border p-5">
          <SectionHeader
            eyebrow="Recent orders"
            title="Tables show up where scanning speed matters."
            description="The rest of the app stays visual-first, but order history gets a proper table for quick status checks."
          />
          <div className="mt-5 rounded-[1.6rem] border bg-background/85 p-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.seller}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="surface-panel-strong rounded-[2rem] border p-5">
            <SectionHeader
              eyebrow="Saved addresses"
              title="Checkout shortcuts"
              description="Address memory matters in low-friction mobile checkout."
            />
            <div className="mt-4 grid gap-3">
              {data.addresses.map((address) => (
                <div key={address.name} className="surface-muted rounded-[1.5rem] border p-4">
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="size-4 text-primary" />
                    <p className="font-medium">{address.name}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{address.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel-strong rounded-[2rem] border p-5">
            <div className="grid gap-3">
              <div className="surface-muted flex items-start gap-3 rounded-[1.4rem] border p-4">
                <PackageCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Orders stay grouped by seller, which maps cleanly to the backend checkout flow.
                </p>
              </div>
              <div className="surface-muted flex items-start gap-3 rounded-[1.4rem] border p-4">
                <HeartIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Saved products, follow state, and seller trust can all reuse the same profile shell.
                </p>
              </div>
              <div className="surface-muted flex items-start gap-3 rounded-[1.4rem] border p-4">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Buyer protection and return policy language stays close to order history.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
