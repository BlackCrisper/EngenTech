import express from 'express';
import sql from 'mssql';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco de dados
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// GET /api/system/logs - Buscar logs do sistema
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const { page = 1, limit = 50, level, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (level) {
      whereClause += ' AND level = @level';
      params.push({ name: 'level', value: level });
    }
    
    if (startDate) {
      whereClause += ' AND createdAt >= @startDate';
      params.push({ name: 'startDate', value: new Date(startDate) });
    }
    
    if (endDate) {
      whereClause += ' AND createdAt <= @endDate';
      params.push({ name: 'endDate', value: new Date(endDate) });
    }
    
    const query = `
      SELECT 
        id,
        level,
        message,
        details,
        userId,
        userAction,
        ipAddress,
        userAgent,
        createdAt
      FROM SystemLogs 
      ${whereClause}
      ORDER BY createdAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    params.push(
      { name: 'offset', value: parseInt(offset) },
      { name: 'limit', value: parseInt(limit) }
    );
    
    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.value);
    });
    
    const result = await request.query(query);
    
    // Contar total de registros
    const countQuery = `SELECT COUNT(*) as total FROM SystemLogs ${whereClause}`;
    const countRequest = pool.request();
    params.slice(0, -2).forEach(param => {
      countRequest.input(param.name, param.value);
    });
    const countResult = await countRequest.query(countQuery);
    
    res.json({
      logs: result.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.recordset[0].total,
        totalPages: Math.ceil(countResult.recordset[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/system/logs - Criar novo log
router.post('/logs', authenticateToken, async (req, res) => {
  try {
    const { level, message, details, userAction } = req.body;
    const pool = await sql.connect(dbConfig);
    
    const query = `
      INSERT INTO SystemLogs (level, message, details, userId, userAction, ipAddress, userAgent, createdAt)
      VALUES (@level, @message, @details, @userId, @userAction, @ipAddress, @userAgent, GETDATE())
    `;
    
    await pool.request()
      .input('level', sql.NVarChar, level)
      .input('message', sql.NVarChar, message)
      .input('details', sql.NVarChar, details || null)
      .input('userId', sql.Int, req.user.id)
      .input('userAction', sql.NVarChar, userAction || null)
      .input('ipAddress', sql.NVarChar, req.ip || req.connection.remoteAddress)
      .input('userAgent', sql.NVarChar, req.get('User-Agent'))
      .query(query);
    
    res.status(201).json({ message: 'Log criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar log:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/system/backup - Gerar backup do sistema
router.get('/backup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `engentech-backup-${timestamp}.sql`;
    
    // Gerar backup das principais tabelas
    const tables = [
      'Users', 'Areas', 'Equipment', 'EquipmentTasks', 'StandardTasks', 
      'TaskHistory', 'ProgressHistory', 'Documents', 'DashboardMetrics'
    ];
    
    let backupContent = `-- Backup do Sistema EngenTech - ${new Date().toISOString()}\n\n`;
    
    for (const table of tables) {
      const result = await pool.request().query(`SELECT * FROM ${table}`);
      
      if (result.recordset.length > 0) {
        backupContent += `-- Dados da tabela ${table}\n`;
        backupContent += `INSERT INTO ${table} VALUES\n`;
        
        const values = result.recordset.map(record => {
          const columns = Object.keys(record);
          const values = columns.map(col => {
            const value = record[col];
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date) return `'${value.toISOString()}'`;
            return value;
          });
          return `(${values.join(', ')})`;
        });
        
        backupContent += values.join(',\n') + ';\n\n';
      }
    }
    
    // Salvar arquivo de backup
    const backupDir = path.join(__dirname, '../backups');
    await fs.mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, backupFileName);
    await fs.writeFile(backupPath, backupContent);
    
    res.json({
      message: 'Backup gerado com sucesso',
      fileName: backupFileName,
      size: backupContent.length,
      tables: tables.length
    });
  } catch (error) {
    console.error('Erro ao gerar backup:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/system/backups - Listar backups disponíveis
router.get('/backups', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    
    try {
      await fs.access(backupDir);
    } catch {
      await fs.mkdir(backupDir, { recursive: true });
    }
    
    const files = await fs.readdir(backupDir);
    const backups = [];
    
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          fileName: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        });
      }
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(backups);
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/system/backups/:fileName - Download de backup
router.get('/backups/:fileName', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { fileName } = req.params;
    const backupPath = path.join(__dirname, '../backups', fileName);
    
    // Verificar se o arquivo existe
    await fs.access(backupPath);
    
    res.download(backupPath, fileName);
  } catch (error) {
    console.error('Erro ao fazer download do backup:', error);
    res.status(404).json({ message: 'Arquivo de backup não encontrado' });
  }
});

// DELETE /api/system/backups/:fileName - Excluir backup
router.delete('/backups/:fileName', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { fileName } = req.params;
    const backupPath = path.join(__dirname, '../backups', fileName);
    
    await fs.unlink(backupPath);
    
    res.json({ message: 'Backup excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir backup:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/system/standard-tasks - Buscar tarefas padrão
router.get('/standard-tasks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { discipline } = req.query;
    
    let query = 'SELECT * FROM StandardTasks';
    const params = [];
    
    if (discipline) {
      query += ' WHERE discipline = @discipline';
      params.push({ name: 'discipline', value: discipline });
    }
    
    query += ' ORDER BY discipline, sortOrder, name';
    
    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.value);
    });
    
    const result = await request.query(query);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Erro ao buscar tarefas padrão:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/system/standard-tasks - Criar tarefa padrão
router.post('/standard-tasks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { discipline, name, description, estimatedHours, sortOrder } = req.body;
    const pool = await sql.connect(dbConfig);
    
    const query = `
      INSERT INTO StandardTasks (discipline, name, description, estimatedHours, sortOrder, createdAt, updatedAt)
      VALUES (@discipline, @name, @description, @estimatedHours, @sortOrder, GETDATE(), GETDATE())
    `;
    
    const result = await pool.request()
      .input('discipline', sql.NVarChar, discipline)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('estimatedHours', sql.Decimal(5, 2), estimatedHours || 0)
      .input('sortOrder', sql.Int, sortOrder || 0)
      .query(query);
    
    res.status(201).json({ message: 'Tarefa padrão criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar tarefa padrão:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/system/standard-tasks/:id - Atualizar tarefa padrão
router.put('/standard-tasks/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { discipline, name, description, estimatedHours, sortOrder, isActive } = req.body;
    const pool = await sql.connect(dbConfig);
    
    const query = `
      UPDATE StandardTasks 
      SET discipline = @discipline, 
          name = @name, 
          description = @description, 
          estimatedHours = @estimatedHours, 
          sortOrder = @sortOrder, 
          isActive = @isActive,
          updatedAt = GETDATE()
      WHERE id = @id
    `;
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('discipline', sql.NVarChar, discipline)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('estimatedHours', sql.Decimal(5, 2), estimatedHours || 0)
      .input('sortOrder', sql.Int, sortOrder || 0)
      .input('isActive', sql.Bit, isActive !== undefined ? isActive : 1)
      .query(query);
    
    res.json({ message: 'Tarefa padrão atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar tarefa padrão:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/system/standard-tasks/:id - Excluir tarefa padrão
router.delete('/standard-tasks/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(dbConfig);
    
    // Verificar se a tarefa está sendo usada
    const checkQuery = 'SELECT COUNT(*) as count FROM EquipmentTasks WHERE standardTaskId = @id';
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query(checkQuery);
    
    if (checkResult.recordset[0].count > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir esta tarefa padrão pois ela está sendo usada por equipamentos' 
      });
    }
    
    const query = 'DELETE FROM StandardTasks WHERE id = @id';
    await pool.request()
      .input('id', sql.Int, id)
      .query(query);
    
    res.json({ message: 'Tarefa padrão excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tarefa padrão:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/system/stats - Estatísticas do sistema
router.get('/stats', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const stats = {};
    
    // Contar usuários
    const usersResult = await pool.request().query('SELECT COUNT(*) as count FROM Users');
    stats.users = usersResult.recordset[0].count;
    
    // Contar áreas
    const areasResult = await pool.request().query('SELECT COUNT(*) as count FROM Areas');
    stats.areas = areasResult.recordset[0].count;
    
    // Contar equipamentos
    const equipmentResult = await pool.request().query('SELECT COUNT(*) as count FROM Equipment');
    stats.equipment = equipmentResult.recordset[0].count;
    
    // Contar tarefas
    const tasksResult = await pool.request().query('SELECT COUNT(*) as count FROM EquipmentTasks');
    stats.tasks = tasksResult.recordset[0].count;
    
    // Contar tarefas padrão
    const standardTasksResult = await pool.request().query('SELECT COUNT(*) as count FROM StandardTasks');
    stats.standardTasks = standardTasksResult.recordset[0].count;
    
    // Contar logs
    const logsResult = await pool.request().query('SELECT COUNT(*) as count FROM SystemLogs');
    stats.logs = logsResult.recordset[0].count;
    
    // Progresso médio geral
    const progressResult = await pool.request().query(`
      SELECT AVG(currentProgress) as averageProgress 
      FROM EquipmentTasks 
      WHERE currentProgress IS NOT NULL
    `);
    stats.averageProgress = progressResult.recordset[0].averageProgress || 0;
    
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
