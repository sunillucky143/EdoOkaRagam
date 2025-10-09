import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  ListMusic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface AudioPlayerProps {
  track?: {
    title: string;
    artist: string;
    albumCover: string;
  };
  onQueueClick?: () => void;
}

export function AudioPlayer({ track, onQueueClick }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(33);
  const [volume, setVolume] = useState(70);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-card border-t border-card-border z-50">
      <div className="h-full px-4 flex items-center gap-4">
        <div className="flex items-center gap-3 w-64">
          <img
            src={track.albumCover}
            alt={track.title}
            className="h-14 w-14 rounded-md"
          />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate" data-testid="text-player-title">
              {track.title}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {track.artist}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${shuffle ? "text-chart-2" : ""}`}
              onClick={() => {
                setShuffle(!shuffle);
                console.log(`Shuffle ${!shuffle ? "on" : "off"}`);
              }}
              data-testid="button-shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => console.log("Previous track")}
              data-testid="button-previous"
            >
              <SkipBack className="h-5 w-5 fill-current" />
            </Button>

            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary"
              onClick={() => {
                setIsPlaying(!isPlaying);
                console.log(isPlaying ? "Paused" : "Playing");
              }}
              data-testid="button-play-pause"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => console.log("Next track")}
              data-testid="button-next"
            >
              <SkipForward className="h-5 w-5 fill-current" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${repeat ? "text-chart-2" : ""}`}
              onClick={() => {
                setRepeat(!repeat);
                console.log(`Repeat ${!repeat ? "on" : "off"}`);
              }}
              data-testid="button-repeat"
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-full flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 text-right">
              1:24
            </span>
            <Slider
              value={[progress]}
              onValueChange={([value]) => {
                setProgress(value);
                console.log(`Seek to ${value}%`);
              }}
              className="flex-1"
              data-testid="slider-progress"
            />
            <span className="text-xs text-muted-foreground w-10">3:45</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-64 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              onQueueClick?.();
              console.log("Queue toggled");
            }}
            data-testid="button-queue"
          >
            <ListMusic className="h-5 w-5" />
          </Button>
          <Volume2 className="h-5 w-5 text-muted-foreground" />
          <Slider
            value={[volume]}
            onValueChange={([value]) => {
              setVolume(value);
              console.log(`Volume: ${value}%`);
            }}
            className="w-24"
            data-testid="slider-volume"
          />
        </div>
      </div>
    </div>
  );
}
