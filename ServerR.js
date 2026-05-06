/**
 * server-right.js — Rueda derecha (puerto 3001)
 */
const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors());
app.use(express.json());

let ticksR = 0;

// Simulación automática cada 500ms
setInterval(() => {
  if (Math.random() > 0.4) ticksR++;
}, 500);

// GET /ticks — valor actual
app.get('/ticks', (req, res) => {
  res.json({ ticks: ticksR });
});

// POST /tick — incremento manual
app.post('/tick', (req, res) => {
  ticksR++;
  res.json({ ticks: ticksR });
});

// POST /reset — setear a valor específico
app.post('/reset', (req, res) => {
  const { value = 0 } = req.body;
  ticksR = Number(value);
  res.json({ ticks: ticksR });
});

app.listen(3001, () => console.log('🟠 Rueda DERECHA en http://localhost:3001'));