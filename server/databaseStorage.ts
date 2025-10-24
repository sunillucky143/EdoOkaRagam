import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "./database";
import {
  users,
  listeningRooms,
  roomParticipants,
  roomQueue,
  friendships,
  musicActivities,
  activityReactions,
  activityComments,
  vibes,
  vibeReactions,
  vibeComments,
  vibeShareRequests,
  hdAudioConversions,
  tracks,
  trackLikes,
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
} from "./database";

export class DatabaseStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    let queryBuilder = db.select().from(users).where(
      sql`${users.username} ILIKE ${`%${query}%`}`
    );
    
    if (excludeUserId) {
      queryBuilder = queryBuilder.where(sql`${users.id} != ${excludeUserId}`);
    }
    
    return await queryBuilder.limit(10);
  }

  // Room management
  async createRoom(room: InsertListeningRoom): Promise<ListeningRoom> {
    const result = await db.insert(listeningRooms).values(room).returning();
    return result[0];
  }

  async getRoom(roomId: string): Promise<ListeningRoom | undefined> {
    const result = await db.select().from(listeningRooms).where(eq(listeningRooms.id, roomId)).limit(1);
    return result[0];
  }

  async getAllRooms(): Promise<ListeningRoom[]> {
    return await db.select().from(listeningRooms).orderBy(desc(listeningRooms.createdAt));
  }

  async updateRoomPlayState(roomId: string, isPlaying: boolean): Promise<void> {
    await db.update(listeningRooms)
      .set({ isPlaying })
      .where(eq(listeningRooms.id, roomId));
  }

  async updateRoomPosition(roomId: string, position: number): Promise<void> {
    await db.update(listeningRooms)
      .set({ currentPosition: position })
      .where(eq(listeningRooms.id, roomId));
  }

  async updateCurrentTrack(roomId: string, trackId: string): Promise<void> {
    await db.update(listeningRooms)
      .set({ currentTrackId: trackId, currentPosition: 0 })
      .where(eq(listeningRooms.id, roomId));
  }

  // Participant management
  async addParticipant(participant: InsertRoomParticipant): Promise<RoomParticipant> {
    const result = await db.insert(roomParticipants).values(participant).returning();
    return result[0];
  }

  async getParticipant(roomId: string, userId: string): Promise<RoomParticipant | undefined> {
    const result = await db.select()
      .from(roomParticipants)
      .where(and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, userId)))
      .limit(1);
    return result[0];
  }

  async getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    return await db.select()
      .from(roomParticipants)
      .where(eq(roomParticipants.roomId, roomId))
      .orderBy(asc(roomParticipants.joinedAt));
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    await db.delete(roomParticipants)
      .where(and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, userId)));
  }

  async updateParticipantPermissions(roomId: string, userId: string, canControl: boolean): Promise<void> {
    await db.update(roomParticipants)
      .set({ canControl })
      .where(and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, userId)));
  }

  // Queue management
  async addToQueue(roomId: string, track: InsertRoomQueue): Promise<RoomQueue> {
    // Get the current max position for this room
    const maxPositionResult = await db.select({ maxPos: sql<number>`MAX(${roomQueue.position})` })
      .from(roomQueue)
      .where(eq(roomQueue.roomId, roomId));
    
    const maxPosition = maxPositionResult[0]?.maxPos || 0;
    
    const result = await db.insert(roomQueue)
      .values({ ...track, roomId, position: maxPosition + 1 })
      .returning();
    
    return result[0];
  }

  async getRoomQueue(roomId: string): Promise<RoomQueue[]> {
    return await db.select()
      .from(roomQueue)
      .where(eq(roomQueue.roomId, roomId))
      .orderBy(asc(roomQueue.position));
  }

  async removeFromQueue(queueId: string): Promise<void> {
    await db.delete(roomQueue).where(eq(roomQueue.id, queueId));
  }

  async clearRoomQueue(roomId: string): Promise<void> {
    await db.delete(roomQueue).where(eq(roomQueue.roomId, roomId));
  }

  // Friendship management
  async createFriendship(friendship: InsertFriendship): Promise<Friendship> {
    const result = await db.insert(friendships).values(friendship).returning();
    return result[0];
  }

  async getFriendship(userId: string, friendId: string): Promise<Friendship | undefined> {
    const result = await db.select()
      .from(friendships)
      .where(and(
        eq(friendships.userId, userId),
        eq(friendships.friendId, friendId)
      ))
      .limit(1);
    return result[0];
  }

  async getUserFriendships(userId: string): Promise<Friendship[]> {
    return await db.select()
      .from(friendships)
      .where(sql`${friendships.userId} = ${userId} OR ${friendships.friendId} = ${userId}`)
      .orderBy(desc(friendships.createdAt));
  }

  async getFriendships(userId: string): Promise<Friendship[]> {
    return await db.select()
      .from(friendships)
      .where(eq(friendships.userId, userId))
      .orderBy(desc(friendships.createdAt));
  }

  async updateFriendshipStatus(id: string, status: string): Promise<void> {
    await db.update(friendships)
      .set({ status })
      .where(eq(friendships.id, id));
  }

  async deleteFriendship(id: string): Promise<void> {
    await db.delete(friendships).where(eq(friendships.id, id));
  }

  // Music activities
  async createMusicActivity(activity: InsertMusicActivity): Promise<MusicActivity> {
    const result = await db.insert(musicActivities).values(activity).returning();
    return result[0];
  }

  async getMusicActivities(userId: string): Promise<MusicActivity[]> {
    return await db.select()
      .from(musicActivities)
      .where(eq(musicActivities.userId, userId))
      .orderBy(desc(musicActivities.createdAt));
  }

  async getUserActivities(userId: string, limit: number = 20): Promise<MusicActivity[]> {
    return await db.select()
      .from(musicActivities)
      .where(eq(musicActivities.userId, userId))
      .orderBy(desc(musicActivities.createdAt))
      .limit(limit);
  }

  async getFriendsActivities(userId: string, limit: number = 50): Promise<MusicActivity[]> {
    // Get user's friends
    const friendships = await this.getUserFriendships(userId);
    const friendIds = friendships
      .filter((f) => f.status === "accepted")
      .map((f) => f.userId === userId ? f.friendId : f.userId);

    if (friendIds.length === 0) return [];
    
    return await db.select()
      .from(musicActivities)
      .where(sql`${musicActivities.userId} = ANY(${friendIds}) OR ${musicActivities.sharedWith} @> ${JSON.stringify([userId])}`)
      .orderBy(desc(musicActivities.createdAt))
      .limit(limit);
  }

  async getActivity(id: string): Promise<MusicActivity | undefined> {
    const result = await db.select().from(musicActivities).where(eq(musicActivities.id, id)).limit(1);
    return result[0];
  }

  async getFriendMusicActivities(userIds: string[]): Promise<MusicActivity[]> {
    if (userIds.length === 0) return [];
    
    return await db.select()
      .from(musicActivities)
      .where(sql`${musicActivities.userId} = ANY(${userIds})`)
      .orderBy(desc(musicActivities.createdAt))
      .limit(50); // Limit to prevent overwhelming responses
  }

  // Activity reactions
  async createActivityReaction(reaction: InsertActivityReaction): Promise<ActivityReaction> {
    const result = await db.insert(activityReactions).values(reaction).returning();
    return result[0];
  }

  async addActivityReaction(reaction: InsertActivityReaction): Promise<ActivityReaction> {
    const result = await db.insert(activityReactions).values(reaction).returning();
    return result[0];
  }

  async deleteActivityReaction(id: string): Promise<void> {
    await db.delete(activityReactions).where(eq(activityReactions.id, id));
  }

  async removeActivityReaction(activityId: string, userId: string): Promise<void> {
    await db.delete(activityReactions)
      .where(and(
        eq(activityReactions.activityId, activityId),
        eq(activityReactions.userId, userId)
      ));
  }

  async getActivityReactions(activityId: string): Promise<ActivityReaction[]> {
    return await db.select()
      .from(activityReactions)
      .where(eq(activityReactions.activityId, activityId));
  }

  // Activity comments
  async createActivityComment(comment: InsertActivityComment): Promise<ActivityComment> {
    const result = await db.insert(activityComments).values(comment).returning();
    return result[0];
  }

  async addActivityComment(comment: InsertActivityComment): Promise<ActivityComment> {
    const result = await db.insert(activityComments).values(comment).returning();
    return result[0];
  }

  async getActivityComments(activityId: string): Promise<ActivityComment[]> {
    return await db.select()
      .from(activityComments)
      .where(eq(activityComments.activityId, activityId))
      .orderBy(asc(activityComments.createdAt));
  }

  async deleteActivityComment(id: string): Promise<void> {
    await db.delete(activityComments).where(eq(activityComments.id, id));
  }

  // Vibes management
  async createVibe(vibe: InsertVibe): Promise<Vibe> {
    const result = await db.insert(vibes).values(vibe).returning();
    return result[0];
  }

  async getFriendsVibes(userId: string): Promise<Vibe[]> {
    await this.deleteExpiredVibes();
    
    // Get user's friends
    const friendships = await this.getUserFriendships(userId);
    const friendIds = friendships
      .filter((f) => f.status === "accepted")
      .map((f) => f.userId === userId ? f.friendId : f.userId);

    if (friendIds.length === 0) {
      // If no friends, still show the current user's vibes
      return await db.select()
        .from(vibes)
        .where(eq(vibes.userId, userId))
        .orderBy(desc(vibes.createdAt))
        .limit(50);
    }
    
    return await db.select()
      .from(vibes)
      .where(sql`${vibes.userId} = ANY(${friendIds}) OR ${vibes.userId} = ${userId}`)
      .orderBy(desc(vibes.createdAt))
      .limit(50);
  }

  async getVibes(userId: string): Promise<Vibe[]> {
    return await db.select()
      .from(vibes)
      .where(eq(vibes.userId, userId))
      .orderBy(desc(vibes.createdAt));
  }

  async getFriendVibes(userIds: string[]): Promise<Vibe[]> {
    if (userIds.length === 0) return [];
    
    return await db.select()
      .from(vibes)
      .where(sql`${vibes.userId} = ANY(${userIds})`)
      .orderBy(desc(vibes.createdAt))
      .limit(50); // Limit to prevent overwhelming responses
  }

  async getVibe(vibeId: string): Promise<Vibe | undefined> {
    const result = await db.select().from(vibes).where(eq(vibes.id, vibeId)).limit(1);
    return result[0];
  }

  async deleteVibe(id: string): Promise<void> {
    await db.delete(vibes).where(eq(vibes.id, id));
  }

  async deleteExpiredVibes(): Promise<void> {
    await db.delete(vibes).where(sql`${vibes.expiresAt} < NOW()`);
  }

  // Vibe reactions
  async createVibeReaction(reaction: InsertVibeReaction): Promise<VibeReaction> {
    const result = await db.insert(vibeReactions).values(reaction).returning();
    return result[0];
  }

  async addVibeReaction(reaction: InsertVibeReaction): Promise<VibeReaction> {
    const result = await db.insert(vibeReactions).values(reaction).returning();
    return result[0];
  }

  async deleteVibeReaction(id: string): Promise<void> {
    await db.delete(vibeReactions).where(eq(vibeReactions.id, id));
  }

  async removeVibeReaction(vibeId: string, userId: string): Promise<void> {
    await db.delete(vibeReactions)
      .where(and(
        eq(vibeReactions.vibeId, vibeId),
        eq(vibeReactions.userId, userId)
      ));
  }

  async getVibeReactions(vibeId: string): Promise<VibeReaction[]> {
    return await db.select()
      .from(vibeReactions)
      .where(eq(vibeReactions.vibeId, vibeId));
  }

  // Vibe comments
  async createVibeComment(comment: InsertVibeComment): Promise<VibeComment> {
    const result = await db.insert(vibeComments).values(comment).returning();
    return result[0];
  }

  async addVibeComment(comment: InsertVibeComment): Promise<VibeComment> {
    const result = await db.insert(vibeComments).values(comment).returning();
    return result[0];
  }

  async getVibeComments(vibeId: string): Promise<VibeComment[]> {
    return await db.select()
      .from(vibeComments)
      .where(eq(vibeComments.vibeId, vibeId))
      .orderBy(asc(vibeComments.createdAt));
  }

  async deleteVibeComment(id: string): Promise<void> {
    await db.delete(vibeComments).where(eq(vibeComments.id, id));
  }

  // Vibe share requests
  async createVibeShareRequest(request: InsertVibeShareRequest): Promise<VibeShareRequest> {
    const result = await db.insert(vibeShareRequests).values(request).returning();
    return result[0];
  }

  async getVibeShareRequests(vibeId: string): Promise<VibeShareRequest[]> {
    return await db.select()
      .from(vibeShareRequests)
      .where(eq(vibeShareRequests.vibeId, vibeId))
      .orderBy(desc(vibeShareRequests.createdAt));
  }

  async updateVibeShareRequestStatus(id: string, status: string): Promise<void> {
    await db.update(vibeShareRequests)
      .set({ status })
      .where(eq(vibeShareRequests.id, id));
  }

  // HD Audio conversions
  async createHDAudioConversion(conversion: InsertHDAudioConversion): Promise<HDAudioConversion> {
    const result = await db.insert(hdAudioConversions).values(conversion).returning();
    return result[0];
  }

  async getHDAudioConversionByOriginalUrl(originalUrl: string): Promise<HDAudioConversion | undefined> {
    const result = await db.select()
      .from(hdAudioConversions)
      .where(eq(hdAudioConversions.originalUrl, originalUrl))
      .limit(1);
    return result[0];
  }

  async getHDAudioConversion(id: string): Promise<HDAudioConversion | undefined> {
    const result = await db.select().from(hdAudioConversions).where(eq(hdAudioConversions.id, id)).limit(1);
    return result[0];
  }

  // Track management (for uploaded music)
  async createTrack(track: InsertTrack): Promise<Track> {
    const result = await db.insert(tracks).values(track).returning();
    return result[0];
  }

  async getTrack(trackId: string): Promise<Track | undefined> {
    const result = await db.select().from(tracks).where(eq(tracks.id, trackId)).limit(1);
    return result[0];
  }

  async getAllTracks(): Promise<Track[]> {
    return await db.select().from(tracks).orderBy(desc(tracks.createdAt));
  }

  async getTracksByUser(userId: string): Promise<Track[]> {
    return await db.select()
      .from(tracks)
      .where(eq(tracks.uploadedBy, userId))
      .orderBy(desc(tracks.createdAt));
  }

  async updateTrackHDStatus(trackId: string, hdAudioUrl: string, isHD: boolean): Promise<void> {
    await db.update(tracks)
      .set({ hdAudioUrl, isHD })
      .where(eq(tracks.id, trackId));
  }

  async deleteTrack(trackId: string): Promise<void> {
    await db.delete(tracks).where(eq(tracks.id, trackId));
  }

  async searchTracks(query: string): Promise<Track[]> {
    return await db.select()
      .from(tracks)
      .where(
        sql`${tracks.title} ILIKE ${`%${query}%`} OR ${tracks.artist} ILIKE ${`%${query}%`} OR ${tracks.album} ILIKE ${`%${query}%`}`
      )
      .orderBy(desc(tracks.createdAt))
      .limit(50);
  }

  // Likes
  async likeTrack(like: InsertTrackLike): Promise<TrackLike> {
    // upsert-like (avoid duplicates for same user/track)
    const existing = await db.select().from(trackLikes)
      .where(sql`${trackLikes.userId} = ${like.userId} AND ${trackLikes.trackId} = ${like.trackId}`)
      .limit(1);
    if (existing[0]) return existing[0];
    const result = await db.insert(trackLikes).values(like).returning();
    return result[0];
  }

  async unlikeTrack(userId: string, trackId: string): Promise<void> {
    await db.delete(trackLikes)
      .where(sql`${trackLikes.userId} = ${userId} AND ${trackLikes.trackId} = ${trackId}`);
  }

  async isTrackLiked(userId: string, trackId: string): Promise<boolean> {
    const result = await db.select({ count: sql<number>`COUNT(*)` })
      .from(trackLikes)
      .where(sql`${trackLikes.userId} = ${userId} AND ${trackLikes.trackId} = ${trackId}`);
    const count = Number((result[0] as any)?.count ?? 0);
    return count > 0;
  }

  async getLikedTracks(userId: string): Promise<Track[]> {
    return await db.select().from(tracks)
      .where(sql`${tracks.id} IN (SELECT ${trackLikes.trackId} FROM ${trackLikes} WHERE ${trackLikes.userId} = ${userId})`)
      .orderBy(desc(tracks.createdAt));
  }
}
