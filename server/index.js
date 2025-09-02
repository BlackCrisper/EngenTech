import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do arquivo .env no diretório principal
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });
console.log('[INFO] Caminho do .env:', envPath);

// Verificar se o arquivo foi carregado
if (fs.existsSync(envPath)) {
  console.log('[SUCCESS] Arquivo .env encontrado');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('[INFO] Conteúdo do .env:', envContent);
} else {
  console.log('[ERROR] Arquivo .env não encontrado');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://10.11.100.3:8080', 'http://10.11.3.149:8080'],
  credentials: true, // Permitir credenciais
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Importar rotas
import dashboardRoutes from './routes/dashboard.js';
import usersRoutes from './routes/users.js';
import areasRoutes from './routes/areas.js';
import equipmentRoutes from './routes/equipment.js';
import reportsRoutes from './routes/reports.js';
import sesmtRoutes from './routes/sesmt.js';
import authRoutes from './routes/auth.js';
import systemRoutes from './routes/system.js';
import progressRoutes from './routes/progress.js';
import tasksRoutes from './routes/tasks.js';
import projectsRoutes from './routes/projects.js';

// Rotas da API
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sesmt', sesmtRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/projects', projectsRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EnginSync API está funcionando!',
    timestamp: new Date().toISOString(),
    database: 'SQL Server - EngenTech'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('[ERROR] Erro na API:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Rota 404 para endpoints não encontrados
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SUCCESS] Servidor EnginSync rodando na porta ${PORT}`);
  console.log(`[INFO] API disponível em: http://localhost:${PORT}/api`);
  console.log(`[INFO] API disponível em: http://0.0.0.0:${PORT}/api`);
  console.log(`[INFO] Health check: http://localhost:${PORT}/api/health`);
});

// Tratamento de erros do servidor
server.on('error', (error) => {
  console.error('[ERROR] Erro no servidor:', error);
});

// Manter o processo rodando
process.on('SIGINT', () => {
  console.log('\n[INFO] Servidor sendo encerrado...');
  server.close(() => {
    console.log('[SUCCESS] Servidor encerrado');
    process.exit(0);
  });
});

export default app;
