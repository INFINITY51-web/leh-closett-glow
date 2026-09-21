-- Impede que CPF ou telefone normalizados sejam vinculados a mais de um perfil.
-- A criação dos índices falha de propósito se já houver duplicidades, preservando os dados
-- para correção manual antes de aplicar a proteção.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_normalized_unique
  ON public.profiles ((regexp_replace(cpf, '[^0-9]', '', 'g')))
  WHERE cpf IS NOT NULL AND regexp_replace(cpf, '[^0-9]', '', 'g') <> '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_normalized_unique
  ON public.profiles ((regexp_replace(phone, '[^0-9]', '', 'g')))
  WHERE phone IS NOT NULL AND regexp_replace(phone, '[^0-9]', '', 'g') <> '';
