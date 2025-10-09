import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { mockTracks } from "@/lib/mockData";

export function CreateVibeDialog() {
  const [open, setOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(mockTracks[0]);
  const [startTime, setStartTime] = useState(0);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const currentUserId = "current-user";

  const createVibeMutation = useMutation({
    mutationFn: async () => {
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
              value={selectedTrack.id}
              onChange={(e) => {
                const track = mockTracks.find(t => t.id === e.target.value);
                if (track) setSelectedTrack(track);
              }}
              data-testid="select-track"
            >
              {mockTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.title} - {track.artist}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-time">
              Start Time: {formatTime(startTime)} (30 seconds will play)
            </Label>
            <Slider
              id="start-time"
              value={[startTime]}
              onValueChange={([value]) => setStartTime(value)}
              max={180}
              step={5}
              data-testid="slider-start-time"
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
                  Preview: {formatTime(startTime)} - {formatTime(startTime + 30)}
                </p>
              </div>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={() => createVibeMutation.mutate()}
            disabled={createVibeMutation.isPending}
            data-testid="button-post-vibe"
          >
            <Zap className="h-4 w-4" />
            {createVibeMutation.isPending ? "Posting..." : "Post Vibe (24h)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
