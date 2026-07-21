const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/:servicoId', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM scripts WHERE servico_id = $1', [req.params.servicoId]);
  res.json(rows[0] || null);
});

module.exports = router;
