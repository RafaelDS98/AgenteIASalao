const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT h.*, s.nome AS servico_nome FROM historico h
    JOIN servicos s ON s.id = h.servico_id
    ORDER BY h.criado_em DESC
  `);
  res.json(rows);
});

router.get('/:servicoId', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT h.*, s.nome AS servico_nome FROM historico h
    JOIN servicos s ON s.id = h.servico_id
    WHERE h.servico_id = $1
    ORDER BY h.criado_em DESC
  `, [req.params.servicoId]);
  res.json(rows);
});

module.exports = router;
