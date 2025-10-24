import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Play, Clock, Zap, Trash2, Pause, RefreshCw, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatDistanceToNow } from "date-fns";
import { CreateVibeDialog } from "@/components/CreateVibeDialog";

interface VibeUser {
  id: string;
  username: string;
}

interface VibeReaction {
  id: string;
  userId: string;
  reactionType: string;
}

interface VibeComment {
  id: string;
  userId: string;
  username: string;
  comment: string;
  createdAt: string;
}

interface VibeShareRequest {
  id: string;
  requesterId: string;
  requesterUsername: string;
  status: string;
}

interface Vibe {
  id: string;
  userId: string;
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  trackAlbumCover: string;
  startTime: number;
  message: string | null;
  createdAt: string;
  expiresAt: string;
  user: VibeUser | null;
  reactions: VibeReaction[];
  comments: VibeComment[];
  shareRequests: VibeShareRequest[];
}

export default function Vibes() {
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [playingVibeId, setPlayingVibeId] = useState<string | null>(null);
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();
  const currentUserId = "current-user";
  const vibeAudioRef = useRef<HTMLAudioElement | null>(null);
  const vibeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: vibes = [], refetch: refetchVibes, isFetching } = useQuery<Vibe[]>({
    queryKey: [`/api/vibes/friends/${currentUserId}`],
    refetchInterval: 30000,
  });

  // Initialize vibe preview audio
  useEffect(() => {
    if (!vibeAudioRef.current) {
      vibeAudioRef.current = new Audio();
      vibeAudioRef.current.preload = 'metadata';
      
      vibeAudioRef.current.addEventListener('ended', () => {
        setPlayingVibeId(null);
        if (vibeIntervalRef.current) {
          clearInterval(vibeIntervalRef.current);
          vibeIntervalRef.current = null;
        }
      });
      
      vibeAudioRef.current.addEventListener('error', () => {
        setPlayingVibeId(null);
        if (vibeIntervalRef.current) {
          clearInterval(vibeIntervalRef.current);
          vibeIntervalRef.current = null;
        }
        toast({
          title: "Playback Error",
          description: "Could not play vibe preview",
          variant: "destructive"
        });
      });
    }

    return () => {
      if (vibeAudioRef.current) {
        vibeAudioRef.current.pause();
        vibeAudioRef.current = null;
      }
      if (vibeIntervalRef.current) {
        clearInterval(vibeIntervalRef.current);
        vibeIntervalRef.current = null;
      }
    };
  }, [toast]);

  const addReactionMutation = useMutation({
    mutationFn: async ({ vibeId, reactionType }: { vibeId: string; reactionType: string }) =>
      apiRequest("POST", `/api/vibes/${vibeId}/reactions`, { vibeId, userId: currentUserId, reactionType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vibes/friends/${currentUserId}`] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ vibeId, comment }: { vibeId: string; comment: string }) =>
      apiRequest("POST", `/api/vibes/${vibeId}/comments`, { vibeId, userId: currentUserId, username: "You", comment }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/vibes/friends/${currentUserId}`] });
      setCommentText(prev => ({ ...prev, [variables.vibeId]: "" }));
      toast({ title: "Comment added!" });
    },
  });

  const requestShareMutation = useMutation({
    mutationFn: async (vibeId: string) =>
      apiRequest("POST", `/api/vibes/${vibeId}/share-requests`, {
        vibeId,
        requesterId: currentUserId,
        requesterUsername: "You",
        status: "pending",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vibes/friends/${currentUserId}`] });
      toast({ title: "Share request sent!", description: "The user will receive your request to listen to the full track" });
    },
  });

  const deleteVibeMutation = useMutation({
    mutationFn: async (vibeId: string) =>
      apiRequest("DELETE", `/api/vibes/${vibeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vibes/friends/${currentUserId}`] });
      // Force a refetch to ensure the UI updates
      queryClient.refetchQueries({ queryKey: [`/api/vibes/friends/${currentUserId}`] });
      toast({ title: "Vibe deleted!", description: "Your vibe has been removed" });
    },
    onError: (error) => {
      console.error('Delete vibe error:', error);
      toast({ 
        title: "Delete failed", 
        description: "Could not delete the vibe. Please try again or refresh the page.",
        variant: "destructive"
      });
    },
  });

  const handlePlaySnippet = async (vibe: Vibe) => {
    if (!vibeAudioRef.current) return;

    try {
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      };

      // If already playing this vibe, stop it
      if (playingVibeId === vibe.id) {
        vibeAudioRef.current.pause();
        setPlayingVibeId(null);
        if (vibeIntervalRef.current) {
          clearInterval(vibeIntervalRef.current);
          vibeIntervalRef.current = null;
        }
        return;
      }

      // Stop any currently playing vibe
      if (playingVibeId && vibeAudioRef.current) {
        vibeAudioRef.current.pause();
        if (vibeIntervalRef.current) {
          clearInterval(vibeIntervalRef.current);
          vibeIntervalRef.current = null;
        }
      }

      // Get the actual audio URL for the track from the tracks endpoint
      const response = await fetch('/api/audio/tracks');
      const data = await response.json();
      
      if (!data.success || !data.tracks) {
        throw new Error('Could not get tracks');
      }
      
      const track = data.tracks.find((t: any) => t.id === vibe.trackId);
      if (!track) {
        throw new Error('Track not found');
      }
      
      const audioUrl = track.audioUrl || track.hdAudioUrl;
      if (!audioUrl) {
        throw new Error('No audio URL found for track');
      }
      
      if (vibeAudioRef.current.src !== audioUrl) {
        vibeAudioRef.current.src = audioUrl;
      }
      
      vibeAudioRef.current.currentTime = vibe.startTime;
      vibeAudioRef.current.volume = 1;
      
      await vibeAudioRef.current.play();
      setPlayingVibeId(vibe.id);
      
      // Start tracking for 30-second limit
      if (vibeIntervalRef.current) {
        clearInterval(vibeIntervalRef.current);
      }
      
      // Capture the vibe ID in the interval closure
      const currentVibeId = vibe.id;
      const startTime = vibe.startTime;
      
      vibeIntervalRef.current = setInterval(() => {
        if (vibeAudioRef.current) {
          const currentTime = vibeAudioRef.current.currentTime;
          const elapsed = currentTime - startTime;
          
          // Start fade-out at 50 seconds (10 seconds before end) for very smooth transition
          if (elapsed >= 50 && elapsed < 60) {
            const fadeProgress = (elapsed - 50) / 10; // Fade over 10 seconds
            // Use exponential fade for smoother transition
            const volume = Math.max(0, Math.pow(1 - fadeProgress, 2));
            vibeAudioRef.current.volume = volume;
          }
          
          // Stop after 60 seconds
          if (elapsed >= 60) {
            vibeAudioRef.current.pause();
            vibeAudioRef.current.volume = 1;
            setPlayingVibeId(null);
            if (vibeIntervalRef.current) {
              clearInterval(vibeIntervalRef.current);
              vibeIntervalRef.current = null;
            }
          }
        }
      }, 25); // Check even more frequently for ultra-smooth transitions
      
      toast({
        title: "Playing vibe preview",
        description: `${vibe.trackTitle} - ${formatTime(vibe.startTime)} to ${formatTime(vibe.startTime + 60)}`,
      });
    } catch (error) {
      console.error('Error playing vibe:', error);
      setPlayingVibeId(null);
      toast({
        title: "Playback Error",
        description: "Could not play vibe preview",
        variant: "destructive"
      });
    }
  };

  const hasUserReacted = (vibe: Vibe, reactionType: string) => {
    return vibe.reactions.some(r => r.userId === currentUserId && r.reactionType === reactionType);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const hoursLeft = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
    return `${hoursLeft}h left`;
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <h1 className="font-display text-2xl md:text-4xl font-bold" data-testid="text-page-title">
              Vibes
            </h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            60-second music moments from your friends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchVibes()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <CreateVibeDialog />
        </div>
      </div>

      {/* Friends Vibes Container */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Friends & Your Vibes</h2>
        {vibes.length === 0 ? (
          <Card className="p-6 text-center">
            <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-2">No vibes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share a 30-second music highlight with your friends!
            </p>
          </Card>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {vibes.map((vibe) => (
              <Card
                key={vibe.id}
                className={`min-w-[280px] overflow-hidden ${vibe.userId === currentUserId ? "ring-1 ring-primary/50 bg-primary/5" : ""}`}
                data-testid={`card-vibe-${vibe.id}`}
              >
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {vibe.user?.username.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-xs flex items-center gap-1">
                          {vibe.user?.username || "Unknown"}
                          {vibe.userId === currentUserId && (
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary border border-primary/20">You</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(vibe.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {vibe.userId === currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteVibeMutation.mutate(vibe.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        data-testid={`button-delete-vibe-${vibe.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={vibe.trackAlbumCover}
                      alt={vibe.trackTitle}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <Button
                        size="icon"
                        className="h-10 w-10 rounded-full mb-2"
                        onClick={() => handlePlaySnippet(vibe)}
                        data-testid={`button-play-vibe-${vibe.id}`}
                      >
                        {playingVibeId === vibe.id ? (
                          <Pause className="h-4 w-4 fill-current" />
                        ) : (
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        )}
                      </Button>
                      <p className="text-white font-semibold text-xs">{vibe.trackTitle}</p>
                      <p className="text-white/80 text-xs">{vibe.trackArtist}</p>
                    </div>
                  </div>
                  {vibe.message && (
                    <div className="p-3 bg-muted/30">
                      <p className="text-xs">{vibe.message}</p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-3 flex-col gap-2">
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 ${hasUserReacted(vibe, "heart") ? "text-red-500" : ""}`}
                      onClick={() => addReactionMutation.mutate({ vibeId: vibe.id, reactionType: "heart" })}
                      disabled={addReactionMutation.isPending}
                      data-testid={`button-react-vibe-${vibe.id}`}
                    >
                      <Heart className={`h-3 w-3 mr-1 ${hasUserReacted(vibe, "heart") ? "fill-current" : ""}`} />
                      {vibe.reactions.filter(r => r.reactionType === "heart").length || ""}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      data-testid={`button-comment-toggle-${vibe.id}`}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {vibe.comments.length || ""}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        // Share functionality - copy link or share to social media
                        navigator.clipboard.writeText(window.location.href);
                        toast({ title: "Link copied!", description: "Vibe link copied to clipboard" });
                      }}
                      data-testid={`button-share-${vibe.id}`}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => requestShareMutation.mutate(vibe.id)}
                      disabled={vibe.userId === currentUserId || requestShareMutation.isPending}
                      data-testid={`button-request-full-${vibe.id}`}
                      title="Request full track"
                    >
                      <Music className="h-3 w-3" />
                    </Button>
                  </div>

                  {vibe.comments.length > 0 && (
                    <div className="w-full space-y-1">
                      {vibe.comments.slice(0, 2).map((comment) => (
                        <div key={comment.id} className="text-xs">
                          <span className="font-medium">{comment.username}</span>
                          <span className="text-muted-foreground ml-2">{comment.comment}</span>
                        </div>
                      ))}
                      {vibe.comments.length > 2 && (
                        <p className="text-xs text-muted-foreground">+{vibe.comments.length - 2} more</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1 w-full">
                    <Input
                      placeholder="Comment..."
                      value={commentText[vibe.id] || ""}
                      onChange={(e) => setCommentText(prev => ({ ...prev, [vibe.id]: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && commentText[vibe.id]?.trim()) {
                          addCommentMutation.mutate({ vibeId: vibe.id, comment: commentText[vibe.id] });
                        }
                      }}
                      className="h-7 text-xs"
                      data-testid={`input-comment-${vibe.id}`}
                    />
                    <Button
                      size="sm"
                      className="h-7 px-2"
                      disabled={!commentText[vibe.id]?.trim() || addCommentMutation.isPending}
                      onClick={() => {
                        if (commentText[vibe.id]?.trim()) {
                          addCommentMutation.mutate({ vibeId: vibe.id, comment: commentText[vibe.id] });
                        }
                      }}
                      data-testid={`button-send-comment-${vibe.id}`}
                    >
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
