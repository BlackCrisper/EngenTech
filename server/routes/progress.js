import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { config } from '../config/env.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Buscar progresso de todos os equipamentos
router.get('/', async (req, res) => {
  try {
    const { area, discipline, status } = req.query;
    const pool = await getConnection();

    let query = `
      SELECT 
        e.id as equipmentId,
        e.tag as equipmentTag,
        e.type as equipmentName,
        a.name as areaName,
        et.discipline,
        et.currentProgress,
        et.targetProgress,
        et.description as observations,
        et.updatedAt
      FROM Equipment e
      JOIN Areas a ON e.areaId = a.id
      LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
    `;

    const params = [];

    if (area) {
      query += ' AND a.name LIKE @area';
      params.push({ name: 'area', type: sql.NVarChar, value: `%${area}%` });
    }

    if (discipline) {
      query += ' AND et.discipline = @discipline';
      params.push({ name: 'discipline', type: sql.NVarChar, value: discipline });
    }

    if (status) {
      if (status === 'completed') {
        query += ' AND et.currentProgress = 100';
      } else if (status === 'in-progress') {
        query += ' AND et.currentProgress > 0 AND et.currentProgress < 100';
      } else if (status === 'pending') {
        query += ' AND (et.currentProgress = 0 OR et.currentProgress IS NULL)';
      }
    }

    query += ' ORDER BY e.tag, et.discipline';

    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.query(query);

    // Agrupar por equipamento
    const equipmentMap = new Map();

    result.recordset.forEach(row => {
      if (!equipmentMap.has(row.equipmentId)) {
        equipmentMap.set(row.equipmentId, {
          equipmentId: row.equipmentId,
          equipmentTag: row.equipmentTag,
          equipmentName: row.equipmentName,
          area: row.areaName,
          electrical: { current: 0, updated: null },
          mechanical: { current: 0, updated: null },
          civil: { current: 0, updated: null }
        });
      }

      const equipment = equipmentMap.get(row.equipmentId);
      if (row.discipline) {
        equipment[row.discipline] = {
          current: row.currentProgress,
          updated: row.updatedAt
        };
      }
    });

    const equipment = Array.from(equipmentMap.values());

    res.json(equipment);

  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar progresso por área
router.get('/area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    const pool = await getConnection();

    // Primeiro, buscar todos os equipamentos da área
    const equipmentResult = await pool.request()
      .input('areaId', sql.Int, areaId)
      .query(`
        SELECT 
          e.id as equipmentId,
          e.tag as equipmentTag,
          e.type as equipmentName,
          a.name as areaName
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        WHERE a.id = @areaId
        ORDER BY e.tag
      `);

    // Para cada equipamento, buscar o progresso médio das tarefas
    const equipmentWithProgress = [];
    
    for (const eq of equipmentResult.recordset) {
      const progressResult = await pool.request()
        .input('equipmentId', sql.Int, eq.equipmentId)
        .query(`
          SELECT 
            discipline,
            currentProgress,
            updatedAt
          FROM EquipmentTasks
          WHERE equipmentId = @equipmentId
          ORDER BY discipline
        `);

      const equipment = {
        equipmentId: eq.equipmentId,
        equipmentTag: eq.equipmentTag,
        equipmentName: eq.equipmentName,
        area: eq.areaName,
        electrical: { current: 0, updated: null },
        mechanical: { current: 0, updated: null },
        civil: { current: 0, updated: null }
      };

      // Agrupar progresso por disciplina
      const disciplineMap = new Map();
      progressResult.recordset.forEach(task => {
        if (!disciplineMap.has(task.discipline)) {
          disciplineMap.set(task.discipline, []);
        }
        disciplineMap.get(task.discipline).push(task.currentProgress);
      });

      // Calcular média por disciplina
      disciplineMap.forEach((progresses, discipline) => {
        const avgProgress = progresses.reduce((sum, p) => sum + p, 0) / progresses.length;
        equipment[discipline] = {
          current: Math.round(avgProgress),
          updated: progressResult.recordset.find(t => t.discipline === discipline)?.updatedAt || null
        };
      });

      equipmentWithProgress.push(equipment);
    }

    res.json(equipmentWithProgress);

  } catch (error) {
    console.error('Erro ao buscar progresso por área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar tarefas de um equipamento específico
router.get('/equipment/:equipmentId/tasks', async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .query(`
        SELECT 
          et.id,
          et.discipline,
          et.name,
          et.description,
          et.currentProgress,
          et.targetProgress,
          et.status,
          et.priority,
          et.estimatedHours,
          et.updatedAt
        FROM EquipmentTasks et
        WHERE et.equipmentId = @equipmentId
        ORDER BY et.discipline, et.name
      `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Erro ao buscar tarefas do equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar progresso de um equipamento específico
router.get('/:equipmentId', async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .query(`
        SELECT 
          e.id as equipmentId,
          e.tag as equipmentTag,
          e.type as equipmentName,
          a.name as areaName,
          et.discipline,
          et.currentProgress,
          et.targetProgress,
          et.description as observations,
          et.updatedAt
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
        WHERE e.id = @equipmentId
        ORDER BY et.discipline
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    const equipment = {
      equipmentId: result.recordset[0].equipmentId,
      equipmentTag: result.recordset[0].equipmentTag,
      equipmentName: result.recordset[0].equipmentName,
      area: result.recordset[0].areaName,
      electrical: { current: 0, updated: null },
      mechanical: { current: 0, updated: null },
      civil: { current: 0, updated: null }
    };

    result.recordset.forEach(row => {
      if (row.discipline) {
        equipment[row.discipline] = {
          current: row.currentProgress,
          updated: row.updatedAt,
          observations: row.observations
        };
      }
    });

    res.json(equipment);

  } catch (error) {
    console.error('Erro ao buscar equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar progresso de tarefa
router.put('/:equipmentId/:discipline', async (req, res) => {
  try {
    const { equipmentId, discipline } = req.params;
    const { currentProgress, observations } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (!currentProgress || currentProgress < 0 || currentProgress > 100) {
      return res.status(400).json({ error: 'Progresso deve estar entre 0 e 100' });
    }

    const pool = await getConnection();

    // Verificar se o equipamento existe
    const equipmentResult = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .query('SELECT id FROM Equipment WHERE id = @equipmentId');

    if (equipmentResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    // Verificar se já existe tarefa para esta disciplina
    const existingTask = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .input('discipline', sql.NVarChar, discipline)
      .query('SELECT id, currentProgress FROM EquipmentTasks WHERE equipmentId = @equipmentId AND discipline = @discipline');

    if (existingTask.recordset.length > 0) {
      // Atualizar tarefa existente
      const taskId = existingTask.recordset[0].id;
      const previousProgress = existingTask.recordset[0].currentProgress;

      // Inserir no histórico
      await pool.request()
        .input('taskId', sql.Int, taskId)
        .input('userId', sql.Int, decoded.userId)
        .input('action', sql.NVarChar, 'updated')
        .input('previousProgress', sql.Decimal(5,2), previousProgress)
        .input('newProgress', sql.Decimal(5,2), currentProgress)
        .input('observations', sql.NVarChar, observations)
        .query(`
          INSERT INTO TaskHistory (taskId, userId, action, previousProgress, newProgress, observations)
          VALUES (@taskId, @userId, @action, @previousProgress, @newProgress, @observations)
        `);

      // Atualizar tarefa
      await pool.request()
        .input('taskId', sql.Int, taskId)
        .input('currentProgress', sql.Decimal(5,2), currentProgress)
        .input('description', sql.NVarChar, observations)
        .query(`
          UPDATE EquipmentTasks 
          SET currentProgress = @currentProgress, 
              description = @description, 
              updatedAt = GETDATE()
          WHERE id = @taskId
        `);
    } else {
      // Criar nova tarefa
      const result = await pool.request()
        .input('equipmentId', sql.Int, equipmentId)
        .input('discipline', sql.NVarChar, discipline)
        .input('currentProgress', sql.Decimal(5,2), currentProgress)
        .input('description', sql.NVarChar, observations)
        .input('name', sql.NVarChar, `Tarefa ${discipline}`)
        .query(`
          INSERT INTO EquipmentTasks (equipmentId, discipline, name, currentProgress, description)
          OUTPUT INSERTED.id
          VALUES (@equipmentId, @discipline, @name, @currentProgress, @description)
        `);

      const taskId = result.recordset[0].id;

      // Inserir no histórico
      await pool.request()
        .input('taskId', sql.Int, taskId)
        .input('userId', sql.Int, decoded.userId)
        .input('action', sql.NVarChar, 'created')
        .input('newProgress', sql.Decimal(5,2), currentProgress)
        .input('observations', sql.NVarChar, observations)
        .query(`
          INSERT INTO TaskHistory (taskId, userId, action, newProgress, observations)
          VALUES (@taskId, @userId, @action, @newProgress, @observations)
        `);
    }

    res.json({ 
      message: 'Progresso atualizado com sucesso',
      equipmentId,
      discipline,
      currentProgress
    });

  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar progresso com upload de fotos
router.post('/update', async (req, res) => {
  try {
    const { equipmentId, discipline, currentProgress, observations, taskId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (!currentProgress || currentProgress < 0 || currentProgress > 100) {
      return res.status(400).json({ error: 'Progresso deve estar entre 0 e 100' });
    }

    const pool = await getConnection();

    // Verificar se o equipamento existe
    const equipmentResult = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .query('SELECT id FROM Equipment WHERE id = @equipmentId');

    if (equipmentResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    let taskIdToUpdate = taskId;

    // Se não foi fornecido taskId, procurar por disciplina (comportamento legado)
    if (!taskIdToUpdate) {
      const existingTask = await pool.request()
        .input('equipmentId', sql.Int, equipmentId)
        .input('discipline', sql.NVarChar, discipline)
        .query('SELECT id, currentProgress FROM EquipmentTasks WHERE equipmentId = @equipmentId AND discipline = @discipline');

      if (existingTask.recordset.length > 0) {
        taskIdToUpdate = existingTask.recordset[0].id;
      }
    }

    if (taskIdToUpdate) {
      // Verificar se a tarefa existe e pertence ao equipamento
      const taskResult = await pool.request()
        .input('taskId', sql.Int, taskIdToUpdate)
        .input('equipmentId', sql.Int, equipmentId)
        .query('SELECT id, currentProgress FROM EquipmentTasks WHERE id = @taskId AND equipmentId = @equipmentId');

      if (taskResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Tarefa não encontrada para este equipamento' });
      }

      const previousProgress = taskResult.recordset[0].currentProgress;

      // Inserir no histórico
      await pool.request()
        .input('taskId', sql.Int, taskIdToUpdate)
        .input('userId', sql.Int, decoded.userId)
        .input('action', sql.NVarChar, 'updated')
        .input('previousProgress', sql.Decimal(5,2), previousProgress)
        .input('newProgress', sql.Decimal(5,2), currentProgress)
        .input('observations', sql.NVarChar, observations)
        .query(`
          INSERT INTO TaskHistory (taskId, userId, action, previousProgress, newProgress, observations)
          VALUES (@taskId, @userId, @action, @previousProgress, @newProgress, @observations)
        `);

      // Atualizar tarefa específica
      await pool.request()
        .input('taskId', sql.Int, taskIdToUpdate)
        .input('currentProgress', sql.Decimal(5,2), currentProgress)
        .input('description', sql.NVarChar, observations)
        .query(`
          UPDATE EquipmentTasks 
          SET currentProgress = @currentProgress, 
              description = @description, 
              updatedAt = GETDATE()
          WHERE id = @taskId
        `);
    } else {
      // Criar nova tarefa (comportamento legado)
      const result = await pool.request()
        .input('equipmentId', sql.Int, equipmentId)
        .input('discipline', sql.NVarChar, discipline)
        .input('currentProgress', sql.Decimal(5,2), currentProgress)
        .input('description', sql.NVarChar, observations)
        .input('name', sql.NVarChar, `Tarefa ${discipline}`)
        .query(`
          INSERT INTO EquipmentTasks (equipmentId, discipline, name, currentProgress, description)
          OUTPUT INSERTED.id
          VALUES (@equipmentId, @discipline, @name, @currentProgress, @description)
        `);

      const newTaskId = result.recordset[0].id;

      // Inserir no histórico
      await pool.request()
        .input('taskId', sql.Int, newTaskId)
        .input('userId', sql.Int, decoded.userId)
        .input('action', sql.NVarChar, 'created')
        .input('newProgress', sql.Decimal(5,2), currentProgress)
        .input('observations', sql.NVarChar, observations)
        .query(`
          INSERT INTO TaskHistory (taskId, userId, action, newProgress, observations)
          VALUES (@taskId, @userId, @action, @newProgress, @observations)
        `);
    }

    res.json({ 
      message: 'Progresso atualizado com sucesso',
      equipmentId,
      discipline,
      currentProgress,
      taskId: taskIdToUpdate
    });

  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar histórico de progresso
router.get('/:equipmentId/:discipline/history', async (req, res) => {
  try {
    const { equipmentId, discipline } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .input('discipline', sql.NVarChar, discipline)
      .query(`
        SELECT 
          th.previousProgress,
          th.newProgress,
          th.observations,
          th.createdAt as updatedAt,
          u.name as updatedBy
        FROM EquipmentTasks et
        JOIN TaskHistory th ON et.id = th.taskId
        JOIN Users u ON th.userId = u.id
        WHERE et.equipmentId = @equipmentId AND et.discipline = @discipline
        ORDER BY th.createdAt DESC
      `);

    const history = result.recordset.map(item => ({
      previousProgress: item.previousProgress,
      newProgress: item.newProgress,
      observations: item.observations,
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy
    }));

    res.json(history);

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
