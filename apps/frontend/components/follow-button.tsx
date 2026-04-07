"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FollowButtonProps {
  initialIsFollowing?: boolean
  sellerId?: string | number
  className?: string
  size?: "default" | "sm" | "pill-sm" | "pill" | "lg" | "icon"
  variant?: "default" | "outline" | "secondary" | "ghost" | "section"
}

export function FollowButton({
  initialIsFollowing = false,
  sellerId,
  className,
  size = "sm",
  variant,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)

  const handleFollow = (e: React.MouseEvent) => {
    // Prevent event propagation so clicking the button doesn't trigger parent links/cards
    e.stopPropagation()
    // In a real app, fire API mutation here with sellerId
    setIsFollowing(!isFollowing)
  }

  // If a specific variant is passed (e.g., 'outline' for sidebar), we fall back to it when not following.
  // When following, we default to secondary to establish a consistent visual state across the app.
  const activeVariant = isFollowing ? "secondary" : (variant || "default")

  return (
    <Button
      variant={activeVariant}
      size={size}
      className={cn(
        "rounded-full transition-all",
        isFollowing ? "opacity-80 hover:opacity-100" : "",
        className
      )}
      onClick={handleFollow}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  )
}
