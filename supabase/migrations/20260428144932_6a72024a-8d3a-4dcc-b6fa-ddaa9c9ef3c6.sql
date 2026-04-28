-- Time blocks table for Architect timetable engine
CREATE TABLE public.time_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'work',
  color TEXT,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_minute SMALLINT NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute SMALLINT NOT NULL CHECK (end_minute BETWEEN 1 AND 1440),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT time_blocks_valid_range CHECK (end_minute > start_minute)
);

ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time_blocks"
  ON public.time_blocks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time_blocks"
  ON public.time_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time_blocks"
  ON public.time_blocks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time_blocks"
  ON public.time_blocks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_time_blocks_user_day ON public.time_blocks(user_id, day_of_week);

CREATE TRIGGER update_time_blocks_updated_at
  BEFORE UPDATE ON public.time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();