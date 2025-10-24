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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ParticipantsList } from "@/components/ParticipantsList";
import { TrackRow } from "@/components/TrackRow";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
// Tracks are provided by room state; no static mocks
import type { ListeningRoom as Room, RoomParticipant } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [addSongsOpen, setAddSongsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});

  const { data: room } = useQuery<Room>({
    queryKey: ["/api/rooms", params?.roomId],
  });

  const { isConnected, lastMessage, sendMessage } = useWebSocket(
    params?.roomId || null,
  );
  const { playTrack, currentTrack: playingTrack } = useAudioPlayer();

  // Load tracks only when Add Songs dialog opens
  useEffect(() => {
    if (!addSongsOpen) return;
    (async () => {
      try {
        const res = await fetch('/api/audio/tracks');
        const data = await res.json();
        setAllTracks(data.tracks || []);
      } catch {}
    })();
  }, [addSongsOpen]);

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
        {
          const newQueue = (lastMessage.queue || []).map((item: any) => ({
            id: item.trackId,
            title: item.trackTitle,
            artist: item.trackArtist,
            album: item.trackAlbum,
            duration: item.trackDuration,
            albumCover: item.trackAlbumCover,
            audioUrl: item.trackAudioUrl,
            hdAudioUrl: item.trackHDAudioUrl,
            isHD: item.isHD,
            queueId: item.id,
          }));
          setQueue(newQueue);
          // Do not auto-select; let user choose to play
        }
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
        {
          const newQueue = (lastMessage.queue || []).map((item: any) => ({
            id: item.trackId,
            title: item.trackTitle,
            artist: item.trackArtist,
            album: item.trackAlbum,
            duration: item.trackDuration,
            albumCover: item.trackAlbumCover,
            audioUrl: item.trackAudioUrl,
            hdAudioUrl: item.trackHDAudioUrl,
            isHD: item.isHD,
            queueId: item.id,
          }));
          setQueue(newQueue);
          // Keep current selection; do not auto-play first item
        }
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
    <div className="h-full overflow-auto">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            data-testid="button-back"
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Home
          </Button>
          <Button
            variant="outline"
            onClick={copyRoomLink}
            data-testid="button-copy-link"
            className="w-full sm:w-auto"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Invite Link
          </Button>
          <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" data-testid="button-create-room-playlist">Create Playlist</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Create Room Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist-name">Name</Label>
                  <Input id="playlist-name" value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} placeholder="e.g. Friday Night Bops" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setPlaylistDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => { if (!playlistName.trim()) return; toast({ title: "Playlist created", description: playlistName }); setPlaylistDialogOpen(false); setPlaylistName(""); }}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <h1 className="font-display text-2xl md:text-4xl font-bold mb-2">
            {room.name}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isConnected ? "Connected" : "Connecting..."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 mb-4 md:mb-6">
                {selectedTrack?.albumCover ? (
                  <img
                    src={selectedTrack.albumCover}
                    alt={selectedTrack.title || "Current track"}
                    className="h-24 w-24 md:h-32 md:w-32 rounded-md"
                  />
                ) : (
                  <div className="h-24 w-24 md:h-32 md:w-32 rounded-md bg-muted" />
                )}
                <div className="flex-1">
                  <h2 className="font-display text-xl md:text-2xl font-semibold mb-1">
                    {selectedTrack?.title || "No track selected"}
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {selectedTrack?.artist || ""}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Dialog open={addSongsOpen} onOpenChange={(open)=>{ setAddSongsOpen(open); if(!open){ setSelectedMap({}); setSearchQuery(""); }}}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" data-testid="button-add-songs">Add Songs</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[720px]">
                        <DialogHeader>
                          <DialogTitle>Add songs to queue</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Input placeholder="Search uploaded tracks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">Selected: {Object.values(selectedMap).filter(Boolean).length}</div>
                            <Button onClick={() => {
                              let pos = (queue[queue.length-1]?.position ?? 0);
                              const chosen = (allTracks || []).filter((t:any)=> selectedMap[t.id]);
                              for (const t of chosen) {
                                pos += 1;
                                sendMessage({ type: 'add_to_queue', track: {
                                  trackId: t.id,
                                  trackTitle: t.title,
                                  trackArtist: t.artist,
                                  trackAlbum: t.album,
                                  trackDuration: t.duration,
                                  trackAlbumCover: t.albumCover,
                                  trackAudioUrl: t.audioUrl,
                                  trackHDAudioUrl: t.hdAudioUrl,
                                  isHD: t.isHD,
                                  position: pos,
                                }});
                              }
                              setAddSongsOpen(false);
                              setSelectedMap({});
                              toast({ title: 'Added to queue', description: `${chosen.length} item(s) added` });
                            }}>Add Selected</Button>
                          </div>
                          <div className="max-h-96 overflow-auto space-y-2">
                            {(allTracks || []).filter((t:any)=>{
                              const q = searchQuery.trim().toLowerCase();
                              if (!q) return true;
                              return (t.title||'').toLowerCase().includes(q) || (t.artist||'').toLowerCase().includes(q) || (t.album||'').toLowerCase().includes(q);
                            }).map((t:any)=> (
                              <div key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-muted gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <input type="checkbox" checked={!!selectedMap[t.id]} onChange={(e)=> setSelectedMap((m)=> ({ ...m, [t.id]: e.target.checked }))} />
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{t.title}</div>
                                    <div className="text-xs text-muted-foreground truncate">{t.artist} • {t.album}</div>
                                  </div>
                                </div>
                                <Button size="sm" onClick={() => {
                                  const pos = (queue[queue.length-1]?.position ?? 0) + 1;
                                  sendMessage({ type: 'add_to_queue', track: {
                                    trackId: t.id,
                                    trackTitle: t.title,
                                    trackArtist: t.artist,
                                    trackAlbum: t.album,
                                    trackDuration: t.duration,
                                    trackAlbumCover: t.albumCover,
                                    trackAudioUrl: t.audioUrl,
                                    trackHDAudioUrl: t.hdAudioUrl,
                                    isHD: t.isHD,
                                    position: pos,
                                  }});
                                  toast({ title: 'Added to queue', description: t.title });
                                }}>Add</Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    disabled={!canControl}
                    onClick={() => {
                      if (!canControl || !selectedTrack) return;
                      sendMessage({ type: "previous" });
                      const currentIndex = queue.findIndex(t => t.id === selectedTrack.id);
                      if (currentIndex > 0) {
                        setSelectedTrack(queue[currentIndex - 1]);
                      }
                    }}
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
                    onClick={() => {
                      if (!canControl || !selectedTrack) return;
                      sendMessage({ type: "next" });
                      const currentIndex = queue.findIndex(t => t.id === selectedTrack.id);
                      if (currentIndex < queue.length - 1) {
                        setSelectedTrack(queue[currentIndex + 1]);
                      }
                    }}
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
                  <div key={track.queueId || track.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <TrackRow
                        id={track.id}
                        title={track.title}
                        artist={track.artist}
                        album={track.album}
                        duration={track.duration}
                        albumCover={track.albumCover}
                        number={index + 1}
                        isPlaying={playingTrack?.id === track.id}
                        audioUrl={track.audioUrl}
                        onPlay={() => {
                          setSelectedTrack(track);
                          playTrack({
                            id: track.id,
                            title: track.title,
                            artist: track.artist,
                            album: track.album,
                            duration: track.duration,
                            albumCover: track.albumCover,
                            audioUrl: track.audioUrl,
                            hdAudioUrl: track.hdAudioUrl,
                            isHD: track.isHD,
                          });
                        }}
                        showLike={false}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (track.queueId) {
                          // Optimistic update
                          setQueue(prev => prev.filter((q) => q.queueId !== track.queueId));
                          // Persist on server via REST (reliable even if WS drops)
                          await fetch(`/api/rooms/${params?.roomId}/queue/${track.queueId}`, { method: 'DELETE' });
                        }
                      }}
                      title="Remove from queue"
                    >
                      ×
                    </Button>
                  </div>
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
