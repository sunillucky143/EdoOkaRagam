import { Play, Heart, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TrackRowProps {
  id: string;
  number?: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  albumCover?: string;
  isPlaying?: boolean;
  onPlay?: () => void;
}

export function TrackRow({
  number,
  title,
  artist,
  album,
  duration,
  albumCover,
  isPlaying = false,
  onPlay,
}: TrackRowProps) {
  const [liked, setLiked] = useState(false);

  return (
    <div
      className="group grid grid-cols-[auto_1fr_1fr_auto_auto] md:grid-cols-[auto_auto_1fr_1fr_auto_auto] gap-4 px-4 py-2 rounded-md hover-elevate items-center"
      data-testid={`row-track-${title}`}
    >
      <div className="w-8 flex items-center justify-center">
        {isPlaying ? (
          <div className="flex gap-0.5">
            <div className="w-0.5 h-3 bg-chart-2 animate-pulse" />
            <div className="w-0.5 h-3 bg-chart-2 animate-pulse delay-75" />
            <div className="w-0.5 h-3 bg-chart-2 animate-pulse delay-150" />
          </div>
        ) : (
          <>
            <span className="text-sm text-muted-foreground group-hover:hidden">
              {number}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hidden group-hover:flex"
              onClick={() => {
                onPlay?.();
                console.log(`Playing track: ${title}`);
              }}
              data-testid="button-play-track"
            >
              <Play className="h-4 w-4 fill-current" />
            </Button>
          </>
        )}
      </div>

      {albumCover && (
        <img
          src={albumCover}
          alt={album}
          className="h-10 w-10 rounded hidden md:block"
        />
      )}

      <div className="min-w-0">
        <div
          className={`font-medium truncate ${isPlaying ? "text-chart-2" : "text-foreground"}`}
          data-testid="text-track-title"
        >
          {title}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {artist}
        </div>
      </div>

      <div className="text-sm text-muted-foreground truncate hidden md:block">
        {album}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100"
        onClick={() => {
          setLiked(!liked);
          console.log(`${liked ? "Unliked" : "Liked"} track: ${title}`);
        }}
        data-testid="button-like-track"
      >
        <Heart
          className={`h-4 w-4 ${liked ? "fill-chart-2 text-chart-2" : ""}`}
        />
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{duration}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100"
          data-testid="button-track-more"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
