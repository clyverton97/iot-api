require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(cors({ origin: '*' }));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  timezone: 'Z',
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 10000
});

// Rota de teste simples para garantir status 200 imediato
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', mensagem: 'Render funcionando perfeitamente!' });
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'conectado' });
  } catch (e) {
    res.status(500).json({ status: 'erro', db: e.message });
  }
});

// Rota /estado que o seu front-end do Netlify está procurando (com status 200)
app.get(['/estado', '/api/estado'], async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, temperatura, umidade, atleta, ponto, tag, bpm, rssi, data_hora
         FROM leituras ORDER BY id DESC LIMIT 1`
    );
    res.status(200).json({
      status: 'sucesso',
      dado: rows[0] || { temperatura: 0, umidade: 0 }
    });
  } catch (e) {
    console.error('Erro no /estado:', e.message);
    res.status(500).json({ error: 'erro ao ler do banco' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
