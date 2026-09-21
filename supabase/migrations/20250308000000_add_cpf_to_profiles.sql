ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf text;

COMMENT ON COLUMN public.profiles.cpf IS 'CPF do cliente, armazenado somente com 11 dígitos';
