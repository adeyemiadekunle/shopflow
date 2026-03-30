"use client"

import { useState } from "react"
import { Send, Heart } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

export interface Comment {
  id: number | string
  username: string
  avatar: string
  text: string
  timeAgo: string
  likes: number
}

interface PostCommentsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  comments: Comment[]
}

export function PostComments({ open, onOpenChange, comments: initialComments }: PostCommentsProps) {
  const [comments, setComments] = useState(initialComments || [])
  const [newComment, setNewComment] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now(),
      username: "current_user",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop", // placeholder
      text: newComment,
      timeAgo: "Just now",
      likes: 0,
    }

    setComments([comment, ...comments])
    setNewComment("")
  }

  if (!open) return null

  return (
    <div className="border-t border-border mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Constraints for inline scroll area relative to feed */}
      <div className="max-h-[350px] overflow-y-auto p-3 sm:p-4 space-y-5 scrollbar-hide">
        {comments.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-muted-foreground opacity-70">
            <p className="text-sm">No comments yet.</p>
            <p className="text-xs mt-1">Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 items-start group">
              <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                <AvatarImage src={comment.avatar} />
                <AvatarFallback>{comment.username[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {comment.username}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {comment.timeAgo}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-snug">
                  {comment.text}
                </p>
                <div className="flex items-center gap-4 pt-0.5">
                  <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Reply
                  </button>
                  {comment.likes > 0 && (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {comment.likes} likes
                    </span>
                  )}
                </div>
              </div>
              
              <button className="p-1 shrink-0 -mt-1 group-hover:text-accent text-muted-foreground transition-colors">
                <Heart className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 pt-2 bg-background/50 backdrop-blur-sm z-10 sticky bottom-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0 hidden sm:block">
            <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop" />
            <AvatarFallback>Me</AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Input 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..." 
              className="bg-secondary/50 border-none rounded-full pl-4 pr-10 focus-visible:ring-1 focus-visible:ring-accent h-10 text-sm"
            />
            <button 
              type="submit"
              disabled={!newComment.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-accent disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 transition-transform"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
