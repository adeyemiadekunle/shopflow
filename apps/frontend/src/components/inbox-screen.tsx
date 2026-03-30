"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightIcon, CircleIcon } from "lucide-react";
import { startTransition, useMemo, useState } from "react";

import { SellerIdentity, SectionHeader } from "@/components/marketplace-ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getInboxData } from "@/lib/marketplace-data";
import { cn } from "@/lib/utils";

export function InboxScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["inbox"],
    queryFn: getInboxData,
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const activeConversation = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return (
      data.conversations.find((conversation) => conversation.id === activeConversationId) ??
      data.conversations[0]
    );
  }, [activeConversationId, data]);

  if (isLoading || !data || !activeConversation) {
    return (
      <div className="px-4 py-6 md:px-8 xl:px-10">
        <div className="surface-panel-strong rounded-[2rem] border p-6">
          <p className="text-sm text-muted-foreground">Loading buyer and seller conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-8 xl:px-10">
      <section className="surface-panel-strong rounded-[2rem] border p-5">
        <SectionHeader
          eyebrow="Inbox"
          title="Buyer-seller chat stays close to the product context."
          description="The conversation layout keeps trust cues, quick questions, and the referenced product pinned so buyers can move from hesitation to payment faster."
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="surface-panel-strong rounded-[2rem] border p-3">
          <div className="grid gap-2">
            {data.conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() =>
                  startTransition(() => {
                    setActiveConversationId(conversation.id);
                  })
                }
                className={cn(
                  "flex w-full items-start gap-3 rounded-[1.4rem] px-3 py-3 text-left transition-colors",
                  activeConversation.id === conversation.id
                    ? "bg-brand-soft"
                    : "hover:bg-muted",
                )}
              >
                <Avatar className="size-11 border border-brand-line">
                  <AvatarImage src={conversation.seller.avatar} alt={conversation.seller.name} />
                  <AvatarFallback>{conversation.seller.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium">{conversation.seller.name}</p>
                    <p className="text-xs text-muted-foreground">{conversation.lastMessageAt}</p>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{conversation.preview}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="surface-panel-strong flex flex-col rounded-[2rem] border">
          <div className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <SellerIdentity seller={activeConversation.seller} />
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-2 text-sm font-medium text-primary">
                <CircleIcon className="size-3 fill-current text-current" />
                {activeConversation.onlineStatus}
              </div>
            </div>

            <div className="surface-muted rounded-[1.6rem] border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Pinned product
                  </p>
                  <p className="mt-2 font-medium">{activeConversation.product.title}</p>
                  <p className="text-sm text-muted-foreground">{activeConversation.product.price}</p>
                </div>
                <Link href={activeConversation.product.href} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open product
                  <ArrowUpRightIcon className="size-4" />
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {data.quickActions.map((action) => (
                <Button key={action} type="button" variant="outline" className="rounded-full">
                  {action}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4 p-5">
            {activeConversation.messages.map((message) => (
              <div
                key={`${message.author}-${message.timestamp}`}
                className={cn(
                  "max-w-[82%] rounded-[1.5rem] px-4 py-3 text-sm leading-6",
                  message.author === "buyer"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "surface-muted border",
                )}
              >
                <p>{message.body}</p>
                <p
                  className={cn(
                    "mt-2 text-xs",
                    message.author === "buyer"
                      ? "text-primary-foreground/74"
                      : "text-muted-foreground",
                  )}
                >
                  {message.timestamp}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex flex-col gap-3 p-5 md:flex-row">
            <div className="surface-muted flex-1 rounded-full border px-4 py-3 text-sm text-muted-foreground">
              Ask about availability, delivery, or request more photos...
            </div>
            <Button className="rounded-full px-6">Send message</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
