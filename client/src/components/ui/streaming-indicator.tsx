import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

interface StreamingIndicatorProps {
  isStreaming?: boolean;
  isBuffering?: boolean;
  className?: string;
}

export function StreamingIndicator({ 
  isStreaming = false, 
  isBuffering = false, 
  className 
}: StreamingIndicatorProps) {
  if (!isStreaming && !isBuffering) return null;

  return (
    <div className={cn("flex items-center gap-1 text-xs", className)}>
      {isBuffering ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          <span className="text-muted-foreground">Buffering...</span>
        </>
      ) : isStreaming ? (
        <>
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-muted-foreground">Streaming</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-500" />
          <span className="text-muted-foreground">Offline</span>
        </>
      )}
    </div>
  );
}

