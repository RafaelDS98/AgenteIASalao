const express = require('express');
const router = express.Router();
const pool = require('../db');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCHEMA_HINT = `Responda APENAS com JSON válido (sem markdown, sem backticks):
{
  "resumo": "resumo do padrão de atendimento",
  "pontos_fortes": ["ponto 1","ponto 2"],
  "abertura": ["técnica 1","técnica 2"],
  "qualificacao": ["pergunta/técnica 1","2"],
  "apresentacao_servico": ["técnica 1","2"],
  "tratamento_objecoes": ["objeção e como foi contornada 1","2"],
  "fechamento": ["técnica 1","2"],
  "pix_pagamento": ["como conduziu ao PIX 1","2"],
  "tom_linguagem": "descrição do tom",
  "frases_chave": ["frase que converte 1","2","3"]
}`;

router.post('/', async (req, res) => {
  const { servicoId, conversa } = req.body;
  if (!servicoId || !conversa || !conversa.trim()) {
    return res.status(400).json({ error: 'servicoId e conversa são obrigatórios' });
  }

  const { rows: servicoRows } = await pool.query('SELECT * FROM servicos WHERE id = $1', [servicoId]);
  const servico = servicoRows[0];
  if (!servico) return res.status(404).json({ error: 'Serviço não encontrado' });

  const { rows: scriptRows } = await pool.query('SELECT * FROM scripts WHERE servico_id = $1', [servicoId]);
  const scriptAtual = scriptRows[0];

  const contexto = scriptAtual
    ? `\n\nCONTEXTO: Já existe um script para este serviço. Mescle com os novos padrões identificados, mantendo o que já estava bom e adicionando novas técnicas.\nScript atual: ${JSON.stringify(scriptAtual)}`
    : '';

  const systemPrompt = `Você é um especialista em análise de atendimento comercial para salões de beleza.
Analise a conversa de WhatsApp onde a cliente FECHOU o serviço de "${servico.nome}" e extraia um script de atendimento.${contexto}

${SCHEMA_HINT}`;

  let parsed;
  try {
    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Analise esta conversa de ${servico.nome}:\n\n${conversa}` }]
    });
    const raw = (resp.content && resp.content[0] && resp.content[0].text) || '';
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'Erro ao processar com a IA. Tente novamente.' });
  }

  const { rows: savedRows } = await pool.query(`
    INSERT INTO scripts (servico_id, resumo, pontos_fortes, abertura, qualificacao, apresentacao_servico, tratamento_objecoes, fechamento, pix_pagamento, tom_linguagem, frases_chave, atualizado_em)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW())
    ON CONFLICT (servico_id) DO UPDATE SET
      resumo = EXCLUDED.resumo,
      pontos_fortes = EXCLUDED.pontos_fortes,
      abertura = EXCLUDED.abertura,
      qualificacao = EXCLUDED.qualificacao,
      apresentacao_servico = EXCLUDED.apresentacao_servico,
      tratamento_objecoes = EXCLUDED.tratamento_objecoes,
      fechamento = EXCLUDED.fechamento,
      pix_pagamento = EXCLUDED.pix_pagamento,
      tom_linguagem = EXCLUDED.tom_linguagem,
      frases_chave = EXCLUDED.frases_chave,
      atualizado_em = NOW()
    RETURNING *
  `, [
    servicoId,
    parsed.resumo || '',
    JSON.stringify(parsed.pontos_fortes || []),
    JSON.stringify(parsed.abertura || []),
    JSON.stringify(parsed.qualificacao || []),
    JSON.stringify(parsed.apresentacao_servico || []),
    JSON.stringify(parsed.tratamento_objecoes || []),
    JSON.stringify(parsed.fechamento || []),
    JSON.stringify(parsed.pix_pagamento || []),
    parsed.tom_linguagem || '',
    JSON.stringify(parsed.frases_chave || [])
  ]);

  const preview = conversa.trim().slice(0, 100) + (conversa.trim().length > 100 ? '...' : '');
  await pool.query(
    'INSERT INTO historico (servico_id, preview, resultado) VALUES ($1,$2,$3)',
    [servicoId, preview, JSON.stringify(parsed)]
  );

  res.json(savedRows[0]);
});

module.exports = router;
