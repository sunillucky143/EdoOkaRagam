import { Play, Shuffle, Heart, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackRow } from "@/components/TrackRow";
import { availableTracks, availableAlbums } from "@/lib/mockData";
import { useState } from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Playlist() {
  const [liked, setLiked] = useState(false);
  const playlist = availableAlbums[0] || { id: "1", title: "Sample Playlist", artist: "Various Artists", cover: "", tracks: 0 };
  const { playQueue } = useAudioPlayer();
  const { toast } = useToast();

  const handlePlay = () => {
    playQueue(availableTracks, 0);
  };

  const handleShuffle = () => {
    const shuffled = [...availableTracks].sort(() => Math.random() - 0.5);
    playQueue(shuffled, 0);
  };

  const handleAddToQueue = () => {
    toast({
      title: "Added to queue",
      description: "All tracks have been added to your queue",
    });
  };

  const handleShare = () => {
    toast({
      title: "Share playlist",
      description: "Share this playlist with your friends",
    });
  };

  const handleEdit = () => {
    toast({
      title: "Edit playlist",
      description: "Edit playlist details and track order",
    });
  };

  const handleDelete = () => {
    toast({
      title: "Delete playlist",
      description: "Are you sure you want to delete this playlist?",
      variant: "destructive",
    });
  };

  return (
    <div className="h-full overflow-auto">
      <div
        className="relative h-64 md:h-80 flex items-end p-4 md:p-8 mb-4 md:mb-6"
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent, var(--background)), url(${playlist.cover})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/10 to-background" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
          <img
            src={playlist.cover}
            alt={playlist.title}
            className="h-32 w-32 md:h-48 md:w-48 rounded-md shadow-2xl"
          />
          <div>
            <p className="text-xs md:text-sm font-semibold mb-1 md:mb-2">PLAYLIST</p>
            <h1 className="font-display text-3xl md:text-6xl font-bold mb-2 md:mb-4" data-testid="text-playlist-title">
              {playlist.title}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {playlist.artist} • {playlist.tracks} songs
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-4 md:space-y-6">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary hover:scale-105 transition-transform"
            onClick={handlePlay}
            data-testid="button-play-playlist"
          >
            <Play className="h-6 w-6 fill-current ml-0.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={handleShuffle}
            data-testid="button-shuffle-playlist"
          >
            <Shuffle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setLiked(!liked)}
            data-testid="button-like-playlist"
          >
            <Heart
              className={`h-6 w-6 ${liked ? "fill-chart-2 text-chart-2" : ""}`}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                data-testid="button-playlist-more"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleAddToQueue} data-testid="menu-add-to-queue">
                Add to Queue
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare} data-testid="menu-share-playlist">
                Share Playlist
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit} data-testid="menu-edit-playlist">
                Edit Playlist
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="text-destructive" 
                data-testid="menu-delete-playlist"
              >
                Delete Playlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1">
          {availableTracks.map((track, index) => (
            <TrackRow
              key={track.id}
              {...track}
              number={index + 1}
              isPlaying={index === 0}
              audioUrl={track.audioUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Playlist;
