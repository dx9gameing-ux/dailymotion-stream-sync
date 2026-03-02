
-- Videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  thumbnail TEXT,
  duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  view_count INTEGER DEFAULT 0,
  -- Series detection fields
  series_name TEXT,
  season_number INTEGER,
  episode_number INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos are publicly readable"
ON public.videos FOR SELECT
USING (true);

CREATE POLICY "Service role can insert/update/delete videos"
ON public.videos FOR ALL
USING (auth.role() = 'service_role');

-- Sync log table
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  videos_added INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  error_message TEXT
);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sync logs are publicly readable"
ON public.sync_logs FOR SELECT
USING (true);

CREATE POLICY "Service role can manage sync logs"
ON public.sync_logs FOR ALL
USING (auth.role() = 'service_role');

-- Index for search
CREATE INDEX idx_videos_title ON public.videos USING gin(to_tsvector('english', title));
CREATE INDEX idx_videos_series ON public.videos(series_name, season_number, episode_number);
CREATE INDEX idx_videos_created ON public.videos(created_at DESC);
