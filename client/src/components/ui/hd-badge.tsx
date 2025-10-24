import { Badge } from "@/components/ui/badge";
import { Volume2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface HDBadgeProps {
  isHD?: boolean;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function HDBadge({ isHD = false, className, variant = "default" }: HDBadgeProps) {
  if (!isHD) return null;

  return (
    <Badge 
      variant={variant}
      className={cn(
        "flex items-center gap-1 px-2 py-1 text-xs font-medium",
        "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
        "border-0 shadow-sm",
        className
      )}
    >
      <Zap className="h-3 w-3" />
      HD
    </Badge>
  );
}
