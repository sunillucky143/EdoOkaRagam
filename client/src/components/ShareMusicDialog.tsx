import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ShareMusicDialogProps {
  track: {
    id: string;
    title: string;
    artist: string;
    album: string;
    albumCover: string;
  };
  trigger: React.ReactNode;
}

interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: string;
  friend: { id: string; username: string } | null;
}

export function ShareMusicDialog({ track, trigger }: ShareMusicDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const currentUserId = "current-user";

  const { data: friendships = [] } = useQuery<Friend[]>({
    queryKey: [`/api/friendships/${currentUserId}`],
    enabled: open,
  });

  const acceptedFriends = friendships.filter(f => f.status === "accepted");

  const shareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/activities", {
        userId: currentUserId,
        activityType: "shared_track",
        trackId: track.id,
        trackTitle: track.title,
        trackArtist: track.artist,
        trackAlbum: track.album,
        trackAlbumCover: track.albumCover,
        message: message || `Check out this song: ${track.title} by ${track.artist}`,
        sharedWith: selectedFriends,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/activities/friends/${currentUserId}`] });
      toast({ 
        title: "Track shared!",
        description: `Shared with ${selectedFriends.length} friend${selectedFriends.length !== 1 ? 's' : ''}`
      });
      setOpen(false);
      setSelectedFriends([]);
      setMessage("");
    },
  });

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent data-testid="dialog-share-music">
        <DialogHeader>
          <DialogTitle>Share Music</DialogTitle>
          <DialogDescription>
            Share "{track.title}" with your friends
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
            <img
              src={track.albumCover}
              alt={track.album}
              className="h-12 w-12 rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{track.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {track.artist}
              </p>
            </div>
          </div>

          <Textarea
            placeholder="Add a message (optional)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            data-testid="input-share-message"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium">Select friends:</p>
            {acceptedFriends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No friends to share with. Add friends first!
              </p>
            ) : (
              <div className="max-h-48 overflow-auto space-y-2">
                {acceptedFriends.map((friendship) => {
                  const friendId = friendship.friend?.id || "";
                  return (
                    <div
                      key={friendship.id}
                      className="flex items-center gap-3 p-2 rounded-md hover-elevate"
                    >
                      <Checkbox
                        checked={selectedFriends.includes(friendId)}
                        onCheckedChange={() => toggleFriend(friendId)}
                        data-testid={`checkbox-friend-${friendship.friend?.username}`}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {friendship.friend?.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{friendship.friend?.username}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-share"
            >
              Cancel
            </Button>
            <Button
              onClick={() => shareMutation.mutate()}
              disabled={selectedFriends.length === 0 || shareMutation.isPending}
              data-testid="button-confirm-share"
            >
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
