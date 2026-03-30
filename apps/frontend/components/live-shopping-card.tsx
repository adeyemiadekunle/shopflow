import Image from "next/image"
import { Users } from "lucide-react"

export interface LiveShoppingEvent {
  id: number | string
  title: string
  host: string
  viewers: string
  thumbnail: string
}

interface LiveShoppingCardProps {
  liveEvent: LiveShoppingEvent
}

export function LiveShoppingCard({ liveEvent }: LiveShoppingCardProps) {
  return (
    <button
      className="w-full relative h-40 rounded-xl overflow-hidden group mb-3 shadow-md border border-border"
    >
      <Image
        src={liveEvent.thumbnail}
        alt={liveEvent.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      
      <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-red-500/90 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg">
        <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
        LIVE
      </div>
      
      <div className="absolute bottom-3 left-3 right-3 text-left">
        <p className="text-sm font-bold text-white line-clamp-2 mb-1 drop-shadow-md">
          {liveEvent.title}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
            {liveEvent.host}
          </p>
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-md">
            <Users className="h-3 w-3 text-zinc-300 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-medium text-zinc-300 group-hover:text-white transition-colors">
              {liveEvent.viewers}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
