-- Run this in Supabase Dashboard → SQL Editor

-- 사용자 플랜 및 일일 사용량
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  plan        TEXT NOT NULL DEFAULT 'free',
  daily_count INT  NOT NULL DEFAULT 0,
  reset_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 분류 히스토리
CREATE TABLE IF NOT EXISTS public.classifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url   TEXT,
  top1_label  TEXT NOT NULL,
  top1_conf   FLOAT NOT NULL,
  results     JSONB NOT NULL,
  sigma       FLOAT,
  backend     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON public.users
  FOR ALL USING (id = auth.uid());

CREATE POLICY "classifications_own_data" ON public.classifications
  FOR ALL USING (user_id = auth.uid());

-- 신규 유저 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
