import { Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AlbumCardProps {
  id: string;
  title: string;
  artist: string;
  cover: string;
  tracks?: number;
  onPlay?: () => void;
}

export function AlbumCard({ title, artist, cover, tracks, onPlay }: AlbumCardProps) {
  return (
    <Card
      className="group overflow-hidden border-0 bg-card hover-elevate transition-all duration-200 cursor-pointer"
      data-testid={`card-album-${title}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-md">
        <img
          src={cover}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-primary hover:bg-primary hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
              console.log(`Playing album: ${title}`);
            }}
            data-testid="button-play-album"
          >
            <Play className="h-6 w-6 fill-current" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate" data-testid="text-album-title">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground truncate" data-testid="text-album-artist">
          {artist}
        </p>
        {tracks && (
          <p className="text-xs text-muted-foreground mt-1">
            {tracks} tracks
          </p>
        )}
      </div>
    </Card>
  );
}
