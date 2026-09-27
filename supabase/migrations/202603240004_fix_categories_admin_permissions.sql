-- Permissões necessárias para o cadastro de categorias no painel administrativo.
-- A autorização continua protegida pela função public.is_admin().

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_admin_select ON public.categories;
CREATE POLICY categories_admin_select
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS categories_admin_insert ON public.categories;
CREATE POLICY categories_admin_insert
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS categories_admin_update ON public.categories;
CREATE POLICY categories_admin_update
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS categories_admin_delete ON public.categories;
CREATE POLICY categories_admin_delete
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
