import React, { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { X, Volume2, VolumeX, Play, Pause } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface StoryMedia {
  id: string | number
  type: "image" | "video"
  url: string
  duration?: number // fallback duration for images (ms), default 5000
  user?: {
    name: string
    avatar: string
    timeAgo?: string
  }
}

interface StoryViewerProps {
  stories: StoryMedia[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
  onStoryEnd?: (index: number) => void
  onAllStoriesEnd?: () => void
}

export function StoryViewer({
  stories,
  initialIndex = 0,
  isOpen,
  onClose,
  onStoryEnd,
  onAllStoriesEnd,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRAF = useRef<number | null>(null)
  const imageStartTime = useRef<number | null>(null)
  const imagePausedTime = useRef<number>(0)

  // Reset to initial when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setProgress(0)
      setIsPaused(false)
      imagePausedTime.current = 0
    }
  }, [isOpen, initialIndex])

  const currentStory = stories[currentIndex]

  // Cleanup effect
  const cleanup = useCallback(() => {
    if (progressRAF.current) {
      cancelAnimationFrame(progressRAF.current)
      progressRAF.current = null
    }
    imageStartTime.current = null
  }, [])

  const handleNext = useCallback(() => {
    cleanup()
    setProgress(0)
    imagePausedTime.current = 0
    if (onStoryEnd) onStoryEnd(currentIndex)
    
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      if (onAllStoriesEnd) onAllStoriesEnd()
      onClose()
    }
  }, [currentIndex, stories.length, onClose, onStoryEnd, onAllStoriesEnd, cleanup])

  const handlePrev = useCallback(() => {
    cleanup()
    setProgress(0)
    imagePausedTime.current = 0
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    } else {
      // If at first story, reset progress to 0
      if (currentStory?.type === "video" && videoRef.current) {
         videoRef.current.currentTime = 0
         videoRef.current.play().catch(() => {})
      }
    }
  }, [currentIndex, currentStory, cleanup])

  // Handle Image Progress
  useEffect(() => {
    if (!isOpen || !currentStory || currentStory.type !== "image") {
      cleanup()
      return
    }

    const duration = currentStory.duration || 5000

    const step = (timestamp: number) => {
      if (!imageStartTime.current) imageStartTime.current = timestamp
      
      if (isPaused) {
        // Update the paused elapsed time so when we resume we don't jump ahead
        imagePausedTime.current = timestamp - imageStartTime.current - (progress / 100) * duration
      } else {
        const elapsed = timestamp - imageStartTime.current - imagePausedTime.current
        const newProgress = (elapsed / duration) * 100
        
        if (newProgress >= 100) {
          setProgress(100)
          handleNext()
        } else {
          setProgress(newProgress)
          progressRAF.current = requestAnimationFrame(step)
        }
      }
    }

    if (!isPaused) {
      progressRAF.current = requestAnimationFrame(step)
    }

    return cleanup
  }, [currentIndex, isOpen, currentStory, isPaused, handleNext, cleanup, progress])

  // Reset on video change or when pausing state changes
  useEffect(() => {
    if (currentStory?.type === "video" && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(() => {
          // Playback failed (usually auto-play policy)
          setIsMuted(true)
          videoRef.current?.play().catch(e => console.error("Video play error:", e))
        })
      }
    }
  }, [currentIndex, currentStory, isOpen, isPaused])

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(p || 0)
    }
  }

  const handleVideoEnded = () => {
    handleNext()
  }

  // Pointer interactions for seeking/pausing
  const pointerDownTime = useRef<number>(0)
  const isHolding = useRef(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownTime.current = Date.now()
    isHolding.current = true
    
    // Slight delay before we consider it a "hold" to avoid flashing pause on quick taps
    setTimeout(() => {
      if (isHolding.current) setIsPaused(true)
    }, 150)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isHolding.current = false
    setIsPaused(false)

    const holdDuration = Date.now() - pointerDownTime.current
    if (holdDuration < 200) {
      // Treat as a tap
      const clickX = e.clientX
      const screenWidth = window.innerWidth
      if (clickX < screenWidth * 0.3) {
        handlePrev()
      } else {
        handleNext()
      }
    }
  }

  if (!isOpen || !currentStory) return null

  return (
    <div className="fixed inset-0 z-50 bg-black touch-none select-none flex flex-col">
      {/* Background blur/padding layer (creates Instagram-like centered card effect on desktop) */}
      <div className="absolute inset-0 md:bg-zinc-900 md:p-8 flex items-center justify-center">
        
        <div 
          className="relative w-full h-full md:max-w-md md:h-[90vh] md:rounded-xl overflow-hidden bg-black flex items-center justify-center isolate border border-zinc-800/50 shadow-2xl"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp} // If pointer leaves region, un-hold
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Media Content */}
          {currentStory.type === "image" ? (
            <Image 
              src={currentStory.url}
              alt="Story"
              fill
              className="object-contain"
              priority
            />
          ) : (
            <video
              ref={videoRef}
              src={currentStory.url}
              className="w-full h-full object-cover"
              playsInline
              muted={isMuted}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
            />
          )}

          {/* Top UI Overlay (Progress bars and Header) */}
          <div className="absolute top-0 inset-x-0 z-20 flex flex-col gap-2 p-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            {/* Progress Bars */}
            <div className="flex gap-1">
              {stories.map((s, i) => (
                <div key={s.id} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-75 ease-linear"
                    style={{
                      width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%"
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header (Avatar, Name, Actions) */}
            <div className="flex items-center justify-between text-white pointer-events-auto mt-2">
              {currentStory.user && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 ring-1 ring-white/20">
                    <AvatarImage src={currentStory.user.avatar} />
                    <AvatarFallback>{currentStory.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium drop-shadow-md">{currentStory.user.name}</span>
                  {currentStory.user.timeAgo && (
                    <span className="text-xs text-white/70 drop-shadow-md">{currentStory.user.timeAgo}</span>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {currentStory.type === "video" && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMuted(!isMuted)
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Pause Indicator overlay (optional UX touch) */}
          {isPaused && (
             <div className="absolute inset-0 flex items-center justify-center opacity-0 pointer-events-none">
               {/* Invisible so it just functions as logic blocker, but could put a play icon here */}
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
