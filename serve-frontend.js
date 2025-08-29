const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Servir arquivos estáticos do diretório dist
app.use(express.static(path.join(__dirname, 'dist')));

// Rota para todas as outras requisições (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend servindo na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
