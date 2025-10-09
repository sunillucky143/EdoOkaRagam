import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CollaborativePlaylistDialogProps {
  trigger?: React.ReactNode;
}

interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: string;
  friend: { id: string; username: string } | null;
}

export function CollaborativePlaylistDialog({ trigger }: CollaborativePlaylistDialogProps) {
  const [open, setOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const { toast } = useToast();
  const currentUserId = "current-user";

  const { data: friendships = [] } = useQuery<Friend[]>({
    queryKey: [`/api/friendships/${currentUserId}`],
    enabled: open,
  });

  const acceptedFriends = friendships.filter(f => f.status === "accepted");

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreate = () => {
    if (!playlistName.trim()) {
      toast({ title: "Please enter a playlist name", variant: "destructive" });
      return;
    }

    toast({
      title: "Collaborative playlist created!",
      description: `"${playlistName}" shared with ${selectedFriends.length} friend${selectedFriends.length !== 1 ? 's' : ''}`,
    });
    setOpen(false);
    setPlaylistName("");
    setSelectedFriends([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" data-testid="button-create-collaborative-playlist">
            <Users className="h-4 w-4 mr-2" />
            Create Collaborative Playlist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent data-testid="dialog-collaborative-playlist">
        <DialogHeader>
          <DialogTitle>Create Collaborative Playlist</DialogTitle>
          <DialogDescription>
            Create a playlist you can edit together with friends
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Playlist Name</label>
            <Input
              placeholder="My Awesome Playlist"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              data-testid="input-collaborative-playlist-name"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Invite friends to collaborate:</p>
            {acceptedFriends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No friends to invite. Add friends first!
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
                        data-testid={`checkbox-collab-${friendship.friend?.username}`}
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
              data-testid="button-cancel-collaborative"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!playlistName.trim()}
              data-testid="button-create-collab-confirm"
            >
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
