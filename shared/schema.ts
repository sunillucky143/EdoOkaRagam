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
  position: integer("position").notNull(),
  addedBy: varchar("added_by").notNull(),
});

export const insertRoomQueueSchema = createInsertSchema(roomQueue).omit({
  id: true,
});

export type InsertRoomQueue = z.infer<typeof insertRoomQueueSchema>;
export type RoomQueue = typeof roomQueue.$inferSelect;
