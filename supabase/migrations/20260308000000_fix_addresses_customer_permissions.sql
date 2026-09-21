-- Permite que cada cliente autenticado gerencie somente os próprios endereços.
-- A política não chama is_admin: o salvamento do cliente não depende de privilégios administrativos.

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT p.policyname
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'addresses'
      AND (COALESCE(p.qual, '') ILIKE '%is_admin%' OR COALESCE(p.with_check, '') ILIKE '%is_admin%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.addresses', policy_record.policyname);
  END LOOP;
END $$;

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS addresses_customer_select ON public.addresses;
CREATE POLICY addresses_customer_select
  ON public.addresses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS addresses_customer_insert ON public.addresses;
CREATE POLICY addresses_customer_insert
  ON public.addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS addresses_customer_update ON public.addresses;
CREATE POLICY addresses_customer_update
  ON public.addresses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS addresses_customer_delete ON public.addresses;
CREATE POLICY addresses_customer_delete
  ON public.addresses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
