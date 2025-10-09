import { useState } from "react";
import { useLocation } from "wouter";
import { Music2 } from "lucide-react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function CreateRoomDialog() {
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!roomName.trim()) return;

    setLoading(true);
    try {
      const userId = `user-${Math.random().toString(36).slice(2, 11)}`;
      const username = `User-${userId.slice(-4)}`;

      const res = await apiRequest("POST", "/api/rooms", {
        name: roomName,
        hostId: userId,
        hostUsername: username,
      });

      const room = await res.json();

      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      
      toast({
        title: "Room created!",
        description: `Your listening room "${roomName}" is ready.`,
      });

      setOpen(false);
      setRoomName("");
      navigate(`/room/${room.id}?userId=${userId}&username=${username}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="gap-2"
          data-testid="button-create-room"
        >
          <Music2 className="h-4 w-4" />
          Create Listening Room
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="dialog-create-room">
        <DialogHeader>
          <DialogTitle>Create Listening Room</DialogTitle>
          <DialogDescription>
            Start a collaborative listening session with friends. Share music together in real-time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              placeholder="My Awesome Playlist"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleCreate();
                }
              }}
              data-testid="input-room-name"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={!roomName.trim() || loading}
            data-testid="button-submit-create-room"
          >
            {loading ? "Creating..." : "Create Room"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
