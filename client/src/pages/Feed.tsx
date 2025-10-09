import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Play, Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatDistanceToNow } from "date-fns";

interface MusicActivity {
  id: string;
  userId: string;
  activityType: string;
  trackId: string | null;
  trackTitle: string | null;
  trackArtist: string | null;
  trackAlbum: string | null;
  trackAlbumCover: string | null;
  message: string | null;
  createdAt: string;
  user: { id: string; username: string } | null;
  reactions: Array<{ id: string; userId: string; reactionType: string }>;
  comments: Array<{ id: string; userId: string; username: string; comment: string; createdAt: string }>;
}

interface AIRecommendation {
  trackTitle: string;
  artist: string;
  reason: string;
  mood: string;
}

export default function Feed() {
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showAI, setShowAI] = useState(false);
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();
  const currentUserId = "current-user";

  const { data: activities = [] } = useQuery<MusicActivity[]>({
    queryKey: [`/api/activities/friends/${currentUserId}`],
  });

  const { data: aiRecommendations, refetch: getAIRecommendations } = useQuery<{ recommendations: AIRecommendation[] }>({
    queryKey: ["/api/ai/recommendations"],
    enabled: false,
  });

  const addReactionMutation = useMutation({
    mutationFn: async ({ activityId, reactionType }: { activityId: string; reactionType: string }) =>
      apiRequest("POST", `/api/activities/${activityId}/reactions`, { activityId, userId: currentUserId, reactionType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/activities/friends/${currentUserId}`] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ activityId, comment }: { activityId: string; comment: string }) =>
      apiRequest("POST", `/api/activities/${activityId}/comments`, { activityId, userId: currentUserId, username: "You", comment }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/activities/friends/${currentUserId}`] });
      setCommentText(prev => ({ ...prev, [variables.activityId]: "" }));
      toast({ title: "Comment added!" });
    },
  });

  const handleGetAIRecommendations = async () => {
    const recentMessages = activities
      .slice(0, 10)
      .filter(a => a.message)
      .map(a => ({
        username: a.user?.username || "User",
        message: a.message || "",
        timestamp: new Date(a.createdAt),
      }));

    const recentTracks = activities
      .slice(0, 10)
      .filter(a => a.trackTitle && a.trackArtist)
      .map(a => ({
        title: a.trackTitle!,
        artist: a.trackArtist!,
        album: a.trackAlbum || "",
      }));

    try {
      await apiRequest("POST", "/api/ai/recommendations", { messages: recentMessages, recentTracks, count: 5 });
      await getAIRecommendations();
      setShowAI(true);
      toast({ title: "AI recommendations generated!", description: "Check out personalized music suggestions based on your activity" });
    } catch (error) {
      toast({ title: "Failed to generate recommendations", variant: "destructive" });
    }
  };

  const handlePlayTrack = (activity: MusicActivity) => {
    if (activity.trackId && activity.trackTitle && activity.trackArtist) {
      playTrack({
        id: activity.trackId,
        title: activity.trackTitle,
        artist: activity.trackArtist,
        album: activity.trackAlbum || "",
        duration: "3:45",
        albumCover: activity.trackAlbumCover || "",
      });
    }
  };

  const hasUserReacted = (activity: MusicActivity, reactionType: string) => {
    return activity.reactions.some(r => r.userId === currentUserId && r.reactionType === reactionType);
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-4xl font-bold mb-2" data-testid="text-page-title">
            Activity Feed
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            See what your friends are listening to
          </p>
        </div>
        <Button onClick={handleGetAIRecommendations} data-testid="button-ai-recommendations" className="w-full sm:w-auto">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Recommendations
        </Button>
      </div>

      {showAI && aiRecommendations?.recommendations && aiRecommendations.recommendations.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">AI Music Recommendations</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiRecommendations.recommendations.map((rec, index) => (
              <div key={index} className="p-3 rounded-md bg-background/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{rec.trackTitle}</p>
                    <p className="text-sm text-muted-foreground">{rec.artist}</p>
                    <p className="text-sm mt-2">{rec.reason}</p>
                  </div>
                  <Badge variant="secondary">{rec.mood}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No activity yet. Add friends to see their music updates!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id} data-testid={`activity-${activity.id}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {activity.user?.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{activity.user?.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {activity.message && (
                  <p className="text-base">{activity.message}</p>
                )}

                {activity.trackTitle && (
                  <div className="flex items-center gap-4 p-4 rounded-md bg-muted/50">
                    {activity.trackAlbumCover && (
                      <img
                        src={activity.trackAlbumCover}
                        alt={activity.trackAlbum || ""}
                        className="h-16 w-16 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{activity.trackTitle}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.trackArtist}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handlePlayTrack(activity)}
                      data-testid={`button-play-${activity.id}`}
                    >
                      <Play className="h-5 w-5" />
                    </Button>
                  </div>
                )}

                {activity.comments.length > 0 && (
                  <div className="space-y-2">
                    {activity.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {comment.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{comment.username}</p>
                          <p className="text-sm text-muted-foreground">{comment.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <div className="flex items-center gap-2 w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addReactionMutation.mutate({ activityId: activity.id, reactionType: "like" })}
                    className={hasUserReacted(activity, "like") ? "text-chart-2" : ""}
                    data-testid={`button-like-${activity.id}`}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${hasUserReacted(activity, "like") ? "fill-current" : ""}`} />
                    {activity.reactions.filter(r => r.reactionType === "like").length || "Like"}
                  </Button>
                  <Button variant="ghost" size="sm" data-testid={`button-comment-${activity.id}`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {activity.comments.length || "Comment"}
                  </Button>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <Input
                    placeholder="Add a comment..."
                    value={commentText[activity.id] || ""}
                    onChange={(e) => setCommentText(prev => ({ ...prev, [activity.id]: e.target.value }))}
                    data-testid={`input-comment-${activity.id}`}
                  />
                  <Button
                    size="icon"
                    disabled={!commentText[activity.id]?.trim() || addCommentMutation.isPending}
                    onClick={() => addCommentMutation.mutate({ activityId: activity.id, comment: commentText[activity.id] })}
                    data-testid={`button-send-comment-${activity.id}`}
                  >
                    <Send className="h-4 w-4" />
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
