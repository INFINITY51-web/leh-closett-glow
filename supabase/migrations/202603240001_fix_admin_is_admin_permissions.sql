-- Corrige a autorização administrativa sem confiar no frontend.
-- A função é executada pelo contexto do owner e pode ser chamada pelas policies.
DO $$
DECLARE
  function_record record;
BEGIN
  FOR function_record IN
    SELECT n.nspname AS schema_name,
           p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'is_admin'
      AND n.nspname IN ('public', 'private')
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', function_record.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', function_record.signature);
  END LOOP;
END $$;

-- Garante que o administrador solicitado tenha perfil administrativo ativo.
-- Não cria usuário Auth: o usuário precisa existir previamente em auth.users.
UPDATE public.profiles AS profile
SET role = 'admin',
    is_active = true,
    updated_at = COALESCE(profile.updated_at, now())
FROM auth.users AS auth_user
WHERE profile.id = auth_user.id
  AND lower(auth_user.email) = 'lehclosettl@gmail.com';

-- Permite a própria sessão autenticada ler seu perfil para validar o painel.
GRANT SELECT ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policies administrativas devem usar is_admin() sem bloquear o EXECUTE.
-- Estas policies são aditivas e não removem regras existentes.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['products', 'product_variants', 'product_images']
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name);
    END IF;
  END LOOP;
END $$;
