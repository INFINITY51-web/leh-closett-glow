-- Permite que o cliente autenticado crie/atualize somente o próprio perfil.
-- Não concede acesso administrativo nem altera outras tabelas.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own') THEN
    CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_insert_own') THEN
    CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_own') THEN
    CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;
