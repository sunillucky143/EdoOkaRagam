import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Zap, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { audioService } from "@/lib/audioService";

export function CreateVibeDialog() {
  const [open, setOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [startTime, setStartTime] = useState(0);
  const [message, setMessage] = useState("");
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const { toast } = useToast();
  const currentUserId = "current-user";
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch tracks from server
  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => audioService.getAllTracks(),
  });

  // Set first track as selected when tracks are loaded
  useEffect(() => {
    if (tracks.length > 0 && !selectedTrack) {
      setSelectedTrack(tracks[0]);
    }
  }, [tracks, selectedTrack]);

  // Reset preview state when dialog closes
  useEffect(() => {
    if (!open) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.volume = 1; // Reset volume
      }
      setIsPreviewPlaying(false);
      setPreviewProgress(0);
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
        previewIntervalRef.current = null;
      }
    }
  }, [open]);

  // Initialize preview audio
  useEffect(() => {
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio();
      previewAudioRef.current.preload = 'metadata';
      
      previewAudioRef.current.addEventListener('ended', () => {
        setIsPreviewPlaying(false);
        setPreviewProgress(0);
        previewAudioRef.current!.volume = 1; // Reset volume
        if (previewIntervalRef.current) {
          clearInterval(previewIntervalRef.current);
          previewIntervalRef.current = null;
        }
      });
      
      previewAudioRef.current.addEventListener('error', () => {
        setIsPreviewPlaying(false);
        setPreviewProgress(0);
        previewAudioRef.current!.volume = 1; // Reset volume
        if (previewIntervalRef.current) {
          clearInterval(previewIntervalRef.current);
          previewIntervalRef.current = null;
        }
        toast({
          title: "Preview Error",
          description: "Could not load audio preview",
          variant: "destructive"
        });
      });
    }

    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
        previewIntervalRef.current = null;
      }
    };
  }, [toast]);

  const createVibeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTrack) {
        throw new Error("No track selected");
      }
      
      return apiRequest("POST", "/api/vibes", {
        userId: currentUserId,
        trackId: selectedTrack.id,
        trackTitle: selectedTrack.title,
        trackArtist: selectedTrack.artist,
        trackAlbumCover: selectedTrack.albumCover,
        startTime,
        message: message || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vibes/friends/${currentUserId}`] });
      toast({
        title: "Vibe posted!",
        description: "Your 30-second music moment is live for 24 hours",
      });
      setOpen(false);
      setStartTime(0);
      setMessage("");
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const parseDuration = (duration: string) => {
    // Parse duration string like "3:45" or "2:30" to seconds
    const parts = duration.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      return minutes * 60 + seconds;
    }
    // If it's just a number, assume it's already in seconds
    return parseInt(duration, 10) || 0;
  };

  const togglePreview = async () => {
    if (!selectedTrack || !previewAudioRef.current) return;

    try {
      if (isPreviewPlaying) {
        // Pause preview
        previewAudioRef.current.pause();
        previewAudioRef.current.volume = 1; // Reset volume
        setIsPreviewPlaying(false);
        setPreviewProgress(0);
        if (previewIntervalRef.current) {
          clearInterval(previewIntervalRef.current);
          previewIntervalRef.current = null;
        }
      } else {
        // Play preview
        if (previewAudioRef.current.src !== selectedTrack.audioUrl) {
          previewAudioRef.current.src = selectedTrack.audioUrl;
        }
        
        previewAudioRef.current.currentTime = startTime;
        previewAudioRef.current.volume = 1; // Ensure full volume at start
        setPreviewProgress(0);
        
        await previewAudioRef.current.play();
        setIsPreviewPlaying(true);
        
        // Start progress tracking
        if (previewIntervalRef.current) {
          clearInterval(previewIntervalRef.current);
        }
        
        previewIntervalRef.current = setInterval(() => {
          if (previewAudioRef.current) {
            const currentTime = previewAudioRef.current.currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min((elapsed / 30) * 100, 100);
            setPreviewProgress(progress);
            
            // Start fade-out at 28 seconds (2 seconds before end)
            if (elapsed >= 28 && elapsed < 30) {
              const fadeProgress = (elapsed - 28) / 2; // 0 to 1 over 2 seconds
              const volume = 1 - fadeProgress;
              previewAudioRef.current.volume = Math.max(0, volume);
            }
            
            // Stop after 30 seconds
            if (elapsed >= 30) {
              previewAudioRef.current.pause();
              previewAudioRef.current.volume = 1; // Reset volume for next play
              setIsPreviewPlaying(false);
              setPreviewProgress(0);
              if (previewIntervalRef.current) {
                clearInterval(previewIntervalRef.current);
                previewIntervalRef.current = null;
              }
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error playing preview:', error);
      setIsPreviewPlaying(false);
      setPreviewProgress(0);
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
        previewIntervalRef.current = null;
      }
      toast({
        title: "Preview Error",
        description: "Could not play audio preview",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-create-vibe">
          <Zap className="h-4 w-4" />
          Create Vibe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a Vibe</DialogTitle>
          <DialogDescription>
            Share a 30-second music highlight with your friends. It'll disappear after 24 hours!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="track">Select Track</Label>
            <select
              id="track"
              className="w-full p-2 rounded-md border bg-background"
              value={selectedTrack?.id || ""}
              onChange={(e) => {
                const track = tracks.find(t => t.id === e.target.value);
                if (track) setSelectedTrack(track);
              }}
              data-testid="select-track"
              disabled={tracksLoading || tracks.length === 0}
            >
              {tracksLoading ? (
                <option value="">Loading tracks...</option>
              ) : tracks.length === 0 ? (
                <option value="">No tracks available. Upload some music first!</option>
              ) : (
                tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title} - {track.artist}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-time">
              Start Time: {formatTime(startTime)} (60 seconds will play)
            </Label>
            <Slider
              id="start-time"
              value={[startTime]}
              onValueChange={([value]) => setStartTime(value)}
                max={selectedTrack ? Math.max(0, parseDuration(selectedTrack.duration) - 60) : 120}
              step={5}
              data-testid="slider-start-time"
              disabled={!selectedTrack}
            />
            <p className="text-xs text-muted-foreground">
              Choose where your 30-second preview should start
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="What's the vibe? Add a caption..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              data-testid="input-message"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/200
            </p>
          </div>

          {selectedTrack && (
            <div className="bg-muted/30 p-4 rounded-md">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTrack.albumCover}
                  alt={selectedTrack.title}
                  className="h-16 w-16 rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedTrack.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedTrack.artist}</p>
                  <p className="text-xs text-primary mt-1">
                    Preview: {formatTime(startTime)} - {formatTime(startTime + 60)}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-100 ease-out"
                      style={{ width: `${previewProgress}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePreview}
                  disabled={!selectedTrack.audioUrl}
                  className="gap-2"
                >
                  {isPreviewPlaying ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Stop Preview
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Play Preview
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <Button
            className="w-full gap-2"
            onClick={() => createVibeMutation.mutate()}
            disabled={createVibeMutation.isPending || !selectedTrack || tracks.length === 0}
            data-testid="button-post-vibe"
          >
            <Zap className="h-4 w-4" />
            {createVibeMutation.isPending ? "Posting..." : tracks.length === 0 ? "No Tracks Available" : "Post Vibe (24h)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
