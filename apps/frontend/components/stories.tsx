"use client"

import { useState } from "react"
import { Plus, Play } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StoryViewer, type StoryMedia } from "@/components/story-viewer"

type Story = {
  id: string | number
  name: string
  image: string
  videoUrl?: string
  isCreate?: boolean
  hasNew?: boolean
  isLive?: boolean
  isFollowing?: boolean
}

const initialStories: Story[] = [
  {
    id: "create",
     name: "Your Story",
     image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
     isCreate: true,
   },
  {
    id: 1,
    name: "Sarah",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    hasNew: true,
    isLive: true,
    isFollowing: true,
  },
  {
    id: 2,
    name: "Nike",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    hasNew: true,
    isFollowing: true,
  },
  {
    id: 3,
    name: "Alex",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    hasNew: true,
    isFollowing: false,
  },
  {
    id: 4,
    name: "Zara",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=80&h=80&fit=crop",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    hasNew: true,
    isLive: true,
    isFollowing: true,
  },
  {
    id: 5,
    name: "Mike",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    hasNew: false,
    isFollowing: true,
  },
  {
    id: 6,
    name: "Emma",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    hasNew: true,
    isFollowing: false,
  },
  {
    id: 7,
    name: "Apple",
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=80&h=80&fit=crop",
    hasNew: true,
    isFollowing: true,
  },
]

export function Stories() {
  const [stories, setStories] = useState(initialStories)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0)

  // Filter out the "create" button and stories without video/new content if we want,
  // but let's just use the valid ones for the viewer.
  const playableStories = stories.filter((story) => !story.isCreate && (story.hasNew || story.videoUrl))

  const handleStoryTap = (story: Story) => {
    if (story.isCreate) return // Handle story creation separately

    const index = playableStories.findIndex(s => s.id === story.id)
    if (index !== -1) {
      setViewerInitialIndex(index)
      setIsViewerOpen(true)
    }
  }

  const markStoryAsViewed = (playableIndex: number) => {
    const storyId = playableStories[playableIndex]?.id
    if (!storyId) return

    setStories((prev) => 
      prev.map((story) => 
        story.id === storyId
          ? { ...story, hasNew: false, isLive: false }
          : story
      )
    )
  }
  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-4">
      <div className="flex gap-3 sm:gap-4 px-4 md:px-6 min-w-max">
        {stories
          .filter((story) => story.isCreate || story.isFollowing)
          .map((story) => (
            <button
              key={story.id}
              onClick={() => handleStoryTap(story)}
              className="flex flex-col items-center gap-2 group"
            >
            <div
              className={`relative p-0.5 rounded-full transition-all duration-300 ${
                story.isCreate
                  ? "bg-secondary"
                  : story.isLive && story.hasNew
                  ? "bg-red-500 animate-pulse ring-2 ring-red-500 ring-offset-2 ring-offset-background shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                  : story.hasNew
                  ? "bg-gradient-to-tr from-accent via-orange-400 to-pink-500"
                  : "bg-secondary"
              }`}
            >
              <div className="p-0.5 bg-background rounded-full relative">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18">
                  <AvatarImage src={story.image} className="object-cover" />
                  <AvatarFallback>{story.name[0]}</AvatarFallback>
                </Avatar>
                
                {/* Video Play Indicator Overlay */}
                {!story.isCreate && (story.hasNew || story.isLive) && (
                  <div className="absolute inset-0 m-auto h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                  </div>
                )}
                
                {/* LIVE Badge Overlay */}
                {story.isLive && story.hasNew && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-sm border border-background z-10 shadow-sm whitespace-nowrap">
                    LIVE
                  </div>
                )}
              </div>
              
              {story.isCreate && (
                <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                  <Plus className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-16">
              {story.name}
            </span>
          </button>
        ))}
      </div>

      <StoryViewer
        isOpen={isViewerOpen}
        initialIndex={viewerInitialIndex}
        onClose={() => setIsViewerOpen(false)}
        onStoryEnd={markStoryAsViewed}
        stories={playableStories.map(s => ({
          id: s.id,
          type: s.videoUrl ? "video" : "image",
          url: s.videoUrl || s.image,
          user: {
            name: s.name,
            avatar: s.image,
            timeAgo: s.isLive ? "LIVE" : "2h",
          }
        }))}
      />
    </div>
  )
}
