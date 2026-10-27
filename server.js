const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(cors({ origin: '*' }));

// Rota raiz para manter o Render acordado
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', mensagem: 'API a funcionar perfeitamente!' });
});

// Rota /estado que o Netlify procura (retorna dados simulados com sucesso 200)
app.get(['/estado', '/api/estado'], (_req, res) => {
  res.status(200).json({
    status: 'sucesso',
    temperatura: 25.5,
    umidade: 60,
    atleta: 1,
    ponto: 0,
    bpm: 75,
    rssi: -65,
    tag: 'A',
    data_hora: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
