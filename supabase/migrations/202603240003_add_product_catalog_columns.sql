-- Compatibiliza o schema do catálogo com a página de adicionar produtos.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS size text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS price_override numeric,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

NOTIFY pgrst, 'reload schema';
