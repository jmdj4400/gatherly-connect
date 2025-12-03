import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoostedBadgeProps {
  level?: "basic" | "pro";
  className?: string;
  size?: "sm" | "default";
}

export function BoostedBadge({ level = "basic", className, size = "default" }: BoostedBadgeProps) {
  const isPro = level === "pro";
  
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 font-medium",
        isPro 
          ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30" 
          : "bg-primary/10 text-primary border-primary/20",
        size === "sm" && "text-xs py-0 px-1.5",
        className
      )}
    >
      {isPro ? (
        <Sparkles className={cn("shrink-0", size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      ) : (
        <TrendingUp className={cn("shrink-0", size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      )}
      {isPro ? "Featured" : "Boosted"}
    </Badge>
  );
}
