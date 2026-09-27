-- Adiciona a URL do vídeo ao cadastro de produtos.
-- Idempotente: pode ser executada mais de uma vez.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS video_url text;

COMMENT ON COLUMN public.products.video_url IS 'URL pública do vídeo do produto';

NOTIFY pgrst, 'reload schema';
