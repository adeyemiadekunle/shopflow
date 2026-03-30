"use client"

import { useState } from "react"
import { FeedPost } from "@/components/feed-post"

export function FeedTabs({ initialPosts }: { initialPosts: any[] }) {
  const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you")

  // In a real app, this filtering would happen on the backend.
  const displayedPosts = activeTab === "following"
    ? initialPosts.filter(post => post.seller.isFollowing)
    : initialPosts

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-4 md:px-6 py-4 border-b border-border sticky top-[3.5rem] bg-background/95 backdrop-blur z-10 flex gap-6">
        <button
          onClick={() => setActiveTab("for-you")}
          className={`text-lg font-semibold transition-colors relative pb-1 ${activeTab === "for-you" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          For You
          {activeTab === "for-you" && (
            <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-foreground rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`text-lg font-semibold transition-colors relative pb-1 ${activeTab === "following" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Following
          {activeTab === "following" && (
            <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-foreground rounded-full" />
          )}
        </button>
      </div>

      {displayedPosts.length > 0 ? (
        displayedPosts.map((post) => (
          <FeedPost
            key={post.id}
            id={post.id}
            seller={post.seller}
            content={post.content}
            product={post.product}
            engagement={post.engagement}
            commentsList={post.commentsList}
            isLiked={post.isLiked}
            isSaved={post.isSaved}
            timeAgo={post.timeAgo}
          />
        ))
      ) : (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-3">
          <p>You aren't following anyone yet.</p>
          <button
            onClick={() => setActiveTab("for-you")}
            className="text-accent font-medium hover:underline"
          >
            Discover Sellers
          </button>
        </div>
      )}
    </div>
  )
}
