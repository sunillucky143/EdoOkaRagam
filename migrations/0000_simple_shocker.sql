CREATE TABLE "activity_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"reaction_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"friend_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hd_audio_conversions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_url" text NOT NULL,
	"hd_url" text NOT NULL,
	"original_bitrate" integer NOT NULL,
	"original_sample_rate" integer NOT NULL,
	"original_channels" integer NOT NULL,
	"original_format" text NOT NULL,
	"original_size" integer NOT NULL,
	"hd_bitrate" integer NOT NULL,
	"hd_sample_rate" integer NOT NULL,
	"hd_channels" integer NOT NULL,
	"hd_format" text NOT NULL,
	"hd_size" integer NOT NULL,
	"conversion_time" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "listening_rooms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"host_id" varchar NOT NULL,
	"current_track_id" text,
	"current_position" integer DEFAULT 0,
	"is_playing" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "music_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"activity_type" text NOT NULL,
	"track_id" text,
	"track_title" text,
	"track_artist" text,
	"track_album" text,
	"track_album_cover" text,
	"message" text,
	"shared_with" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "room_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text NOT NULL,
	"can_control" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "room_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar NOT NULL,
	"track_id" text NOT NULL,
	"track_title" text NOT NULL,
	"track_artist" text NOT NULL,
	"track_album" text NOT NULL,
	"track_duration" text NOT NULL,
	"track_album_cover" text NOT NULL,
	"track_audio_url" text,
	"track_hd_audio_url" text,
	"is_hd" boolean DEFAULT false,
	"position" integer NOT NULL,
	"added_by" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"track_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"album" text NOT NULL,
	"duration" text NOT NULL,
	"album_cover" text NOT NULL,
	"audio_url" text NOT NULL,
	"hd_audio_url" text,
	"is_hd" boolean DEFAULT false,
	"uploaded_by" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"format" text NOT NULL,
	"bitrate" integer,
	"sample_rate" integer,
	"channels" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vibe_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vibe_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vibe_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vibe_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"reaction_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vibe_share_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vibe_id" varchar NOT NULL,
	"requester_id" varchar NOT NULL,
	"requester_username" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vibes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"track_id" text NOT NULL,
	"track_title" text NOT NULL,
	"track_artist" text NOT NULL,
	"track_album_cover" text NOT NULL,
	"start_time" integer DEFAULT 0 NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL
);
