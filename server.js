require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  timezone: 'Z',                 // datas lidas/gravadas em UTC
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 10000
});

// ---------- util ----------
const num = (v, min, max) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : NaN;
};

function exigirChave(req, res, next) {
  const chave = process.env.API_KEY;
  if (chave && req.get('x-api-key') !== chave) {
    return res.status(401).json({ error: 'chave inválida' });
  }
  next();
}

// ---------- rotas ----------
app.get('/', (_req, res) => res.json({ status: 'ok' }));          // ping para manter o Render acordado

app.get('/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', db: 'ok' }); }
  catch (e) { res.status(500).json({ status: 'erro', db: e.code || e.message }); }
});

// Recebe a leitura (vinda da Netlify Function) e grava no MySQL
app.post('/api/dados', exigirChave, async (req, res) => {
  const b = req.body || {};
  const temperatura = num(b.temperatura, -40, 80);
  const umidade     = num(b.umidade, 0, 100);
  const atleta      = num(b.atleta, 1, 255);
  const ponto       = num(b.ponto, 0, 50);
  const bpm         = num(b.bpm, 0, 300);
  const rssi        = num(b.rssi, -150, 0);
  const tag         = b.tag == null ? null : String(b.tag).toUpperCase();

  const invalido = [temperatura, umidade, atleta, ponto, bpm, rssi].some(Number.isNaN)
    || (tag !== null && !['A', 'B'].includes(tag));
  const vazio = temperatura === null && umidade === null && atleta === null;
  if (invalido || vazio) return res.status(400).json({ error: 'dados inválidos' });

  try {
    const [r] = await pool.execute(
      `INSERT INTO leituras (temperatura, umidade, atleta, ponto, tag, bpm, rssi, data_hora)
       VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [temperatura, umidade, atleta, ponto, tag, bpm, rssi]
    );
    res.status(201).json({ status: 'sucesso', id: r.insertId });
  } catch (e) {
    console.error('INSERT falhou:', e.message);
    res.status(500).json({ error: 'erro ao gravar no banco' });
  }
});

// Últimos registros para o front-end: GET /api/dados?limit=30
app.get('/api/dados', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200);
  try {
    const [rows] = await pool.query(
      `SELECT id, temperatura, umidade, atleta, ponto, tag, bpm, rssi, data_hora
         FROM leituras ORDER BY id DESC LIMIT ?`, [limit]);
    res.json(rows.map(r => ({ ...r, data_hora: r.data_hora instanceof Date ? r.data_hora.toISOString() : r.data_hora })));
  } catch (e) {
    console.error('SELECT falhou:', e.message);
    res.status(500).json({ error: 'erro ao ler do banco' });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'rota não encontrada' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
