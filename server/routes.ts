import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storageFactory";
import { audioRoutes } from "./audioRoutes.js";
import { streamingRoutes } from "./streamingRoutes.js";
import type { ListeningRoom, RoomParticipant, User } from "@shared/schema";
import { 
  insertFriendshipSchema, 
  insertMusicActivitySchema, 
  insertActivityReactionSchema, 
  insertActivityCommentSchema,
  insertVibeSchema,
  insertVibeReactionSchema,
  insertVibeCommentSchema,
  insertVibeShareRequestSchema,
} from "@shared/schema";
import { generateMusicRecommendations, analyzeMusicMood, type ConversationContext } from "./ai";

interface RoomConnection {
  ws: WebSocket;
  roomId: string;
  userId: string;
  username: string;
}

const roomConnections = new Map<string, RoomConnection[]>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Add audio routes
  app.use('/api/audio', audioRoutes);
  
  // Add streaming routes
  app.use('/api/stream', streamingRoutes);
  app.post("/api/rooms", async (req, res) => {
    try {
      const { name, hostId } = req.body;
      const room = await storage.createRoom({
        name,
        hostId,
        currentTrackId: null,
        currentPosition: 0,
        isPlaying: false,
      });
      
      await storage.addParticipant({
        roomId: room.id,
        userId: hostId,
        username: req.body.hostUsername || "Host",
        canControl: true,
      });

      res.json(room);
    } catch (error) {
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  app.get("/api/rooms/:roomId", async (req, res) => {
    try {
      const room = await storage.getRoom(req.params.roomId);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch room" });
    }
  });

  app.post("/api/rooms/:roomId/join", async (req, res) => {
    try {
      const { userId, username } = req.body;
      const participant = await storage.addParticipant({
        roomId: req.params.roomId,
        userId,
        username,
        canControl: false,
      });
      res.json(participant);
    } catch (error) {
      res.status(500).json({ error: "Failed to join room" });
    }
  });

  app.post("/api/rooms/:roomId/permissions", async (req, res) => {
    try {
      const { userId, canControl } = req.body;
      await storage.updateParticipantPermissions(
        req.params.roomId,
        userId,
        canControl,
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update permissions" });
    }
  });

  // Remove a queue item via REST and broadcast
  app.delete("/api/rooms/:roomId/queue/:queueId", async (req, res) => {
    try {
      const { roomId, queueId } = req.params;
      await storage.removeFromQueue(queueId);
      const queue = await storage.getRoomQueue(roomId);
      broadcastToRoom(roomId, { type: "queue_updated", queue });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from queue" });
    }
  });

  // Utility endpoint to create a test user (for demo/testing controls)
  app.post("/api/test-users", async (req, res) => {
    try {
      const { username } = req.body;
      const user = await storage.createUser({ username: username || `Test-${Date.now()}`, password: "test" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to create test user" });
    }
  });

  app.get("/api/users/search", async (req, res) => {
    try {
      const { q, excludeUserId } = req.query;
      const users = await storage.searchUsers(q as string, excludeUserId as string);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  app.post("/api/friendships", async (req, res) => {
    try {
      const data = insertFriendshipSchema.parse(req.body);
      const existing = await storage.getFriendship(data.userId, data.friendId);
      if (existing) {
        return res.status(400).json({ error: "Friend request already exists" });
      }
      const friendship = await storage.createFriendship(data);
      res.json(friendship);
    } catch (error) {
      res.status(500).json({ error: "Failed to send friend request" });
    }
  });

  app.get("/api/friendships/:userId", async (req, res) => {
    try {
      const friendships = await storage.getUserFriendships(req.params.userId);
      const enrichedFriendships = await Promise.all(
        friendships.map(async (f) => {
          const friendUserId = f.userId === req.params.userId ? f.friendId : f.userId;
          const friend = await storage.getUser(friendUserId);
          return {
            ...f,
            friend: friend ? { id: friend.id, username: friend.username } : null,
          };
        })
      );
      res.json(enrichedFriendships);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch friendships" });
    }
  });

  app.patch("/api/friendships/:id/accept", async (req, res) => {
    try {
      await storage.updateFriendshipStatus(req.params.id, "accepted");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept friend request" });
    }
  });

  app.delete("/api/friendships/:id", async (req, res) => {
    try {
      await storage.deleteFriendship(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete friendship" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const data = insertMusicActivitySchema.parse(req.body);
      const activity = await storage.createMusicActivity(data);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  app.get("/api/activities/user/:userId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getUserActivities(req.params.userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/friends/:userId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getFriendsActivities(req.params.userId, limit);
      const enrichedActivities = await Promise.all(
        activities.map(async (a) => {
          const user = await storage.getUser(a.userId);
          const reactions = await storage.getActivityReactions(a.id);
          const comments = await storage.getActivityComments(a.id);
          return {
            ...a,
            user: user ? { id: user.id, username: user.username } : null,
            reactions,
            comments,
          };
        })
      );
      res.json(enrichedActivities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch friends activities" });
    }
  });

  app.post("/api/activities/:id/reactions", async (req, res) => {
    try {
      const data = insertActivityReactionSchema.parse(req.body);
      const reaction = await storage.createActivityReaction(data);
      res.json(reaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to add reaction" });
    }
  });

  app.delete("/api/activities/:activityId/reactions/:reactionId", async (req, res) => {
    try {
      await storage.deleteActivityReaction(req.params.reactionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove reaction" });
    }
  });

  app.post("/api/activities/:id/comments", async (req, res) => {
    try {
      const data = insertActivityCommentSchema.parse(req.body);
      const comment = await storage.createActivityComment(data);
      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  app.delete("/api/activities/:activityId/comments/:commentId", async (req, res) => {
    try {
      await storage.deleteActivityComment(req.params.commentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  app.post("/api/ai/recommendations", async (req, res) => {
    try {
      const { messages, recentTracks, count } = req.body;
      const context: ConversationContext = { messages, recentTracks };
      const recommendations = await generateMusicRecommendations(context, count || 5);
      res.json({ recommendations });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  app.post("/api/ai/analyze-mood", async (req, res) => {
    try {
      const { tracks } = req.body;
      const mood = await analyzeMusicMood(tracks);
      res.json(mood);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze mood" });
    }
  });

  app.post("/api/vibes", async (req, res) => {
    try {
      const { userId, trackId, trackTitle, trackArtist, trackAlbumCover, startTime, message } = req.body;
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const vibe = await storage.createVibe({
        userId,
        trackId,
        trackTitle,
        trackArtist,
        trackAlbumCover,
        startTime,
        message,
        expiresAt,
      });
      res.json(vibe);
    } catch (error) {
      res.status(500).json({ error: "Failed to create vibe" });
    }
  });

  app.get("/api/vibes/friends/:userId", async (req, res) => {
    try {
      const vibes = await storage.getFriendsVibes(req.params.userId);
      res.setHeader('Cache-Control', 'no-store');
      const enrichedVibes = await Promise.all(
        vibes.map(async (v) => {
          const user = await storage.getUser(v.userId);
          const reactions = await storage.getVibeReactions(v.id);
          const comments = await storage.getVibeComments(v.id);
          const shareRequests = await storage.getVibeShareRequests(v.id);
          return {
            ...v,
            user: user ? { id: user.id, username: user.username } : null,
            reactions,
            comments,
            shareRequests,
          };
        })
      );
      res.json(enrichedVibes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vibes" });
    }
  });

  app.post("/api/vibes/:id/reactions", async (req, res) => {
    try {
      const data = insertVibeReactionSchema.parse(req.body);
      const reaction = await storage.createVibeReaction(data);
      res.json(reaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to add reaction" });
    }
  });

  app.post("/api/vibes/:id/comments", async (req, res) => {
    try {
      const data = insertVibeCommentSchema.parse(req.body);
      const comment = await storage.createVibeComment(data);
      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  app.post("/api/vibes/:id/share-requests", async (req, res) => {
    try {
      const data = insertVibeShareRequestSchema.parse(req.body);
      const request = await storage.createVibeShareRequest(data);
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to create share request" });
    }
  });

  // Likes endpoints
  app.get("/api/likes/:userId", async (req, res) => {
    try {
      const tracks = await storage.getLikedTracks(req.params.userId);
      res.json({ tracks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch liked tracks" });
    }
  });

  app.get("/api/likes/:userId/:trackId", async (req, res) => {
    try {
      const liked = await storage.isTrackLiked(req.params.userId, req.params.trackId);
      res.json({ liked });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch like state" });
    }
  });

  app.post("/api/likes", async (req, res) => {
    try {
      const { userId, trackId } = req.body;
      if (!userId || !trackId) return res.status(400).json({ error: "userId and trackId are required" });
      const like = await storage.likeTrack({ userId, trackId });
      res.json(like);
    } catch (error) {
      res.status(500).json({ error: "Failed to like track" });
    }
  });

  app.delete("/api/likes", async (req, res) => {
    try {
      const { userId, trackId } = req.body;
      if (!userId || !trackId) return res.status(400).json({ error: "userId and trackId are required" });
      await storage.unlikeTrack(userId, trackId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unlike track" });
    }
  });

  app.delete("/api/vibes/:vibeId", async (req, res) => {
    try {
      const vibeId = req.params.vibeId;
      // Check if vibe exists
      const vibe = await storage.getVibe(vibeId);
      if (!vibe) {
        return res.status(404).json({ error: "Vibe not found" });
      }
      
      // Delete the vibe
      await storage.deleteVibe(vibeId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vibe" });
    }
  });

  app.patch("/api/vibes/share-requests/:id", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateVibeShareRequestStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update share request" });
    }
  });

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    let currentConnection: RoomConnection | null = null;

    ws.on("message", async (data: string) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case "join_room": {
            const { roomId, userId, username } = message;
            currentConnection = { ws, roomId, userId, username };
            
            if (!roomConnections.has(roomId)) {
              roomConnections.set(roomId, []);
            }
            roomConnections.get(roomId)?.push(currentConnection);

            const room = await storage.getRoom(roomId);
            const participants = await storage.getRoomParticipants(roomId);
            const queue = await storage.getRoomQueue(roomId);

            ws.send(JSON.stringify({
              type: "room_state",
              room,
              participants,
              queue,
            }));

            const updatedParticipants = await storage.getRoomParticipants(roomId);
            broadcastToRoom(roomId, {
              type: "participant_joined",
              participant: { userId, username },
              participants: updatedParticipants,
            }, userId);
            break;
          }

          case "leave_room": {
            if (currentConnection) {
              const connections = roomConnections.get(currentConnection.roomId);
              if (connections) {
                const index = connections.findIndex(c => c.userId === currentConnection!.userId);
                if (index !== -1) connections.splice(index, 1);
              }

              await storage.removeParticipant(currentConnection.roomId, currentConnection.userId);

              const updatedParticipants = await storage.getRoomParticipants(currentConnection.roomId);
              broadcastToRoom(currentConnection.roomId, {
                type: "participant_left",
                userId: currentConnection.userId,
                participants: updatedParticipants,
              });
            }
            break;
          }

          case "play":
          case "pause":
          case "seek":
          case "next_track":
          case "prev_track": {
            if (currentConnection) {
              const participant = await storage.getParticipant(currentConnection.roomId, currentConnection.userId);
              const room = await storage.getRoom(currentConnection.roomId);
              
              if (participant?.canControl || room?.hostId === currentConnection.userId) {
                if (message.type === "play" || message.type === "pause") {
                  await storage.updateRoomPlayState(currentConnection.roomId, message.type === "play");
                }
                if (message.type === "seek") {
                  await storage.updateRoomPosition(currentConnection.roomId, message.position);
                }
                
                broadcastToRoom(currentConnection.roomId, message);
              }
            }
            break;
          }

          case "add_to_queue": {
            if (currentConnection) {
              await storage.addToQueue(currentConnection.roomId, {
                ...message.track,
                addedBy: currentConnection.userId,
              });

              const queue = await storage.getRoomQueue(currentConnection.roomId);
              broadcastToRoom(currentConnection.roomId, {
                type: "queue_updated",
                queue,
              });
            }
            break;
          }

          case "remove_from_queue": {
            if (currentConnection) {
              if (message.queueId) {
                await storage.removeFromQueue(message.queueId);
                const queue = await storage.getRoomQueue(currentConnection.roomId);
                broadcastToRoom(currentConnection.roomId, {
                  type: "queue_updated",
                  queue,
                });
              }
            }
            break;
          }

          case "update_permissions": {
            if (currentConnection) {
              const room = await storage.getRoom(currentConnection.roomId);
              if (room?.hostId === currentConnection.userId) {
                await storage.updateParticipantPermissions(
                  currentConnection.roomId,
                  message.userId,
                  message.canControl
                );

                const participants = await storage.getRoomParticipants(currentConnection.roomId);
                broadcastToRoom(currentConnection.roomId, {
                  type: "permissions_updated",
                  participants,
                });
              }
            }
            break;
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", async () => {
      if (currentConnection) {
        const connections = roomConnections.get(currentConnection.roomId);
        if (connections) {
          const index = connections.findIndex(c => c.userId === currentConnection!.userId);
          if (index !== -1) connections.splice(index, 1);
        }

        await storage.removeParticipant(currentConnection.roomId, currentConnection.userId);

        const updatedParticipants = await storage.getRoomParticipants(currentConnection.roomId);
        broadcastToRoom(currentConnection.roomId, {
          type: "participant_left",
          userId: currentConnection.userId,
          participants: updatedParticipants,
        });
      }
    });
  });

  function broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
    const connections = roomConnections.get(roomId) || [];
    connections.forEach(conn => {
      if (conn.userId !== excludeUserId && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(message));
      }
    });
  }

  return httpServer;
}
