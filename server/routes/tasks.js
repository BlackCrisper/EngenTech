import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { authenticateToken, checkPermission, auditLog } from '../middleware/auth.js';
import { logger } from '../config/logger.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Buscar tarefas padrão por disciplina
router.get('/standard', async (req, res) => {
  try {
    const { discipline } = req.query;
    const pool = await getConnection();
    
    let query = `
      SELECT id, discipline, name, description, estimatedHours, isActive, sortOrder
      FROM StandardTasks
      WHERE isActive = 1
    `;
    
    if (discipline) {
      query += ` AND discipline = @discipline`;
    }
    
    query += ` ORDER BY discipline, sortOrder`;
    
    const request = pool.request();
    if (discipline) {
      request.input('discipline', sql.NVarChar, discipline);
    }
    
    const result = await request.query(query);
    res.json(result.recordset);
    
  } catch (error) {
    logger.error('Erro ao buscar tarefas padrão:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar tarefas de um equipamento
router.get('/equipment/:equipmentId', async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .query(`
        SELECT 
          et.id,
          et.equipmentId,
          et.standardTaskId,
          et.discipline,
          et.name,
          et.description,
          et.currentProgress,
          et.targetProgress,
          et.estimatedHours,
          et.actualHours,
          et.status,
          et.priority,
          et.startDate,
          et.dueDate,
          et.completedDate,
          et.isCustom,
          et.createdAt,
          et.updatedAt,
          et.lastProgressUpdate,
          st.name as standardTaskName,
          u.username as lastUpdatedByUsername
        FROM EquipmentTasks et
        LEFT JOIN StandardTasks st ON et.standardTaskId = st.id
        LEFT JOIN Users u ON et.lastUpdatedBy = u.id
        WHERE et.equipmentId = @equipmentId
        ORDER BY et.discipline, et.createdAt
      `);
    
    res.json(result.recordset);
    
  } catch (error) {
    logger.error('Erro ao buscar tarefas do equipamento:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Gerar tarefas para um equipamento
router.post('/equipment/:equipmentId/generate', 
  checkPermission('tasks', 'create'), 
  auditLog('create', 'tasks'),
  async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { disciplines } = req.body;
    const pool = await getConnection();
    
    // Verificar se o equipamento existe
    const equipmentResult = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .query('SELECT id FROM Equipment WHERE id = @equipmentId');
    
    if (equipmentResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    
    // Buscar tarefas padrão
    let query = `
      SELECT id, discipline, name, description, estimatedHours, sortOrder
      FROM StandardTasks
      WHERE isActive = 1
    `;
    
    if (disciplines && disciplines.length > 0) {
      query += ` AND discipline IN (${disciplines.map(() => '?').join(',')})`;
    }
    
    query += ` ORDER BY discipline, sortOrder`;
    
    const standardTasksResult = await pool.request().query(query);
    
    // Inserir tarefas para o equipamento
    const insertedTasks = [];
    for (const task of standardTasksResult.recordset) {
      try {
        const insertResult = await pool.request()
          .input('equipmentId', sql.Int, equipmentId)
          .input('standardTaskId', sql.Int, task.id)
          .input('discipline', sql.NVarChar, task.discipline)
          .input('name', sql.NVarChar, task.name)
          .input('description', sql.NVarChar, task.description)
          .input('estimatedHours', sql.Decimal, task.estimatedHours)
          .query(`
            INSERT INTO EquipmentTasks (equipmentId, standardTaskId, discipline, name, description, estimatedHours)
            OUTPUT INSERTED.id, INSERTED.name, INSERTED.discipline
            VALUES (@equipmentId, @standardTaskId, @discipline, @name, @description, @estimatedHours)
          `);
        
        insertedTasks.push(insertResult.recordset[0]);
      } catch (error) {
        // Ignorar tarefas duplicadas
        if (!error.message.includes('duplicate key')) {
          logger.warn(`Erro ao inserir tarefa ${task.name}:`, error.message);
        }
      }
    }
    
    res.json({
      message: `${insertedTasks.length} tarefas geradas com sucesso`,
      tasks: insertedTasks
    });
    
  } catch (error) {
    logger.error('Erro ao gerar tarefas:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar tarefa personalizada
router.post('/equipment/:equipmentId/custom',
  checkPermission('tasks', 'create'),
  auditLog('create', 'tasks'),
  async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { discipline, name, description, estimatedHours, priority } = req.body;
    const pool = await getConnection();
    
    // Verificar se o equipamento existe
    const equipmentResult = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .query('SELECT id FROM Equipment WHERE id = @equipmentId');
    
    if (equipmentResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    
    // Inserir tarefa personalizada
    const result = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .input('discipline', sql.NVarChar, discipline)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('estimatedHours', sql.Decimal, estimatedHours || 0)
      .input('priority', sql.NVarChar, priority || 'normal')
      .query(`
        INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, estimatedHours, priority, isCustom)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.discipline
        VALUES (@equipmentId, @discipline, @name, @description, @estimatedHours, @priority, 1)
      `);
    
    res.json({
      message: 'Tarefa personalizada criada com sucesso',
      task: result.recordset[0]
    });
    
  } catch (error) {
    logger.error('Erro ao criar tarefa personalizada:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar progresso de uma tarefa (sem fotos)
router.put('/:taskId/progress', 
  checkPermission('tasks', 'update'), 
  auditLog('update', 'tasks'), 
  async (req, res) => {
  try {
    const { taskId } = req.params;
    const { currentProgress, observations, actualHours } = req.body;
    const pool = await getConnection();
    
    // Validar progresso
    if (currentProgress < 0 || currentProgress > 100) {
      return res.status(400).json({ error: 'Progresso deve estar entre 0 e 100' });
    }
    
    // Usar stored procedure para atualizar progresso
    const result = await pool.request()
      .input('taskId', sql.Int, taskId)
      .input('userId', sql.Int, req.user.id)
      .input('newProgress', sql.Decimal, currentProgress)
      .input('observations', sql.NVarChar, observations)
      .input('actualHours', sql.Decimal, actualHours)
      .input('ipAddress', sql.NVarChar, req.ip)
      .input('userAgent', sql.NVarChar, req.headers['user-agent'])
      .execute('UpdateTaskProgressWithPhotos');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    const updateResult = result.recordset[0];
    
    res.json({
      message: updateResult.message,
      taskId: updateResult.taskId,
      currentProgress: updateResult.currentProgress,
      status: updateResult.status,
      historyId: updateResult.historyId
    });
    
  } catch (error) {
    logger.error('Erro ao atualizar progresso:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar progresso de uma tarefa com fotos
router.put('/:taskId/progress-with-photos', 
  checkPermission('tasks', 'update'), 
  auditLog('update', 'tasks'),
  upload.array('photos', 10),
  async (req, res) => {
  try {
    const { taskId } = req.params;
    const { currentProgress, observations, actualHours } = req.body;
    const pool = await getConnection();
    
    // Log para debug
    logger.info('🔍 Debug - Dados recebidos na rota progress-with-photos:');
    logger.info(`   - taskId: ${taskId}`);
    logger.info(`   - currentProgress: ${currentProgress} (tipo: ${typeof currentProgress})`);
    logger.info(`   - observations: ${observations}`);
    logger.info(`   - actualHours: ${actualHours} (tipo: ${typeof actualHours})`);
    logger.info(`   - req.files: ${req.files ? req.files.length : 0} arquivos`);
    logger.info(`   - req.user.id: ${req.user.id}`);
    logger.info(`   - req.ip: ${req.ip}`);
    
    // Validar progresso
    if (currentProgress < 0 || currentProgress > 100) {
      return res.status(400).json({ error: 'Progresso deve estar entre 0 e 100' });
    }
    
    // Processar fotos enviadas
    const photoUrls = [];
    const photoData = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const photoUrl = `/uploads/${file.filename}`;
        photoUrls.push(photoUrl);
        
        photoData.push({
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype
        });
      }
    }
    
    logger.info(`   - photoUrls: ${JSON.stringify(photoUrls)}`);
    
    // Usar stored procedure para atualizar progresso
    const result = await pool.request()
      .input('taskId', sql.Int, taskId)
      .input('userId', sql.Int, req.user.id)
      .input('newProgress', sql.Decimal, currentProgress)
      .input('observations', sql.NVarChar, observations)
      .input('actualHours', sql.Decimal, actualHours)
      .input('photoUrls', sql.NVarChar, photoUrls.length > 0 ? JSON.stringify(photoUrls) : null)
      .input('ipAddress', sql.NVarChar, req.ip)
      .input('userAgent', sql.NVarChar, req.headers['user-agent'])
      .execute('UpdateTaskProgressWithPhotos');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    const updateResult = result.recordset[0];
    
    // Salvar informações das fotos no banco
    if (photoData.length > 0) {
      for (const photo of photoData) {
        await pool.request()
          .input('taskId', sql.Int, taskId)
          .input('historyId', sql.Int, updateResult.historyId)
          .input('fileName', sql.NVarChar, photo.fileName)
          .input('filePath', sql.NVarChar, photo.filePath)
          .input('fileSize', sql.Int, photo.fileSize)
          .input('mimeType', sql.NVarChar, photo.mimeType)
          .input('uploadedBy', sql.Int, req.user.id)
          .query(`
            INSERT INTO TaskPhotos (taskId, historyId, fileName, filePath, fileSize, mimeType, uploadedBy)
            VALUES (@taskId, @historyId, @fileName, @filePath, @fileSize, @mimeType, @uploadedBy)
          `);
      }
    }
    
    res.json({
      message: updateResult.message,
      taskId: updateResult.taskId,
      currentProgress: updateResult.currentProgress,
      status: updateResult.status,
      historyId: updateResult.historyId,
      photos: photoUrls
    });
    
  } catch (error) {
    logger.error('Erro ao atualizar progresso com fotos:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar histórico de uma tarefa
router.get('/:taskId/history', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { limit = 50 } = req.query;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('taskId', sql.Int, taskId)
      .input('limit', sql.Int, parseInt(limit))
      .execute('GetTaskHistory');
    
    res.json(result.recordset);
    
  } catch (error) {
    logger.error('Erro ao buscar histórico da tarefa:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar fotos de uma tarefa
router.get('/:taskId/photos', async (req, res) => {
  try {
    const { taskId } = req.params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('taskId', sql.Int, taskId)
      .query(`
        SELECT 
          tp.id,
          tp.fileName,
          tp.filePath,
          tp.fileSize,
          tp.mimeType,
          tp.uploadedAt,
          u.username as uploadedByUsername,
          th.id as historyId,
          th.createdAt as historyCreatedAt
        FROM TaskPhotos tp
        LEFT JOIN Users u ON tp.uploadedBy = u.id
        LEFT JOIN TaskHistory th ON tp.historyId = th.id
        WHERE tp.taskId = @taskId
        ORDER BY tp.uploadedAt DESC
      `);
    
    res.json(result.recordset);
    
  } catch (error) {
    logger.error('Erro ao buscar fotos da tarefa:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar registro de histórico de progresso
router.delete('/:taskId/history/:historyId',
  checkPermission('task-history', 'delete'),
  auditLog('delete', 'task-history'),
  async (req, res) => {
  try {
    const { taskId, historyId } = req.params;
    const pool = await getConnection();
    
    // Verificar se o registro de histórico existe
    const historyResult = await pool.request()
      .input('historyId', sql.Int, historyId)
      .input('taskId', sql.Int, taskId)
      .query(`
        SELECT 
          th.id,
          th.taskId,
          th.action,
          th.previousProgress,
          th.newProgress,
          th.observations,
          th.createdAt,
          u.username as updatedByUsername
        FROM TaskHistory th
        LEFT JOIN Users u ON th.userId = u.id
        WHERE th.id = @historyId AND th.taskId = @taskId
      `);
    
    if (historyResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Registro de histórico não encontrado' });
    }
    
    const historyEntry = historyResult.recordset[0];
    
    // Deletar fotos associadas ao histórico
    await pool.request()
      .input('historyId', sql.Int, historyId)
      .query('DELETE FROM TaskPhotos WHERE historyId = @historyId');
    
    // Deletar o registro de histórico
    await pool.request()
      .input('historyId', sql.Int, historyId)
      .query('DELETE FROM TaskHistory WHERE id = @historyId');
    
    res.json({
      message: 'Registro de histórico deletado com sucesso',
      historyId,
      taskId,
      deletedEntry: historyEntry
    });
    
  } catch (error) {
    logger.error('Erro ao deletar registro de histórico:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar tarefa
router.delete('/:taskId',
  checkPermission('tasks', 'delete'),
  auditLog('delete', 'tasks'),
  async (req, res) => {
  try {
    const { taskId } = req.params;
    const pool = await getConnection();
    
    // Verificar se a tarefa existe e pode ser deletada
    const taskResult = await pool.request()
      .input('taskId', sql.Int, taskId)
      .query(`
        SELECT 
          et.id,
          et.name,
          et.currentProgress,
          et.status,
          et.isCustom,
          (SELECT COUNT(*) FROM TaskHistory th WHERE th.taskId = et.id) as historyCount,
          (SELECT COUNT(*) FROM TaskPhotos tp WHERE tp.taskId = et.id) as photoCount
        FROM EquipmentTasks et
        WHERE et.id = @taskId
      `);
    
    if (taskResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    const task = taskResult.recordset[0];
    
    // Verificar se é uma tarefa padrão (não pode ser deletada por supervisor)
    if (!task.isCustom && req.user.role === 'supervisor') {
      return res.status(403).json({ 
        error: 'Não é possível deletar tarefas padrão',
        message: 'Apenas administradores podem deletar tarefas padrão'
      });
    }
    
    // Verificar se tem progresso ou histórico
    if (task.currentProgress > 0 || task.historyCount > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar tarefa com progresso ou histórico',
        message: 'Tarefas com progresso ou histórico não podem ser deletadas'
      });
    }
    
    // Deletar fotos associadas
    if (task.photoCount > 0) {
      await pool.request()
        .input('taskId', sql.Int, taskId)
        .query('DELETE FROM TaskPhotos WHERE taskId = @taskId');
    }
    
    // Deletar histórico
    if (task.historyCount > 0) {
      await pool.request()
        .input('taskId', sql.Int, taskId)
        .query('DELETE FROM TaskHistory WHERE taskId = @taskId');
    }
    
    // Deletar tarefa
    await pool.request()
      .input('taskId', sql.Int, taskId)
      .query('DELETE FROM EquipmentTasks WHERE id = @taskId');
    
    res.json({
      message: 'Tarefa deletada com sucesso',
      taskId,
      taskName: task.name
    });
    
  } catch (error) {
    logger.error('Erro ao deletar tarefa:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
