-- Corrige o cadastro e a leitura das imagens dos produtos.
-- Idempotente: pode ser executada mais de uma vez.
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.product_images.image_url IS 'URL pública da imagem do produto';

NOTIFY pgrst, 'reload schema';
