require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const servicosRouter = require('./routes/servicos');
const scriptsRouter = require('./routes/scripts');
const treinarRouter = require('./routes/treinar');
const historicoRouter = require('./routes/historico');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/servicos', servicosRouter);
app.use('/api/scripts', scriptsRouter);
app.use('/api/treinar', treinarRouter);
app.use('/api/historico', historicoRouter);

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
