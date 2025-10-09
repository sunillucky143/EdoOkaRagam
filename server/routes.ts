import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import type { ListeningRoom, RoomParticipant, User } from "@shared/schema";
import { insertFriendshipSchema, insertMusicActivitySchema, insertActivityReactionSchema, insertActivityCommentSchema } from "@shared/schema";
import { generateMusicRecommendations, analyzeMusicMood, type ConversationContext } from "./ai";

interface RoomConnection {
  ws: WebSocket;
  roomId: string;
  userId: string;
  username: string;
}

const roomConnections = new Map<string, RoomConnection[]>();

export async function registerRoutes(app: Express): Promise<Server> {
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
