import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SectionActionButtonProps = React.ComponentProps<typeof Button> & {
  showIcon?: boolean
}

export function SectionActionButton({
  children = "See all",
  className,
  showIcon = true,
  ...props
}: SectionActionButtonProps) {
  return (
    <Button
      variant="section"
      size="pill-sm"
      className={cn("shrink-0", className)}
      {...props}
    >
      {children}
      {showIcon ? <ChevronRight /> : null}
    </Button>
  )
}
