import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Play, Clock, Zap } from "lucide-react";
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
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();
  const currentUserId = "current-user";

  const { data: vibes = [] } = useQuery<Vibe[]>({
    queryKey: [`/api/vibes/friends/${currentUserId}`],
    refetchInterval: 30000,
  });

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

  const handlePlaySnippet = (vibe: Vibe) => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };
    
    playTrack({
      id: vibe.trackId,
      title: vibe.trackTitle,
      artist: vibe.trackArtist,
      album: "",
      duration: "0:30",
      albumCover: vibe.trackAlbumCover,
    }, vibe.startTime);
    
    toast({
      title: "Playing 30-second preview",
      description: `${vibe.trackTitle} - Starting at ${formatTime(vibe.startTime)}`,
    });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <h1 className="font-display text-2xl md:text-4xl font-bold" data-testid="text-page-title">
              Vibes
            </h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            30-second music moments from your friends
          </p>
        </div>
        <CreateVibeDialog />
      </div>

      {vibes.length === 0 ? (
        <Card className="p-8 md:p-12 text-center">
          <Zap className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold mb-2">No vibes yet</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            Share a 30-second music highlight with your friends!
          </p>
          <CreateVibeDialog />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {vibes.map((vibe) => (
            <Card key={vibe.id} className="overflow-hidden" data-testid={`card-vibe-${vibe.id}`}>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {vibe.user?.username.slice(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{vibe.user?.username || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(vibe.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {getTimeRemaining(vibe.expiresAt)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={vibe.trackAlbumCover}
                    alt={vibe.trackTitle}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <Button
                      size="icon"
                      className="h-12 w-12 rounded-full mb-2"
                      onClick={() => handlePlaySnippet(vibe)}
                      data-testid={`button-play-vibe-${vibe.id}`}
                    >
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </Button>
                    <p className="text-white font-semibold text-sm">{vibe.trackTitle}</p>
                    <p className="text-white/80 text-xs">{vibe.trackArtist}</p>
                  </div>
                </div>
                {vibe.message && (
                  <div className="p-4 bg-muted/30">
                    <p className="text-sm">{vibe.message}</p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-4 flex-col gap-3">
                <div className="flex items-center gap-2 w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={hasUserReacted(vibe, "heart") ? "text-red-500" : ""}
                    onClick={() => addReactionMutation.mutate({ vibeId: vibe.id, reactionType: "heart" })}
                    data-testid={`button-react-vibe-${vibe.id}`}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${hasUserReacted(vibe, "heart") ? "fill-current" : ""}`} />
                    {vibe.reactions.filter(r => r.reactionType === "heart").length || ""}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid={`button-comment-toggle-${vibe.id}`}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {vibe.comments.length || ""}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => requestShareMutation.mutate(vibe.id)}
                    disabled={vibe.userId === currentUserId}
                    data-testid={`button-request-share-${vibe.id}`}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Request Full Track
                  </Button>
                </div>

                {vibe.comments.length > 0 && (
                  <div className="w-full space-y-2">
                    {vibe.comments.map((comment) => (
                      <div key={comment.id} className="text-sm">
                        <span className="font-medium">{comment.username}</span>
                        <span className="text-muted-foreground ml-2">{comment.comment}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 w-full">
                  <Input
                    placeholder="Add a comment..."
                    value={commentText[vibe.id] || ""}
                    onChange={(e) => setCommentText(prev => ({ ...prev, [vibe.id]: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && commentText[vibe.id]?.trim()) {
                        addCommentMutation.mutate({ vibeId: vibe.id, comment: commentText[vibe.id] });
                      }
                    }}
                    data-testid={`input-comment-${vibe.id}`}
                  />
                  <Button
                    size="icon"
                    disabled={!commentText[vibe.id]?.trim() || addCommentMutation.isPending}
                    onClick={() => {
                      if (commentText[vibe.id]?.trim()) {
                        addCommentMutation.mutate({ vibeId: vibe.id, comment: commentText[vibe.id] });
                      }
                    }}
                    data-testid={`button-send-comment-${vibe.id}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
