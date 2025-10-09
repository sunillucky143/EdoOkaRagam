import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  ChevronLeft,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ParticipantsList } from "@/components/ParticipantsList";
import { TrackRow } from "@/components/TrackRow";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { mockTracks } from "@/lib/mockData";
import type { ListeningRoom as Room, RoomParticipant } from "@shared/schema";

export default function ListeningRoom() {
  const [, params] = useRoute("/room/:roomId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const userId = searchParams.get("userId") || "";
  const username = searchParams.get("username") || "";

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [queue, setQueue] = useState(mockTracks.slice(0, 5));
  const [currentTrack, setCurrentTrack] = useState(mockTracks[0]);

  const { data: room } = useQuery<Room>({
    queryKey: ["/api/rooms", params?.roomId],
  });

  const { isConnected, lastMessage, sendMessage } = useWebSocket(
    params?.roomId || null,
  );

  useEffect(() => {
    if (isConnected && params?.roomId) {
      sendMessage({
        type: "join_room",
        roomId: params.roomId,
        userId,
        username,
      });
    }
  }, [isConnected, params?.roomId, userId, username, sendMessage]);

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "room_state":
        setParticipants(lastMessage.participants || []);
        setQueue(lastMessage.queue || mockTracks.slice(0, 5));
        if (lastMessage.room) {
          setIsPlaying(lastMessage.room.isPlaying || false);
          setProgress(lastMessage.room.currentPosition || 0);
        }
        break;

      case "participant_joined":
        if (lastMessage.participants) {
          setParticipants(lastMessage.participants);
        }
        toast({
          title: "New participant",
          description: `${lastMessage.participant.username} joined the room`,
        });
        break;

      case "participant_left":
        if (lastMessage.participants) {
          setParticipants(lastMessage.participants);
        }
        toast({
          title: "Participant left",
          description: "A participant left the room",
        });
        break;

      case "play":
        setIsPlaying(true);
        break;

      case "pause":
        setIsPlaying(false);
        break;

      case "seek":
        setProgress(lastMessage.position);
        break;

      case "permissions_updated":
        setParticipants(lastMessage.participants || []);
        break;

      case "queue_updated":
        setQueue(lastMessage.queue || []);
        break;
    }
  }, [lastMessage, toast]);

  const handlePlayPause = () => {
    sendMessage({ type: isPlaying ? "pause" : "play" });
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    sendMessage({ type: "seek", position: value[0] });
    setProgress(value[0]);
  };

  const handleTogglePermissions = async (
    targetUserId: string,
    canControl: boolean,
  ) => {
    try {
      await apiRequest("POST", `/api/rooms/${params?.roomId}/permissions`, {
        userId: targetUserId,
        canControl,
      });

      sendMessage({
        type: "update_permissions",
        userId: targetUserId,
        canControl,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  const copyRoomLink = () => {
    const link = window.location.href.split("?")[0];
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Share this link with friends to invite them",
    });
  };

  if (!room) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading room...</p>
      </div>
    );
  }

  const currentParticipant = participants.find((p) => p.userId === userId);
  const canControl =
    currentParticipant?.canControl || room.hostId === userId;

  return (
    <div className="h-full overflow-auto pb-8">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Home
          </Button>
          <Button
            variant="outline"
            onClick={copyRoomLink}
            data-testid="button-copy-link"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Invite Link
          </Button>
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold mb-2">
            {room.name}
          </h1>
          <p className="text-muted-foreground">
            {isConnected ? "Connected" : "Connecting..."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-6 mb-6">
                <img
                  src={currentTrack.albumCover}
                  alt={currentTrack.title}
                  className="h-32 w-32 rounded-md"
                />
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-semibold mb-1">
                    {currentTrack.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    disabled={!canControl}
                    data-testid="button-previous"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>

                  <Button
                    size="icon"
                    className="h-14 w-14 rounded-full"
                    onClick={handlePlayPause}
                    disabled={!canControl}
                    data-testid="button-play-pause"
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6 fill-current" />
                    ) : (
                      <Play className="h-6 w-6 fill-current ml-0.5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    disabled={!canControl}
                    data-testid="button-next"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    1:24
                  </span>
                  <Slider
                    value={[progress]}
                    onValueChange={handleSeek}
                    className="flex-1"
                    disabled={!canControl}
                    data-testid="slider-progress"
                  />
                  <span className="text-sm text-muted-foreground w-12">
                    3:45
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <Slider
                    value={[volume]}
                    onValueChange={([value]) => setVolume(value)}
                    className="w-32"
                    data-testid="slider-volume"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Queue</h3>
              <div className="space-y-1">
                {queue.map((track, index) => (
                  <TrackRow
                    key={track.id}
                    {...track}
                    number={index + 1}
                    isPlaying={index === 0}
                  />
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <ParticipantsList
              participants={participants}
              hostId={room.hostId}
              currentUserId={userId}
              onTogglePermissions={handleTogglePermissions}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
