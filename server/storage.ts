import {
  type User,
  type InsertUser,
  type ListeningRoom,
  type InsertListeningRoom,
  type RoomParticipant,
  type InsertRoomParticipant,
  type RoomQueue,
  type InsertRoomQueue,
  type Friendship,
  type InsertFriendship,
  type MusicActivity,
  type InsertMusicActivity,
  type ActivityReaction,
  type InsertActivityReaction,
  type ActivityComment,
  type InsertActivityComment,
  type Vibe,
  type InsertVibe,
  type VibeReaction,
  type InsertVibeReaction,
  type VibeComment,
  type InsertVibeComment,
  type VibeShareRequest,
  type InsertVibeShareRequest,
  type HDAudioConversion,
  type InsertHDAudioConversion,
  type Track,
  type InsertTrack,
  type TrackLike,
  type InsertTrackLike,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  searchUsers(query: string, excludeUserId?: string): Promise<User[]>;
  
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

  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  getFriendship(userId: string, friendId: string): Promise<Friendship | undefined>;
  getUserFriendships(userId: string): Promise<Friendship[]>;
  updateFriendshipStatus(id: string, status: string): Promise<void>;
  deleteFriendship(id: string): Promise<void>;

  createMusicActivity(activity: InsertMusicActivity): Promise<MusicActivity>;
  getUserActivities(userId: string, limit?: number): Promise<MusicActivity[]>;
  getFriendsActivities(userId: string, limit?: number): Promise<MusicActivity[]>;
  getActivity(id: string): Promise<MusicActivity | undefined>;

  createActivityReaction(reaction: InsertActivityReaction): Promise<ActivityReaction>;
  getActivityReactions(activityId: string): Promise<ActivityReaction[]>;
  deleteActivityReaction(id: string): Promise<void>;

  createActivityComment(comment: InsertActivityComment): Promise<ActivityComment>;
  getActivityComments(activityId: string): Promise<ActivityComment[]>;
  deleteActivityComment(id: string): Promise<void>;

  createVibe(vibe: InsertVibe): Promise<Vibe>;
  getVibe(id: string): Promise<Vibe | undefined>;
  getFriendsVibes(userId: string): Promise<Vibe[]>;
  deleteVibe(id: string): Promise<void>;
  deleteExpiredVibes(): Promise<void>;

  createVibeReaction(reaction: InsertVibeReaction): Promise<VibeReaction>;
  getVibeReactions(vibeId: string): Promise<VibeReaction[]>;
  deleteVibeReaction(id: string): Promise<void>;

  createVibeComment(comment: InsertVibeComment): Promise<VibeComment>;
  getVibeComments(vibeId: string): Promise<VibeComment[]>;
  deleteVibeComment(id: string): Promise<void>;

  createVibeShareRequest(request: InsertVibeShareRequest): Promise<VibeShareRequest>;
  getVibeShareRequests(vibeId: string): Promise<VibeShareRequest[]>;
  updateVibeShareRequestStatus(id: string, status: string): Promise<void>;

  createHDAudioConversion(conversion: InsertHDAudioConversion): Promise<HDAudioConversion>;
  getHDAudioConversionByOriginalUrl(originalUrl: string): Promise<HDAudioConversion | undefined>;
  getHDAudioConversion(id: string): Promise<HDAudioConversion | undefined>;

  // Uploaded Tracks
  createTrack(track: InsertTrack): Promise<Track>;
  getTrack(trackId: string): Promise<Track | undefined>;
  getAllTracks(): Promise<Track[]>;
  getTracksByUser(userId: string): Promise<Track[]>;
  updateTrackHDStatus(trackId: string, hdAudioUrl: string, isHD: boolean): Promise<void>;
  deleteTrack(trackId: string): Promise<void>;
  searchTracks(query: string): Promise<Track[]>;

  // Likes
  likeTrack(like: InsertTrackLike): Promise<TrackLike>;
  unlikeTrack(userId: string, trackId: string): Promise<void>;
  isTrackLiked(userId: string, trackId: string): Promise<boolean>;
  getLikedTracks(userId: string): Promise<Track[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private rooms: Map<string, ListeningRoom>;
  private participants: Map<string, RoomParticipant>;
  private queue: Map<string, RoomQueue>;
  private friendships: Map<string, Friendship>;
  private musicActivities: Map<string, MusicActivity>;
  private activityReactions: Map<string, ActivityReaction>;
  private activityComments: Map<string, ActivityComment>;
  private vibes: Map<string, Vibe>;
  private vibeReactions: Map<string, VibeReaction>;
  private vibeComments: Map<string, VibeComment>;
  private vibeShareRequests: Map<string, VibeShareRequest>;
  private hdAudioConversions: Map<string, HDAudioConversion>;
  private uploadedTracks: Map<string, Track>;
  private trackLikes: Map<string, TrackLike>;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.participants = new Map();
    this.queue = new Map();
    this.friendships = new Map();
    this.musicActivities = new Map();
    this.activityReactions = new Map();
    this.activityComments = new Map();
    this.vibes = new Map();
    this.vibeReactions = new Map();
    this.vibeComments = new Map();
    this.vibeShareRequests = new Map();
    this.hdAudioConversions = new Map();
    this.uploadedTracks = new Map();
    this.trackLikes = new Map();
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

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(user => 
        user.id !== excludeUserId && 
        user.username.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10);
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
    // Compute next position if not provided
    const current = await this.getRoomQueue(roomId);
    const nextPos = (current[current.length - 1]?.position ?? 0) + 1;
    const queueItem: RoomQueue = {
      ...insertQueue,
      position: insertQueue.position ?? nextPos,
      id,
      roomId,
    } as any;
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

  async createFriendship(insertFriendship: InsertFriendship): Promise<Friendship> {
    const id = randomUUID();
    const friendship: Friendship = {
      id,
      userId: insertFriendship.userId,
      friendId: insertFriendship.friendId,
      status: insertFriendship.status ?? "pending",
      createdAt: new Date(),
    };
    this.friendships.set(id, friendship);
    return friendship;
  }

  async getFriendship(userId: string, friendId: string): Promise<Friendship | undefined> {
    return Array.from(this.friendships.values()).find(
      (f) => (f.userId === userId && f.friendId === friendId) || (f.userId === friendId && f.friendId === userId),
    );
  }

  async getUserFriendships(userId: string): Promise<Friendship[]> {
    return Array.from(this.friendships.values()).filter(
      (f) => f.userId === userId || f.friendId === userId,
    );
  }

  async updateFriendshipStatus(id: string, status: string): Promise<void> {
    const friendship = this.friendships.get(id);
    if (friendship) {
      friendship.status = status;
      this.friendships.set(id, friendship);
    }
  }

  async deleteFriendship(id: string): Promise<void> {
    this.friendships.delete(id);
  }

  async createMusicActivity(insertActivity: InsertMusicActivity): Promise<MusicActivity> {
    const id = randomUUID();
    const activity: MusicActivity = {
      id,
      userId: insertActivity.userId,
      activityType: insertActivity.activityType,
      trackId: insertActivity.trackId ?? null,
      trackTitle: insertActivity.trackTitle ?? null,
      trackArtist: insertActivity.trackArtist ?? null,
      trackAlbum: insertActivity.trackAlbum ?? null,
      trackAlbumCover: insertActivity.trackAlbumCover ?? null,
      message: insertActivity.message ?? null,
      sharedWith: insertActivity.sharedWith ?? null,
      createdAt: new Date(),
    };
    this.musicActivities.set(id, activity);
    return activity;
  }

  async getUserActivities(userId: string, limit: number = 20): Promise<MusicActivity[]> {
    return Array.from(this.musicActivities.values())
      .filter((a) => a.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      .slice(0, limit);
  }

  async getFriendsActivities(userId: string, limit: number = 50): Promise<MusicActivity[]> {
    const friendships = await this.getUserFriendships(userId);
    const friendIds = friendships
      .filter((f) => f.status === "accepted")
      .map((f) => f.userId === userId ? f.friendId : f.userId);

    return Array.from(this.musicActivities.values())
      .filter((a) => 
        friendIds.includes(a.userId) || 
        a.sharedWith?.includes(userId)
      )
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      .slice(0, limit);
  }

  async getActivity(id: string): Promise<MusicActivity | undefined> {
    return this.musicActivities.get(id);
  }

  async createActivityReaction(insertReaction: InsertActivityReaction): Promise<ActivityReaction> {
    const id = randomUUID();
    const reaction: ActivityReaction = {
      id,
      activityId: insertReaction.activityId,
      userId: insertReaction.userId,
      reactionType: insertReaction.reactionType,
      createdAt: new Date(),
    };
    this.activityReactions.set(id, reaction);
    return reaction;
  }

  async getActivityReactions(activityId: string): Promise<ActivityReaction[]> {
    return Array.from(this.activityReactions.values())
      .filter((r) => r.activityId === activityId);
  }

  async deleteActivityReaction(id: string): Promise<void> {
    this.activityReactions.delete(id);
  }

  async createActivityComment(insertComment: InsertActivityComment): Promise<ActivityComment> {
    const id = randomUUID();
    const comment: ActivityComment = {
      id,
      activityId: insertComment.activityId,
      userId: insertComment.userId,
      username: insertComment.username,
      comment: insertComment.comment,
      createdAt: new Date(),
    };
    this.activityComments.set(id, comment);
    return comment;
  }

  async getActivityComments(activityId: string): Promise<ActivityComment[]> {
    return Array.from(this.activityComments.values())
      .filter((c) => c.activityId === activityId)
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  }

  async deleteActivityComment(id: string): Promise<void> {
    this.activityComments.delete(id);
  }

  async createVibe(insertVibe: InsertVibe): Promise<Vibe> {
    const id = randomUUID();
    const vibe: Vibe = {
      id,
      userId: insertVibe.userId,
      trackId: insertVibe.trackId,
      trackTitle: insertVibe.trackTitle,
      trackArtist: insertVibe.trackArtist,
      trackAlbumCover: insertVibe.trackAlbumCover,
      startTime: insertVibe.startTime ?? 0,
      message: insertVibe.message ?? null,
      createdAt: new Date(),
      expiresAt: insertVibe.expiresAt,
    };
    this.vibes.set(id, vibe);
    return vibe;
  }

  async getVibe(id: string): Promise<Vibe | undefined> {
    return this.vibes.get(id);
  }

  async getFriendsVibes(userId: string): Promise<Vibe[]> {
    await this.deleteExpiredVibes();
    
    const friendships = await this.getUserFriendships(userId);
    const friendIds = friendships
      .filter((f) => f.status === "accepted")
      .map((f) => f.userId === userId ? f.friendId : f.userId);

    const now = new Date();
    return Array.from(this.vibes.values())
      .filter((v) => 
        (friendIds.includes(v.userId) || v.userId === userId) &&
        v.expiresAt > now
      )
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async deleteVibe(id: string): Promise<void> {
    this.vibes.delete(id);
  }

  async deleteExpiredVibes(): Promise<void> {
    const now = new Date();
    const expiredIds = Array.from(this.vibes.entries())
      .filter(([_, vibe]) => vibe.expiresAt <= now)
      .map(([id]) => id);
    
    expiredIds.forEach(id => this.vibes.delete(id));
  }

  async createVibeReaction(insertReaction: InsertVibeReaction): Promise<VibeReaction> {
    const id = randomUUID();
    const reaction: VibeReaction = {
      id,
      vibeId: insertReaction.vibeId,
      userId: insertReaction.userId,
      reactionType: insertReaction.reactionType,
      createdAt: new Date(),
    };
    this.vibeReactions.set(id, reaction);
    return reaction;
  }

  async getVibeReactions(vibeId: string): Promise<VibeReaction[]> {
    return Array.from(this.vibeReactions.values())
      .filter((r) => r.vibeId === vibeId);
  }

  async deleteVibeReaction(id: string): Promise<void> {
    this.vibeReactions.delete(id);
  }

  async createVibeComment(insertComment: InsertVibeComment): Promise<VibeComment> {
    const id = randomUUID();
    const comment: VibeComment = {
      id,
      vibeId: insertComment.vibeId,
      userId: insertComment.userId,
      username: insertComment.username,
      comment: insertComment.comment,
      createdAt: new Date(),
    };
    this.vibeComments.set(id, comment);
    return comment;
  }

  async getVibeComments(vibeId: string): Promise<VibeComment[]> {
    return Array.from(this.vibeComments.values())
      .filter((c) => c.vibeId === vibeId)
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  }

  async deleteVibeComment(id: string): Promise<void> {
    this.vibeComments.delete(id);
  }

  async createVibeShareRequest(insertRequest: InsertVibeShareRequest): Promise<VibeShareRequest> {
    const id = randomUUID();
    const request: VibeShareRequest = {
      id,
      vibeId: insertRequest.vibeId,
      requesterId: insertRequest.requesterId,
      requesterUsername: insertRequest.requesterUsername,
      status: insertRequest.status ?? "pending",
      createdAt: new Date(),
    };
    this.vibeShareRequests.set(id, request);
    return request;
  }

  async getVibeShareRequests(vibeId: string): Promise<VibeShareRequest[]> {
    return Array.from(this.vibeShareRequests.values())
      .filter((r) => r.vibeId === vibeId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async updateVibeShareRequestStatus(id: string, status: string): Promise<void> {
    const request = this.vibeShareRequests.get(id);
    if (request) {
      request.status = status;
      this.vibeShareRequests.set(id, request);
    }
  }

  async createHDAudioConversion(insertConversion: InsertHDAudioConversion): Promise<HDAudioConversion> {
    const id = randomUUID();
    const conversion: HDAudioConversion = {
      id,
      originalUrl: insertConversion.originalUrl,
      hdUrl: insertConversion.hdUrl,
      originalBitrate: insertConversion.originalBitrate,
      originalSampleRate: insertConversion.originalSampleRate,
      originalChannels: insertConversion.originalChannels,
      originalFormat: insertConversion.originalFormat,
      originalSize: insertConversion.originalSize,
      hdBitrate: insertConversion.hdBitrate,
      hdSampleRate: insertConversion.hdSampleRate,
      hdChannels: insertConversion.hdChannels,
      hdFormat: insertConversion.hdFormat,
      hdSize: insertConversion.hdSize,
      conversionTime: insertConversion.conversionTime,
      createdAt: new Date(),
    };
    this.hdAudioConversions.set(id, conversion);
    return conversion;
  }

  async getHDAudioConversionByOriginalUrl(originalUrl: string): Promise<HDAudioConversion | undefined> {
    return Array.from(this.hdAudioConversions.values()).find(
      (conversion) => conversion.originalUrl === originalUrl
    );
  }

  async getHDAudioConversion(id: string): Promise<HDAudioConversion | undefined> {
    return this.hdAudioConversions.get(id);
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const id = randomUUID();
    const newTrack: Track = {
      id,
      ...track,
      createdAt: new Date(),
    };
    this.uploadedTracks.set(id, newTrack);
    return newTrack;
  }

  async getTrack(trackId: string): Promise<Track | undefined> {
    return this.uploadedTracks.get(trackId);
  }

  async getAllTracks(): Promise<Track[]> {
    return Array.from(this.uploadedTracks.values());
  }

  async getTracksByUser(userId: string): Promise<Track[]> {
    return Array.from(this.uploadedTracks.values()).filter(
      track => track.uploadedBy === userId
    );
  }

  async updateTrackHDStatus(trackId: string, hdAudioUrl: string, isHD: boolean): Promise<void> {
    const track = this.uploadedTracks.get(trackId);
    if (track) {
      track.hdAudioUrl = hdAudioUrl;
      track.isHD = isHD;
      this.uploadedTracks.set(trackId, track);
    }
  }

  async deleteTrack(trackId: string): Promise<void> {
    this.uploadedTracks.delete(trackId);
  }

  async searchTracks(query: string): Promise<Track[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.uploadedTracks.values()).filter(
      track => 
        track.title.toLowerCase().includes(lowerQuery) ||
        track.artist.toLowerCase().includes(lowerQuery) ||
        track.album.toLowerCase().includes(lowerQuery)
    );
  }

  // Likes
  async likeTrack(like: InsertTrackLike): Promise<TrackLike> {
    // prevent duplicate like
    const existing = Array.from(this.trackLikes.values()).find(
      (l) => l.userId === like.userId && l.trackId === like.trackId,
    );
    if (existing) return existing;

    const id = randomUUID();
    const trackLike: TrackLike = {
      id,
      userId: like.userId,
      trackId: like.trackId,
      createdAt: new Date(),
    } as any;
    this.trackLikes.set(id, trackLike);
    return trackLike;
  }

  async unlikeTrack(userId: string, trackId: string): Promise<void> {
    const entry = Array.from(this.trackLikes.entries()).find(
      ([_, l]) => l.userId === userId && l.trackId === trackId,
    );
    if (entry) this.trackLikes.delete(entry[0]);
  }

  async isTrackLiked(userId: string, trackId: string): Promise<boolean> {
    return Array.from(this.trackLikes.values()).some(
      (l) => l.userId === userId && l.trackId === trackId,
    );
  }

  async getLikedTracks(userId: string): Promise<Track[]> {
    const likedIds = new Set(
      Array.from(this.trackLikes.values())
        .filter((l) => l.userId === userId)
        .map((l) => l.trackId),
    );
    return Array.from(this.uploadedTracks.values()).filter((t) => likedIds.has(t.id));
  }
}

export const storage = new MemStorage();
