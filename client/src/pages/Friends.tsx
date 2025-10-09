import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, Check, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
}

interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: string;
  createdAt: string;
  friend: User | null;
}

export default function Friends() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const currentUserId = "current-user";

  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: [`/api/users/search?q=${encodeURIComponent(searchQuery)}&excludeUserId=${currentUserId}`],
    enabled: searchQuery.length > 2,
  });

  const { data: friendships = [] } = useQuery<Friendship[]>({
    queryKey: [`/api/friendships/${currentUserId}`],
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (friendId: string) =>
      apiRequest("POST", `/api/friendships`, { userId: currentUserId, friendId, status: "pending" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/friendships/${currentUserId}`] });
      toast({ title: "Friend request sent!" });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) =>
      apiRequest("PATCH", `/api/friendships/${friendshipId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/friendships/${currentUserId}`] });
      toast({ title: "Friend request accepted!" });
    },
  });

  const deleteFriendshipMutation = useMutation({
    mutationFn: async (friendshipId: string) =>
      apiRequest("DELETE", `/api/friendships/${friendshipId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/friendships/${currentUserId}`] });
      toast({ title: "Friendship removed" });
    },
  });

  const pendingRequests = friendships.filter(
    f => f.status === "pending" && f.friendId === currentUserId
  );

  const sentRequests = friendships.filter(
    f => f.status === "pending" && f.userId === currentUserId
  );

  const acceptedFriends = friendships.filter(f => f.status === "accepted");

  const isFriend = (userId: string) => {
    return friendships.some(
      f => (f.userId === userId || f.friendId === userId) && f.status === "accepted"
    );
  };

  const hasPendingRequest = (userId: string) => {
    return friendships.some(
      f => (f.userId === userId || f.friendId === userId) && f.status === "pending"
    );
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 pb-32">
      <div>
        <h1 className="font-display text-4xl font-bold mb-2" data-testid="text-page-title">
          Friends
        </h1>
        <p className="text-muted-foreground">
          Connect with friends and share music together
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Friends</CardTitle>
          <CardDescription>Search for users to connect with</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-users"
            />
          </div>

          {searchQuery.length > 2 && (
            <div className="mt-4 space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found
                </p>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-md hover-elevate"
                    data-testid={`result-user-${user.username}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.username}</span>
                    </div>

                    {isFriend(user.id) ? (
                      <Button variant="secondary" size="sm" disabled>
                        <Check className="h-4 w-4 mr-2" />
                        Friends
                      </Button>
                    ) : hasPendingRequest(user.id) ? (
                      <Button variant="secondary" size="sm" disabled>
                        Pending
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => sendRequestMutation.mutate(user.id)}
                        disabled={sendRequestMutation.isPending}
                        data-testid={`button-add-friend-${user.username}`}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" data-testid="tab-all-friends">
            All Friends ({acceptedFriends.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-requests">
            Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent-requests">
            Sent ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {acceptedFriends.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No friends yet. Search for users to connect!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {acceptedFriends.map((friendship) => (
                <Card key={friendship.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {friendship.friend?.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium" data-testid={`text-friend-${friendship.friend?.username}`}>
                        {friendship.friend?.username}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFriendshipMutation.mutate(friendship.id)}
                      data-testid={`button-remove-friend-${friendship.friend?.username}`}
                    >
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  No pending friend requests
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((friendship) => (
                <Card key={friendship.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {friendship.friend?.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {friendship.friend?.username}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptRequestMutation.mutate(friendship.id)}
                        disabled={acceptRequestMutation.isPending}
                        data-testid={`button-accept-${friendship.friend?.username}`}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFriendshipMutation.mutate(friendship.id)}
                        data-testid={`button-reject-${friendship.friend?.username}`}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {sentRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  No sent friend requests
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sentRequests.map((friendship) => (
                <Card key={friendship.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {friendship.friend?.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {friendship.friend?.username}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFriendshipMutation.mutate(friendship.id)}
                      data-testid={`button-cancel-${friendship.friend?.username}`}
                    >
                      Cancel
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
