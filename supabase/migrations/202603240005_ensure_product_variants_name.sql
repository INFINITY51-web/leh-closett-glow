-- Garante o nome obrigatório das variantes de produtos.
-- Idempotente: pode ser executada mais de uma vez.
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS name text;

UPDATE public.product_variants AS variant
SET name = COALESCE(NULLIF(CONCAT_WS(' - ', product.name, variant.color, variant.size), ''), variant.sku)
FROM public.products AS product
WHERE product.id = variant.product_id
  AND (variant.name IS NULL OR BTRIM(variant.name) = '');

ALTER TABLE public.product_variants
  ALTER COLUMN name SET NOT NULL;

COMMENT ON COLUMN public.product_variants.name IS 'Nome de exibição da variante do produto';

NOTIFY pgrst, 'reload schema';
