import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'dist')));

// Rota para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend rodando em: http://localhost:${PORT}`);
  console.log(`📁 Servindo arquivos de: ${path.join(__dirname, 'dist')}`);
});
