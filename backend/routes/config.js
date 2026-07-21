const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/anthropic-key', async (req, res) => {
  const { rows } = await pool.query("SELECT valor FROM config WHERE chave = 'anthropic_api_key'");
  const valor = rows[0]?.valor || process.env.ANTHROPIC_API_KEY || '';
  res.json({ configurada: !!valor, mascarada: valor ? valor.slice(0, 10) + '...' + valor.slice(-4) : '' });
});

router.post('/anthropic-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || !apiKey.trim()) return res.status(400).json({ error: 'Chave é obrigatória' });
  await pool.query(`
    INSERT INTO config (chave, valor) VALUES ('anthropic_api_key', $1)
    ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor
  `, [apiKey.trim()]);
  res.json({ ok: true });
});

module.exports = router;
