
-- Profiles table (extends auth.users with X handle info)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  x_handle TEXT UNIQUE,
  x_user_id TEXT UNIQUE,
  x_name TEXT,
  x_avatar_url TEXT,
  x_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dev_address TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 5 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dev_address, author_id)
);

CREATE INDEX reviews_dev_address_idx ON public.reviews(lower(dev_address));
CREATE INDEX reviews_author_idx ON public.reviews(author_id);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE USING (auth.uid() = author_id);

-- Tracked devs (cache of addresses seen by the platform)
CREATE TABLE public.tracked_devs (
  address TEXT PRIMARY KEY,
  first_tracked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tracked_devs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.tracked_devs TO authenticated;
GRANT ALL ON public.tracked_devs TO service_role;
ALTER TABLE public.tracked_devs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tracked devs are public"
  ON public.tracked_devs FOR SELECT USING (true);
CREATE POLICY "Authenticated can upsert tracked devs"
  ON public.tracked_devs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update tracked devs"
  ON public.tracked_devs FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, x_handle, x_user_id, x_name, x_avatar_url, x_verified)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'x_handle',
    NEW.raw_user_meta_data->>'x_user_id',
    NEW.raw_user_meta_data->>'x_name',
    NEW.raw_user_meta_data->>'x_avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'x_verified')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
