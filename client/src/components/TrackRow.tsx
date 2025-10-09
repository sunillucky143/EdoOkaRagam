import { Play, Heart, MoreHorizontal, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareMusicDialog } from "@/components/ShareMusicDialog";

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
  id,
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
  const { playTrack, currentTrack, addToQueue } = useAudioPlayer();
  const { toast } = useToast();

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    } else {
      playTrack({ id, title, artist, album, duration, albumCover: albumCover || "" });
    }
  };

  const handleAddToQueue = () => {
    addToQueue({ id, title, artist, album, duration, albumCover: albumCover || "" });
    toast({
      title: "Added to queue",
      description: `"${title}" has been added to your queue`,
    });
  };

  const handleAddToPlaylist = () => {
    toast({
      title: "Add to playlist",
      description: "Select a playlist to add this track to",
    });
  };

  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const isCurrentTrack = currentTrack?.id === id;

  return (
    <div
      className="group grid grid-cols-[auto_1fr_1fr_auto_auto] md:grid-cols-[auto_auto_1fr_1fr_auto_auto] gap-4 px-4 py-2 rounded-md hover-elevate items-center"
      data-testid={`row-track-${title}`}
    >
      <div className="w-8 flex items-center justify-center">
        {isPlaying || isCurrentTrack ? (
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
              onClick={handlePlay}
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
          className={`font-medium truncate ${isPlaying || isCurrentTrack ? "text-chart-2" : "text-foreground"}`}
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
        onClick={() => setLiked(!liked)}
        data-testid="button-like-track"
      >
        <Heart
          className={`h-4 w-4 ${liked ? "fill-chart-2 text-chart-2" : ""}`}
        />
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{duration}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
              data-testid="button-track-more"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleAddToQueue} data-testid="menu-add-to-queue">
              Add to Queue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddToPlaylist} data-testid="menu-add-to-playlist">
              Add to Playlist
            </DropdownMenuItem>
            <ShareMusicDialog
              track={{ id, title, artist, album, albumCover: albumCover || "" }}
              trigger={
                <DropdownMenuItem 
                  onSelect={(e) => { e.preventDefault(); setShareDialogOpen(true); }} 
                  data-testid="menu-share-track"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Track
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
