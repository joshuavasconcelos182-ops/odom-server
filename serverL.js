/**
 * server-left.js — Rueda izquierda (puerto 3000)
 */
const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors());
app.use(express.json());

let ticksL = 0;

// Simulación automática cada 500ms
setInterval(() => {
  if (Math.random() > 0.4) ticksL++;
}, 500);

// GET /ticks — valor actual
app.get('/ticks', (req, res) => {
  res.json({ ticks: ticksL });
});

// POST /tick — incremento manual
app.post('/tick', (req, res) => {
  ticksL++;
  res.json({ ticks: ticksL });
});

// POST /reset — setear a valor específico
app.post('/reset', (req, res) => {
  const { value = 0 } = req.body;
  ticksL = Number(value);
  res.json({ ticks: ticksL });
});

app.listen(3000, () => console.log('🔵 Rueda IZQUIERDA en http://localhost:3000'));