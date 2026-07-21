const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM servicos ORDER BY id');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { nome } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO servicos (nome) VALUES ($1) RETURNING *',
      [nome.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Este serviço já está cadastrado' });
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM servicos WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

module.exports = router;
