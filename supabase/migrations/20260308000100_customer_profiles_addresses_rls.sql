-- Garante o modelo de clientes: cada usuário autenticado acessa apenas os próprios dados.
-- O proprietário continua sendo o único administrador por meio de profiles.role = 'admin'.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.addresses TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'customers_read_own_profile') THEN
    CREATE POLICY customers_read_own_profile ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'customers_insert_own_profile') THEN
    CREATE POLICY customers_insert_own_profile ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'customers_update_own_profile') THEN
    CREATE POLICY customers_update_own_profile ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' AND policyname = 'customers_read_own_addresses') THEN
    CREATE POLICY customers_read_own_addresses ON public.addresses FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' AND policyname = 'customers_insert_own_addresses') THEN
    CREATE POLICY customers_insert_own_addresses ON public.addresses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' AND policyname = 'customers_update_own_addresses') THEN
    CREATE POLICY customers_update_own_addresses ON public.addresses FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' AND policyname = 'customers_delete_own_addresses') THEN
    CREATE POLICY customers_delete_own_addresses ON public.addresses FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_role_active_idx ON public.profiles (role, is_active);
CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses (user_id);
