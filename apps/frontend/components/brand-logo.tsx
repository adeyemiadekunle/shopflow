import Link from "next/link"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  href?: string
  className?: string
  textClassName?: string
}

export function BrandLogo({
  href = "/",
  className,
  textClassName,
}: BrandLogoProps) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <span className={cn("text-2xl font-bold tracking-tight", textClassName)}>
        shopflow.
      </span>
    </Link>
  )
}
