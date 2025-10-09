import { useState } from "react";
import { useLocation } from "wouter";
import { UserPlus } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ListeningRoom } from "@shared/schema";

export function JoinRoomDialog() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: rooms, isLoading } = useQuery<ListeningRoom[]>({
    queryKey: ["/api/rooms"],
    enabled: open,
  });

  const handleJoin = async (roomId: string) => {
    try {
      const userId = `user-${Math.random().toString(36).slice(2, 11)}`;
      const username = `User-${userId.slice(-4)}`;

      await apiRequest("POST", `/api/rooms/${roomId}/join`, {
        userId,
        username,
      });

      setOpen(false);
      navigate(`/room/${roomId}?userId=${userId}&username=${username}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join room. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-join-room">
          <UserPlus className="h-4 w-4" />
          Join Room
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="dialog-join-room">
        <DialogHeader>
          <DialogTitle>Join Listening Room</DialogTitle>
          <DialogDescription>
            Choose an active listening room to join and enjoy music together.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading rooms...
            </div>
          ) : rooms && rooms.length > 0 ? (
            <div className="space-y-2">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className="p-4 hover-elevate cursor-pointer"
                  onClick={() => handleJoin(room.id)}
                  data-testid={`room-card-${room.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{room.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {room.isPlaying ? "Now playing" : "Paused"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Join
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active rooms available. Create one to get started!
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
