import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Aceitar qualquer origem
  credentials: true // Permitir credenciais
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importar rotas
import authRoutes from './routes/auth.js';
import areasRoutes from './routes/areas.js';
import equipmentRoutes from './routes/equipment.js';
import progressRoutes from './routes/progress.js';
import dashboardRoutes from './routes/dashboard.js';
import usersRoutes from './routes/users.js';
import tasksRoutes from './routes/tasks.js';
import reportsRoutes from './routes/reports.js';

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/reports', reportsRoutes);

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
  console.error('❌ Erro na API:', err);
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor EnginSync rodando na porta ${PORT}`);
  console.log(`📊 API disponível em: http://localhost:${PORT}/api`);
  console.log(`🌐 API disponível em: http://0.0.0.0:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
