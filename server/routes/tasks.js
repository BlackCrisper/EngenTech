import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { authenticateToken, checkPermission, auditLog } from '../middleware/auth.js';
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
    
    // Filtrar por projeto se não for admin
    if (req.user.role !== 'admin') {
      query += ` AND projectId = @projectId`;
    }
    
    if (discipline) {
      query += ` AND discipline = @discipline`;
    }
    
    query += ` ORDER BY discipline, sortOrder`;
    
    const request = pool.request();
    if (req.user.role !== 'admin') {
      request.input('projectId', sql.Int, req.user.projectId);
    }
    if (discipline) {
      request.input('discipline', sql.NVarChar, discipline);
    }
    
    const result = await request.query(query);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Erro ao buscar tarefas padrão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar tarefas de um equipamento
router.get('/equipment/:equipmentId', async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const pool = await getConnection();
    
    let query = `
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
        st.name as standardTaskName
      FROM EquipmentTasks et
      LEFT JOIN StandardTasks st ON et.standardTaskId = st.id
      WHERE et.equipmentId = @equipmentId
    `;

    // Filtrar por projeto se não for admin
    if (req.user.role !== 'admin') {
      query += ` AND et.projectId = @projectId`;
    }

    query += ` ORDER BY et.discipline, et.createdAt`;

    const request = pool.request()
      .input('equipmentId', sql.Int, equipmentId);
    
    if (req.user.role !== 'admin') {
      request.input('projectId', sql.Int, req.user.projectId);
    }

    const result = await request.query(query);
    
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Erro ao buscar tarefas do equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar tarefas para um equipamento (baseado nas tarefas padrão)
router.post('/equipment/:equipmentId/generate', checkPermission('tasks', 'create'), auditLog('create', 'tasks'), async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { disciplines = ['electrical', 'mechanical', 'civil'] } = req.body;
    const pool = await getConnection();
    
    // Verificar se o equipamento existe
    const equipmentCheck = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .query('SELECT id FROM Equipment WHERE id = @equipmentId');
    
    if (equipmentCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    
    // Buscar tarefas padrão para as disciplinas especificadas
    const request = pool.request();
    disciplines.forEach((discipline, index) => {
      request.input(`discipline${index}`, sql.NVarChar, discipline);
    });
    
    const placeholders = disciplines.map((_, index) => `@discipline${index}`).join(',');
    
    const standardTasks = await request.query(`
      SELECT id, discipline, name, description, estimatedHours
      FROM StandardTasks
      WHERE discipline IN (${placeholders})
      AND isActive = 1
      ORDER BY discipline, sortOrder
    `);
    
    // Inserir tarefas para o equipamento
    const insertedTasks = [];
    for (const task of standardTasks.recordset) {
      const result = await pool.request()
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
      
      insertedTasks.push(result.recordset[0]);
    }
    
    res.status(201).json({
      message: `${insertedTasks.length} tarefas criadas com sucesso`,
      tasks: insertedTasks
    });
    
  } catch (error) {
    console.error('Erro ao criar tarefas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar tarefa personalizada
router.post('/equipment/:equipmentId/custom', checkPermission('tasks', 'create'), auditLog('create', 'tasks'), async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { discipline, name, description, estimatedHours = 0, priority = 'normal' } = req.body;
    const pool = await getConnection();
    
    if (!discipline || !name) {
      return res.status(400).json({ error: 'Disciplina e nome são obrigatórios' });
    }
    
    const result = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .input('discipline', sql.NVarChar, discipline)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('estimatedHours', sql.Decimal, estimatedHours)
      .input('priority', sql.NVarChar, priority)
      .query(`
        INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, estimatedHours, priority, isCustom)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.discipline
        VALUES (@equipmentId, @discipline, @name, @description, @estimatedHours, @priority, 1)
      `);
    
    res.status(201).json({
      message: 'Tarefa personalizada criada com sucesso',
      task: result.recordset[0]
    });
    
  } catch (error) {
    console.error('Erro ao criar tarefa personalizada:', error);
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
    const { currentProgress, observations, photos } = req.body;
    const pool = await getConnection();
    
    // Buscar tarefa atual
    const currentTask = await pool.request()
      .input('taskId', sql.Int, taskId)
      .query(`
        SELECT id, currentProgress, status, equipmentId
        FROM EquipmentTasks
        WHERE id = @taskId
      `);
    
    if (currentTask.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    const task = currentTask.recordset[0];
    const previousProgress = task.currentProgress;
    const previousStatus = task.status;
    
    // Determinar novo status baseado no progresso
    let newStatus = task.status;
    if (currentProgress >= 100) {
      newStatus = 'completed';
    } else if (currentProgress > 0) {
      newStatus = 'in-progress';
    }
    
    // Atualizar tarefa
    await pool.request()
      .input('taskId', sql.Int, taskId)
      .input('currentProgress', sql.Decimal, currentProgress)
      .input('status', sql.NVarChar, newStatus)
      .input('actualHours', sql.Decimal, req.body.actualHours || 0)
      .input('completedDate', sql.Date, currentProgress >= 100 ? new Date() : null)
      .query(`
        UPDATE EquipmentTasks
        SET currentProgress = @currentProgress,
            status = @status,
            actualHours = @actualHours,
            completedDate = @completedDate,
            updatedAt = GETDATE()
        WHERE id = @taskId
      `);
    
    // Registrar no histórico
    await pool.request()
      .input('taskId', sql.Int, taskId)
      .input('userId', sql.Int, req.user.id)
      .input('action', sql.NVarChar, 'progress-updated')
      .input('previousProgress', sql.Decimal, previousProgress)
      .input('newProgress', sql.Decimal, currentProgress)
      .input('previousStatus', sql.NVarChar, previousStatus)
      .input('newStatus', sql.NVarChar, newStatus)
      .input('observations', sql.NVarChar, observations)
      .input('photos', sql.NVarChar, photos ? JSON.stringify(photos) : null)
      .query(`
        INSERT INTO TaskHistory (taskId, userId, action, previousProgress, newProgress, previousStatus, newStatus, observations, photos)
        VALUES (@taskId, @userId, @action, @previousProgress, @newProgress, @previousStatus, @newStatus, @observations, @photos)
      `);
    
    res.json({
      message: 'Progresso atualizado com sucesso',
      taskId,
      currentProgress,
      status: newStatus
    });
    
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar histórico de uma tarefa
router.get('/:taskId/history', checkPermission('tasks', 'read'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('taskId', sql.Int, taskId)
      .query(`
        SELECT 
          th.id,
          th.action,
          th.previousProgress,
          th.newProgress,
          th.previousStatus,
          th.newStatus,
          th.observations,
          th.photos,
          th.createdAt,
          u.name as userName
        FROM TaskHistory th
        JOIN Users u ON th.userId = u.id
        WHERE th.taskId = @taskId
        ORDER BY th.createdAt DESC
      `);
    
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
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
    
    // Buscar tarefa atual
    const currentTask = await pool.request()
      .input('taskId', sql.Int, taskId)
      .query(`
        SELECT id, currentProgress, status, equipmentId
        FROM EquipmentTasks
        WHERE id = @taskId
      `);
    
    if (currentTask.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    const task = currentTask.recordset[0];
    const previousProgress = task.currentProgress;
    const previousStatus = task.status;
    
    // Determinar novo status baseado no progresso
    let newStatus = task.status;
    if (currentProgress >= 100) {
      newStatus = 'completed';
    } else if (currentProgress > 0) {
      newStatus = 'in-progress';
    }
    
    // Processar fotos enviadas
    const photoUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Atualizar tarefa
    await pool.request()
      .input('taskId', sql.Int, taskId)
      .input('currentProgress', sql.Decimal, currentProgress)
      .input('status', sql.NVarChar, newStatus)
      .input('actualHours', sql.Decimal, actualHours || 0)
      .input('completedDate', sql.Date, currentProgress >= 100 ? new Date() : null)
      .query(`
        UPDATE EquipmentTasks
        SET currentProgress = @currentProgress,
            status = @status,
            actualHours = @actualHours,
            completedDate = @completedDate,
            updatedAt = GETDATE()
        WHERE id = @taskId
      `);
    
    // Registrar no histórico
    await pool.request()
      .input('taskId', sql.Int, taskId)
      .input('userId', sql.Int, req.user.id)
      .input('action', sql.NVarChar, 'progress-updated')
      .input('previousProgress', sql.Decimal, previousProgress)
      .input('newProgress', sql.Decimal, currentProgress)
      .input('previousStatus', sql.NVarChar, previousStatus)
      .input('newStatus', sql.NVarChar, newStatus)
      .input('observations', sql.NVarChar, observations)
      .input('photos', sql.NVarChar, photoUrls.length > 0 ? JSON.stringify(photoUrls) : null)
      .query(`
        INSERT INTO TaskHistory (taskId, userId, action, previousProgress, newProgress, previousStatus, newStatus, observations, photos)
        VALUES (@taskId, @userId, @action, @previousProgress, @newProgress, @previousStatus, @newStatus, @observations, @photos)
      `);
    
    res.json({
      message: 'Progresso atualizado com sucesso',
      taskId,
      currentProgress,
      status: newStatus,
      photos: photoUrls
    });
    
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar tarefa
router.delete('/:taskId', checkPermission('tasks', 'delete'), auditLog('delete', 'tasks'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const pool = await getConnection();
    
    // Verificar se a tarefa existe e obter informações completas
    const taskCheck = await pool.request()
      .input('taskId', sql.Int, taskId)
      .query(`
        SELECT 
          et.id,
          et.name,
          et.discipline,
          et.currentProgress,
          et.status,
          et.isCustom,
          e.equipmentTag as equipmentTag,
          e.isParent as equipmentIsParent,
          a.name as areaName
        FROM EquipmentTasks et
        JOIN Equipment e ON et.equipmentId = e.id
        JOIN Areas a ON e.areaId = a.id
        WHERE et.id = @taskId
      `);
    
    if (taskCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    const task = taskCheck.recordset[0];

    // VALIDAÇÕES DE REGRAS DE NEGÓCIO PARA DELETAR TAREFAS

    // 1. Não permitir deletar tarefas que já foram iniciadas (progresso > 0)
    if (task.currentProgress > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar uma tarefa que já foi iniciada',
        details: `A tarefa "${task.name}" possui ${task.currentProgress}% de progresso. Tarefas com progresso não podem ser deletadas.`
      });
    }

    // 2. Não permitir deletar tarefas que possuem histórico
    const historyCount = await pool.request()
      .input('taskId', sql.Int, taskId)
      .query('SELECT COUNT(*) as count FROM TaskHistory WHERE taskId = @taskId');

    if (historyCount.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar uma tarefa que possui histórico',
        details: `A tarefa "${task.name}" possui ${historyCount.recordset[0].count} registro(s) de histórico. O histórico é mantido para auditoria.`
      });
    }

    // 3. Verificar permissão para deletar tarefas padrão
    if (!task.isCustom) {
      // Verificar se o usuário tem permissão específica para deletar tarefas padrão
      const standardTaskPermission = await pool.request()
        .input('role', sql.NVarChar, req.user.role)
        .input('resource', sql.NVarChar, 'standard-tasks')
        .input('action', sql.NVarChar, 'delete')
        .query(`
          SELECT COUNT(*) as hasPermission
          FROM RolePermissions rp
          JOIN Permissions p ON rp.permissionId = p.id
          WHERE rp.role = @role 
            AND p.resource = @resource 
            AND p.action = @action
            AND rp.granted = 1
        `);

      if (standardTaskPermission.recordset[0].hasPermission === 0) {
        return res.status(403).json({ 
          error: 'Acesso negado',
          message: `Você não tem permissão para deletar tarefas padrão do sistema`,
          details: `A tarefa "${task.name}" é uma tarefa padrão do sistema. Apenas administradores podem deletar tarefas padrão.`
        });
      }
    }

    // 4. Verificar se há fotos/documentos anexados
    const photosCount = await pool.request()
      .input('taskId', sql.Int, taskId)
      .query(`
        SELECT COUNT(*) as count 
        FROM TaskHistory 
        WHERE taskId = @taskId AND photos IS NOT NULL AND photos != ''
      `);

    if (photosCount.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar uma tarefa que possui fotos/documentos anexados',
        details: `A tarefa "${task.name}" possui ${photosCount.recordset[0].count} registro(s) com fotos/documentos. Remova os anexos primeiro.`
      });
    }

    // SE PASSAR POR TODAS AS VALIDAÇÕES, PROSSEGUIR COM A DELEÇÃO

    // Iniciar transação para garantir consistência
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Deletar histórico primeiro (se houver)
      await transaction.request()
        .input('taskId', sql.Int, taskId)
        .query('DELETE FROM TaskHistory WHERE taskId = @taskId');
      
      // 2. Deletar tarefa
      const deleteResult = await transaction.request()
        .input('taskId', sql.Int, taskId)
        .query('DELETE FROM EquipmentTasks WHERE id = @taskId');

      if (deleteResult.rowsAffected[0] === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }

      // Commit da transação
      await transaction.commit();
      
      res.json({ 
        message: 'Tarefa deletada com sucesso',
        details: `Tarefa "${task.name}" (${task.discipline}) do equipamento ${task.equipmentTag} foi removida`
      });
      
    } catch (error) {
      // Rollback em caso de erro
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
