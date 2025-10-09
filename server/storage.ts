import {
  type User,
  type InsertUser,
  type ListeningRoom,
  type InsertListeningRoom,
  type RoomParticipant,
  type InsertRoomParticipant,
  type RoomQueue,
  type InsertRoomQueue,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createRoom(room: InsertListeningRoom): Promise<ListeningRoom>;
  getRoom(roomId: string): Promise<ListeningRoom | undefined>;
  getAllRooms(): Promise<ListeningRoom[]>;
  updateRoomPlayState(roomId: string, isPlaying: boolean): Promise<void>;
  updateRoomPosition(roomId: string, position: number): Promise<void>;
  updateCurrentTrack(roomId: string, trackId: string): Promise<void>;
  
  addParticipant(participant: InsertRoomParticipant): Promise<RoomParticipant>;
  getParticipant(roomId: string, userId: string): Promise<RoomParticipant | undefined>;
  getRoomParticipants(roomId: string): Promise<RoomParticipant[]>;
  removeParticipant(roomId: string, userId: string): Promise<void>;
  updateParticipantPermissions(roomId: string, userId: string, canControl: boolean): Promise<void>;
  
  addToQueue(roomId: string, track: InsertRoomQueue): Promise<RoomQueue>;
  getRoomQueue(roomId: string): Promise<RoomQueue[]>;
  removeFromQueue(queueId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private rooms: Map<string, ListeningRoom>;
  private participants: Map<string, RoomParticipant>;
  private queue: Map<string, RoomQueue>;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.participants = new Map();
    this.queue = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createRoom(insertRoom: InsertListeningRoom): Promise<ListeningRoom> {
    const id = randomUUID();
    const room: ListeningRoom = {
      id,
      name: insertRoom.name,
      hostId: insertRoom.hostId,
      currentTrackId: insertRoom.currentTrackId ?? null,
      currentPosition: insertRoom.currentPosition ?? null,
      isPlaying: insertRoom.isPlaying ?? null,
      createdAt: new Date(),
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoom(roomId: string): Promise<ListeningRoom | undefined> {
    return this.rooms.get(roomId);
  }

  async getAllRooms(): Promise<ListeningRoom[]> {
    return Array.from(this.rooms.values());
  }

  async updateRoomPlayState(roomId: string, isPlaying: boolean): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.isPlaying = isPlaying;
      this.rooms.set(roomId, room);
    }
  }

  async updateRoomPosition(roomId: string, position: number): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.currentPosition = position;
      this.rooms.set(roomId, room);
    }
  }

  async updateCurrentTrack(roomId: string, trackId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.currentTrackId = trackId;
      this.rooms.set(roomId, room);
    }
  }

  async addParticipant(insertParticipant: InsertRoomParticipant): Promise<RoomParticipant> {
    const id = randomUUID();
    const participant: RoomParticipant = {
      id,
      roomId: insertParticipant.roomId,
      userId: insertParticipant.userId,
      username: insertParticipant.username,
      canControl: insertParticipant.canControl ?? null,
      joinedAt: new Date(),
    };
    this.participants.set(id, participant);
    return participant;
  }

  async getParticipant(roomId: string, userId: string): Promise<RoomParticipant | undefined> {
    return Array.from(this.participants.values()).find(
      (p) => p.roomId === roomId && p.userId === userId,
    );
  }

  async getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    return Array.from(this.participants.values()).filter(
      (p) => p.roomId === roomId,
    );
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    const participant = Array.from(this.participants.entries()).find(
      ([_, p]) => p.roomId === roomId && p.userId === userId,
    );
    if (participant) {
      this.participants.delete(participant[0]);
    }
  }

  async updateParticipantPermissions(
    roomId: string,
    userId: string,
    canControl: boolean,
  ): Promise<void> {
    const participant = Array.from(this.participants.entries()).find(
      ([_, p]) => p.roomId === roomId && p.userId === userId,
    );
    if (participant) {
      participant[1].canControl = canControl;
      this.participants.set(participant[0], participant[1]);
    }
  }

  async addToQueue(roomId: string, insertQueue: InsertRoomQueue): Promise<RoomQueue> {
    const id = randomUUID();
    const queueItem: RoomQueue = {
      ...insertQueue,
      id,
      roomId,
    };
    this.queue.set(id, queueItem);
    return queueItem;
  }

  async getRoomQueue(roomId: string): Promise<RoomQueue[]> {
    return Array.from(this.queue.values())
      .filter((q) => q.roomId === roomId)
      .sort((a, b) => a.position - b.position);
  }

  async removeFromQueue(queueId: string): Promise<void> {
    this.queue.delete(queueId);
  }
}

export const storage = new MemStorage();
