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
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface AudioPlayerProps {
  onQueueClick?: () => void;
}

export function AudioPlayer({ onQueueClick }: AudioPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    shuffle,
    repeat,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const formatTime = (percentage: number) => {
    const totalSeconds = Math.floor((percentage / 100) * 225);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="px-3 pt-2 pb-1">
          <Slider
            value={[progress]}
            onValueChange={([value]) => seekTo(value)}
            className="w-full"
            data-testid="slider-progress"
          />
        </div>
        <div className="px-3 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img
              src={currentTrack.albumCover}
              alt={currentTrack.title}
              className="h-12 w-12 rounded-md flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate" data-testid="text-player-title">
                {currentTrack.title}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {currentTrack.artist}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={previousTrack}
              data-testid="button-previous"
            >
              <SkipBack className="h-4 w-4 fill-current" />
            </Button>
            <Button
              size="icon"
              className="h-9 w-9 rounded-full bg-primary hover:bg-primary"
              onClick={togglePlayPause}
              data-testid="button-play-pause"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={nextTrack}
              data-testid="button-next"
            >
              <SkipForward className="h-4 w-4 fill-current" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block h-24">
        <div className="h-full px-4 flex items-center gap-4">
          <div className="flex items-center gap-3 w-64">
            <img
              src={currentTrack.albumCover}
              alt={currentTrack.title}
              className="h-14 w-14 rounded-md"
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate" data-testid="text-player-title">
                {currentTrack.title}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {currentTrack.artist}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${shuffle ? "text-chart-2" : ""}`}
                onClick={toggleShuffle}
                data-testid="button-shuffle"
              >
                <Shuffle className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={previousTrack}
                data-testid="button-previous"
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </Button>

              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-primary hover:bg-primary"
                onClick={togglePlayPause}
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
                onClick={nextTrack}
                data-testid="button-next"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${repeat ? "text-chart-2" : ""}`}
                onClick={toggleRepeat}
                data-testid="button-repeat"
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-full flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(progress)}
              </span>
              <Slider
                value={[progress]}
                onValueChange={([value]) => seekTo(value)}
                className="flex-1"
                data-testid="slider-progress"
              />
              <span className="text-xs text-muted-foreground w-10">
                {currentTrack.duration}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-64 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onQueueClick}
              data-testid="button-queue"
            >
              <ListMusic className="h-5 w-5" />
            </Button>
            <Volume2 className="h-5 w-5 text-muted-foreground" />
            <Slider
              value={[volume]}
              onValueChange={([value]) => setVolume(value)}
              className="w-24"
              data-testid="slider-volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
