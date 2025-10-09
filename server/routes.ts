import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import type { ListeningRoom, RoomParticipant } from "@shared/schema";

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
