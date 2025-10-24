-- Create track_likes table if not exists
CREATE TABLE IF NOT EXISTS track_likes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  track_id varchar NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Optional: basic index to avoid duplicates and speed up lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_track_likes_user_track ON track_likes(user_id, track_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_user ON track_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_track ON track_likes(track_id);



