import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const listeningRooms = pgTable("listening_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  hostId: varchar("host_id").notNull(),
  currentTrackId: text("current_track_id"),
  currentPosition: integer("current_position").default(0),
  isPlaying: boolean("is_playing").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertListeningRoomSchema = createInsertSchema(listeningRooms).omit({
  id: true,
  createdAt: true,
});

export type InsertListeningRoom = z.infer<typeof insertListeningRoomSchema>;
export type ListeningRoom = typeof listeningRooms.$inferSelect;

export const roomParticipants = pgTable("room_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  canControl: boolean("can_control").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertRoomParticipantSchema = createInsertSchema(roomParticipants).omit({
  id: true,
  joinedAt: true,
});

export type InsertRoomParticipant = z.infer<typeof insertRoomParticipantSchema>;
export type RoomParticipant = typeof roomParticipants.$inferSelect;

export const roomQueue = pgTable("room_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  trackId: text("track_id").notNull(),
  trackTitle: text("track_title").notNull(),
  trackArtist: text("track_artist").notNull(),
  trackAlbum: text("track_album").notNull(),
  trackDuration: text("track_duration").notNull(),
  trackAlbumCover: text("track_album_cover").notNull(),
  trackAudioUrl: text("track_audio_url"),
  trackHDAudioUrl: text("track_hd_audio_url"),
  isHD: boolean("is_hd").default(false),
  position: integer("position").notNull(),
  addedBy: varchar("added_by").notNull(),
});

export const insertRoomQueueSchema = createInsertSchema(roomQueue).omit({
  id: true,
});

export type InsertRoomQueue = z.infer<typeof insertRoomQueueSchema>;
export type RoomQueue = typeof roomQueue.$inferSelect;

export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  friendId: varchar("friend_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
});

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

export const musicActivities = pgTable("music_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  activityType: text("activity_type").notNull(),
  trackId: text("track_id"),
  trackTitle: text("track_title"),
  trackArtist: text("track_artist"),
  trackAlbum: text("track_album"),
  trackAlbumCover: text("track_album_cover"),
  message: text("message"),
  sharedWith: text("shared_with").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMusicActivitySchema = createInsertSchema(musicActivities).omit({
  id: true,
  createdAt: true,
});

export type InsertMusicActivity = z.infer<typeof insertMusicActivitySchema>;
export type MusicActivity = typeof musicActivities.$inferSelect;

export const activityReactions = pgTable("activity_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").notNull(),
  userId: varchar("user_id").notNull(),
  reactionType: text("reaction_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityReactionSchema = createInsertSchema(activityReactions).omit({
  id: true,
  createdAt: true,
});

export type InsertActivityReaction = z.infer<typeof insertActivityReactionSchema>;
export type ActivityReaction = typeof activityReactions.$inferSelect;

export const activityComments = pgTable("activity_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").notNull(),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityCommentSchema = createInsertSchema(activityComments).omit({
  id: true,
  createdAt: true,
});

export type InsertActivityComment = z.infer<typeof insertActivityCommentSchema>;
export type ActivityComment = typeof activityComments.$inferSelect;

export const vibes = pgTable("vibes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  trackId: text("track_id").notNull(),
  trackTitle: text("track_title").notNull(),
  trackArtist: text("track_artist").notNull(),
  trackAlbumCover: text("track_album_cover").notNull(),
  startTime: integer("start_time").notNull().default(0),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertVibeSchema = createInsertSchema(vibes).omit({
  id: true,
  createdAt: true,
});

export type InsertVibe = z.infer<typeof insertVibeSchema>;
export type Vibe = typeof vibes.$inferSelect;

export const vibeReactions = pgTable("vibe_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vibeId: varchar("vibe_id").notNull(),
  userId: varchar("user_id").notNull(),
  reactionType: text("reaction_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVibeReactionSchema = createInsertSchema(vibeReactions).omit({
  id: true,
  createdAt: true,
});

export type InsertVibeReaction = z.infer<typeof insertVibeReactionSchema>;
export type VibeReaction = typeof vibeReactions.$inferSelect;

export const vibeComments = pgTable("vibe_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vibeId: varchar("vibe_id").notNull(),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVibeCommentSchema = createInsertSchema(vibeComments).omit({
  id: true,
  createdAt: true,
});

export type InsertVibeComment = z.infer<typeof insertVibeCommentSchema>;
export type VibeComment = typeof vibeComments.$inferSelect;

export const vibeShareRequests = pgTable("vibe_share_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vibeId: varchar("vibe_id").notNull(),
  requesterId: varchar("requester_id").notNull(),
  requesterUsername: text("requester_username").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVibeShareRequestSchema = createInsertSchema(vibeShareRequests).omit({
  id: true,
  createdAt: true,
});

export type InsertVibeShareRequest = z.infer<typeof insertVibeShareRequestSchema>;
export type VibeShareRequest = typeof vibeShareRequests.$inferSelect;

export const hdAudioConversions = pgTable("hd_audio_conversions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalUrl: text("original_url").notNull(),
  hdUrl: text("hd_url").notNull(),
  originalBitrate: integer("original_bitrate").notNull(),
  originalSampleRate: integer("original_sample_rate").notNull(),
  originalChannels: integer("original_channels").notNull(),
  originalFormat: text("original_format").notNull(),
  originalSize: integer("original_size").notNull(),
  hdBitrate: integer("hd_bitrate").notNull(),
  hdSampleRate: integer("hd_sample_rate").notNull(),
  hdChannels: integer("hd_channels").notNull(),
  hdFormat: text("hd_format").notNull(),
  hdSize: integer("hd_size").notNull(),
  conversionTime: integer("conversion_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHDAudioConversionSchema = createInsertSchema(hdAudioConversions).omit({
  id: true,
  createdAt: true,
});

export type InsertHDAudioConversion = z.infer<typeof insertHDAudioConversionSchema>;
export type HDAudioConversion = typeof hdAudioConversions.$inferSelect;

export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album").notNull(),
  duration: text("duration").notNull(),
  albumCover: text("album_cover").notNull(),
  audioUrl: text("audio_url").notNull(),
  hdAudioUrl: text("hd_audio_url"),
  isHD: boolean("is_hd").default(false),
  uploadedBy: varchar("uploaded_by").notNull(),
  fileSize: integer("file_size").notNull(),
  format: text("format").notNull(),
  bitrate: integer("bitrate"),
  sampleRate: integer("sample_rate"),
  channels: integer("channels"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
  createdAt: true,
});

export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Track = typeof tracks.$inferSelect;

// Track likes
export const trackLikes = pgTable("track_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  trackId: varchar("track_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrackLikeSchema = createInsertSchema(trackLikes).omit({
  id: true,
  createdAt: true,
});

export type InsertTrackLike = z.infer<typeof insertTrackLikeSchema>;
export type TrackLike = typeof trackLikes.$inferSelect;
