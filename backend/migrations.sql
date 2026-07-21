CREATE TABLE IF NOT EXISTS servicos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) UNIQUE NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scripts (
  id SERIAL PRIMARY KEY,
  servico_id INTEGER REFERENCES servicos(id) ON DELETE CASCADE UNIQUE,
  resumo TEXT,
  pontos_fortes JSONB,
  abertura JSONB,
  qualificacao JSONB,
  apresentacao_servico JSONB,
  tratamento_objecoes JSONB,
  fechamento JSONB,
  pix_pagamento JSONB,
  tom_linguagem TEXT,
  frases_chave JSONB,
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historico (
  id SERIAL PRIMARY KEY,
  servico_id INTEGER REFERENCES servicos(id) ON DELETE CASCADE,
  preview TEXT,
  resultado JSONB,
  criado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO servicos (nome) VALUES
  ('Cílios'),
  ('Manicure simples'),
  ('Banho de gel'),
  ('Alongamento fibra de vidro'),
  ('Mega hair na queratina')
ON CONFLICT (nome) DO NOTHING;
