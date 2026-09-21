-- Corrige o erro "permission denied for function is_admin" nas policies de profiles.
-- A função é usada pelas policies de RLS e precisa ser executável pelo papel
-- autenticado que faz o upsert do próprio perfil.

DO $$
DECLARE
  function_signature text;
BEGIN
  SELECT format('%I.%I(%s)', n.nspname, p.proname,
    pg_get_function_identity_arguments(p.oid))
  INTO function_signature
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'is_admin'
  ORDER BY p.oid
  LIMIT 1;

  IF function_signature IS NOT NULL THEN
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', function_signature);
  END IF;
END $$;

-- Garante que o cliente autenticado consiga criar/atualizar somente o próprio perfil.
-- Não altera endereços, carrinho, frete ou pagamento.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
