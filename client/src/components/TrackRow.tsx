import { Play, Heart, MoreHorizontal, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HDBadge } from "@/components/ui/hd-badge";
import { useEffect, useState } from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  isHD?: boolean;
  audioUrl?: string;
  onPlay?: () => void;
  showLike?: boolean;
  onLikedChange?: (liked: boolean) => void;
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
  isHD = false,
  audioUrl,
  onPlay,
  showLike = true,
  onLikedChange,
}: TrackRowProps) {
  const [liked, setLiked] = useState(false);
  const { playTrack, currentTrack, addToQueue } = useAudioPlayer();
  const { toast } = useToast();
  const currentUserId = "current-user";

  useEffect(() => {
    if (!showLike) return;
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`/api/likes/${currentUserId}/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) setLiked(Boolean(data?.liked));
      } catch {}
    })();
    return () => { ignore = true; };
  }, [id, showLike]);

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    } else {
      playTrack({ 
        id, 
        title, 
        artist, 
        album, 
        duration, 
        albumCover: albumCover || "",
        audioUrl: audioUrl || ""
      });
    }
  };

  const handleAddToQueue = () => {
    addToQueue({ 
      id, 
      title, 
      artist, 
      album, 
      duration, 
      albumCover: albumCover || "",
      audioUrl: audioUrl || ""
    });
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
          className={`font-medium truncate flex items-center gap-2 ${isPlaying || isCurrentTrack ? "text-chart-2" : "text-foreground"}`}
          data-testid="text-track-title"
        >
          {title}
          <HDBadge isHD={isHD} />
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {artist}
        </div>
      </div>

      <div className="text-sm text-muted-foreground truncate hidden md:block">
        {album}
      </div>

      {showLike && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100"
          onClick={async () => {
            try {
              if (!liked) {
                await apiRequest("POST", "/api/likes", { userId: currentUserId, trackId: id });
                setLiked(true);
                onLikedChange?.(true);
                window.dispatchEvent(new CustomEvent('likes:updated', { detail: { userId: currentUserId, trackId: id, liked: true } }));
                toast({ title: "Added to Liked Songs", description: `"${title}" saved` });
              } else {
                await apiRequest("DELETE", "/api/likes", { userId: currentUserId, trackId: id });
                setLiked(false);
                onLikedChange?.(false);
                window.dispatchEvent(new CustomEvent('likes:updated', { detail: { userId: currentUserId, trackId: id, liked: false } }));
                toast({ title: "Removed from Liked Songs", description: `"${title}" removed` });
              }
              queryClient.invalidateQueries({ queryKey: [`/api/likes/${currentUserId}`] });
              queryClient.invalidateQueries({ queryKey: [`/api/likes/${currentUserId}`] });
            } catch (e) {
              toast({ title: "Action failed", description: "Please try again", variant: "destructive" });
            }
          }}
          data-testid="button-like-track"
        >
          <Heart
            className={`h-4 w-4 ${liked ? "fill-chart-2 text-chart-2" : ""}`}
          />
        </Button>
      )}

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
