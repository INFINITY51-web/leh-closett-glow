-- Adiciona o campo usado pelo cadastro e pelos filtros de produtos em destaque.
-- Seguro para execução repetida.
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.featured IS 'Define se o produto aparece como destaque na vitrine.';

-- Atualiza o cache de schema do PostgREST após a alteração.
NOTIFY pgrst, 'reload schema';
