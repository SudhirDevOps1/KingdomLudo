-- ==============================================================================
-- KingdomLudo — Migration: Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Target: Supabase PostgreSQL (auth.users, public tables, RLS)
-- ==============================================================================

-- 1. Profiles (Linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  selected_character_id TEXT NOT NULL DEFAULT 'ignis-drake',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Player Preferences
CREATE TABLE IF NOT EXISTS public.player_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  master_muted BOOLEAN NOT NULL DEFAULT FALSE,
  graphics_quality TEXT NOT NULL DEFAULT 'high',
  cinematic_camera BOOLEAN NOT NULL DEFAULT TRUE,
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  prefer_2d BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Player Lifetime Statistics
CREATE TABLE IF NOT EXISTS public.player_statistics (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  matches_played INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  captures INT NOT NULL DEFAULT 0,
  pieces_finished INT NOT NULL DEFAULT 0,
  sixes_rolled INT NOT NULL DEFAULT 0,
  win_streak INT NOT NULL DEFAULT 0,
  best_win_streak INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Matches Record (Completed games)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT,
  mode TEXT NOT NULL,
  board_theme_id TEXT NOT NULL,
  winner_color TEXT NOT NULL,
  player_count INT NOT NULL,
  duration_ms INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Match Participants
CREATE TABLE IF NOT EXISTS public.match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  color TEXT NOT NULL,
  character_id TEXT NOT NULL,
  finished_rank INT,
  captures INT NOT NULL DEFAULT 0,
  pieces_home INT NOT NULL DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON public.match_players (match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_user_id ON public.match_players (user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can view profiles, users can only update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Preferences: Users can view and manage only their own preferences
CREATE POLICY "Users can view own preferences"
  ON public.player_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.player_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Player Statistics: Public leaderboard visibility, user can only update own
CREATE POLICY "Public stats are viewable by everyone"
  ON public.player_statistics FOR SELECT
  USING (true);

CREATE POLICY "Users can update own stats"
  ON public.player_statistics FOR UPDATE
  USING (auth.uid() = user_id);

-- Matches: Public read access
CREATE POLICY "Matches are viewable by everyone"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "Match players are viewable by everyone"
  ON public.match_players FOR SELECT
  USING (true);

-- Auto-create profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Royal Voyager'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.player_preferences (user_id) VALUES (NEW.id);
  INSERT INTO public.player_statistics (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
