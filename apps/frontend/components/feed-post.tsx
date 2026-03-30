"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ShoppingBag, Play } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FollowButton } from "@/components/follow-button"
import { FeedProductCard, type FeedProduct } from "@/components/feed-product-card"
import { PostComments, type Comment } from "@/components/post-comments"

interface FeedPostProps {
  id: number
  seller: {
    name: string
    username: string
    avatar: string
    verified: boolean
    isFollowing?: boolean
  }
  content: {
    type: "image" | "video" | "carousel"
    media: string[]
    caption: string
  }
  product?: FeedProduct
  engagement: {
    likes: number
    comments: number
    shares: number
  }
  commentsList?: Comment[]
  isLiked?: boolean
  isSaved?: boolean
  timeAgo: string
}

export function FeedPost({
  seller,
  content,
  product,
  engagement,
  commentsList = [],
  isLiked: initialLiked = false,
  isSaved: initialSaved = false,
  timeAgo,
}: FeedPostProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [likes, setLikes] = useState(engagement.likes)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  return (
    <article className="border-b border-border pb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-accent ring-offset-2 ring-offset-background">
            <AvatarImage src={seller.avatar} />
            <AvatarFallback>{seller.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">{seller.name}</span>
              {seller.verified && (
                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <FollowButton
            initialIsFollowing={seller.isFollowing}
            className="h-7 px-3 text-xs"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Media */}
      <div className="relative aspect-video sm:aspect-[2/1] md:aspect-[21/9] max-h-[35vh] md:max-h-[300px] w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] bg-secondary overflow-hidden rounded-lg mx-auto group/feed-media">
        <Image
          src={content.media[currentSlide]}
          alt={content.caption}
          fill
          className="object-cover"
        />

        {/* Video Play Button */}
        {content.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-8 w-8 text-foreground fill-foreground" />
            </div>
          </div>
        )}

        {/* Carousel Indicators */}
        {content.media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {content.media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all ${index === currentSlide ? "w-6 bg-primary" : "w-1.5 bg-primary/50"
                  }`}
              />
            ))}
          </div>
        )}

        {/* Product Info Overlay Component */}
        {product && <FeedProductCard product={product} />}
      </div>




      {/* Images Strip */}
      {content.media.length > 1 && (
        <div className="flex gap-2 sm:gap-3 px-3 sm:px-4 pt-2 overflow-x-auto scrollbar-hide">
          {content.media.map((mediaUrl, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`flex-shrink-0 relative h-14 w-14 md:h-16 md:w-16 rounded-md overflow-hidden border-2 transition-colors ${currentSlide === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                }`}
            >
              <Image src={mediaUrl} alt={`${product?.name || 'Product'} image ${index + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-3 sm:px-4 pt-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 group"
          >
            <Heart
              className={`h-6 w-6 transition-all group-hover:scale-110 ${isLiked ? "fill-red-500 text-red-500" : "text-foreground"
                }`}
            />
          </button>
          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="flex items-center gap-1.5 group"
          >
            <MessageCircle className={`h-6 w-6 transition-transform ${isCommentsOpen ? 'fill-foreground text-foreground' : 'group-hover:scale-110'}`} />
          </button>
          <button className="flex items-center gap-1.5 group">
            <Send className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <button
          onClick={() => setIsSaved(!isSaved)}
          className="group"
        >
          <Bookmark
            className={`h-6 w-6 transition-all group-hover:scale-110 ${isSaved ? "fill-foreground" : ""
              }`}
          />
        </button>
      </div>

      {/* Engagement Stats */}
      <div className="px-3 sm:px-4 pt-2">
        <p className="text-sm font-semibold">{formatNumber(likes)} likes</p>
      </div>

      {/* Caption & Product Details */}
      <div className="px-3 sm:px-4 pt-1">
        {product && (
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{product.name}</h3>
            <p className="font-medium text-accent">${product.price}</p>
          </div>
        )}
        <p className="text-sm">
          <span className="font-semibold">{seller.username}</span>{" "}
          {content.caption.length > 100
            ? content.caption.slice(0, 100) + "..."
            : content.caption}
        </p>
      </div>

      {/* Comments Link & Inline Integration */}
      {!isCommentsOpen && (
        <button
          onClick={() => setIsCommentsOpen(true)}
          className="px-3 sm:px-4 pt-1 text-left w-full"
        >
          {engagement.comments > 0 ? (
            <p className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all {formatNumber(engagement.comments)} comments
            </p>
          ) : (
            <p className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Add a comment...
            </p>
          )}
        </button>
      )}

      {/* Render the reusable Inline Comments Component */}
      <PostComments
        open={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
        comments={commentsList}
      />
    </article>
  )
}
