"use client"

import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselOptions,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

type ResponsiveCarouselProps<T> = {
  items: T[]
  getItemKey: (item: T, index: number) => React.Key
  renderItem: (item: T, index: number) => React.ReactNode
  itemClassName?: string
  className?: string
  contentClassName?: string
  opts?: CarouselOptions
  showControls?: boolean
  previousClassName?: string
  nextClassName?: string
}

export function ResponsiveCarousel<T>({
  items,
  getItemKey,
  renderItem,
  itemClassName,
  className,
  contentClassName,
  opts,
  showControls = false,
  previousClassName,
  nextClassName,
}: ResponsiveCarouselProps<T>) {
  return (
    <Carousel
      className={cn("w-full", className)}
      opts={{
        align: "start",
        containScroll: "trimSnaps",
        ...opts,
      }}
    >
      <CarouselContent className={contentClassName}>
        {items.map((item, index) => (
          <CarouselItem key={getItemKey(item, index)} className={itemClassName}>
            {renderItem(item, index)}
          </CarouselItem>
        ))}
      </CarouselContent>
      {showControls ? (
        <>
          <CarouselPrevious
            className={cn(
              "hidden md:flex md:-left-4 lg:-left-5",
              previousClassName,
            )}
          />
          <CarouselNext
            className={cn(
              "hidden md:flex md:-right-4 lg:-right-5",
              nextClassName,
            )}
          />
        </>
      ) : null}
    </Carousel>
  )
}
