import { Play, Shuffle, Heart, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackRow } from "@/components/TrackRow";
import { mockTracks, mockAlbums } from "@/lib/mockData";
import { useState } from "react";

export default function Playlist() {
  const [liked, setLiked] = useState(false);
  const playlist = mockAlbums[0];

  return (
    <div className="h-full overflow-auto pb-32">
      <div
        className="relative h-80 flex items-end p-8 mb-6"
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent, var(--background)), url(${playlist.cover})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/10 to-background" />
        <div className="relative z-10 flex items-end gap-6">
          <img
            src={playlist.cover}
            alt={playlist.title}
            className="h-48 w-48 rounded-md shadow-2xl"
          />
          <div>
            <p className="text-sm font-semibold mb-2">PLAYLIST</p>
            <h1 className="font-display text-6xl font-bold mb-4" data-testid="text-playlist-title">
              {playlist.title}
            </h1>
            <p className="text-muted-foreground">
              {playlist.artist} • {playlist.tracks} songs
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary hover:scale-105 transition-transform"
            data-testid="button-play-playlist"
          >
            <Play className="h-6 w-6 fill-current ml-0.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => console.log("Shuffle")}
            data-testid="button-shuffle-playlist"
          >
            <Shuffle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => {
              setLiked(!liked);
              console.log(`${liked ? "Unliked" : "Liked"} playlist`);
            }}
            data-testid="button-like-playlist"
          >
            <Heart
              className={`h-6 w-6 ${liked ? "fill-chart-2 text-chart-2" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            data-testid="button-playlist-more"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-1">
          {mockTracks.map((track, index) => (
            <TrackRow
              key={track.id}
              {...track}
              number={index + 1}
              isPlaying={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
