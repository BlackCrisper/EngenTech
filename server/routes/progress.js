import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { config } from '../config/env.js';

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
        p.discipline,
        p.currentProgress,
        p.targetProgress,
        p.observations,
        p.updatedAt,
        u.name as updatedBy
      FROM Equipment e
      JOIN Areas a ON e.areaId = a.id
      LEFT JOIN Progress p ON e.id = p.equipmentId
      LEFT JOIN Users u ON p.updatedBy = u.id
    `;

    const params = [];

    if (area) {
      query += ' AND a.name LIKE @area';
      params.push({ name: 'area', type: sql.NVarChar, value: `%${area}%` });
    }

    if (discipline) {
      query += ' AND p.discipline = @discipline';
      params.push({ name: 'discipline', type: sql.NVarChar, value: discipline });
    }

    if (status) {
      if (status === 'completed') {
        query += ' AND p.currentProgress = 100';
      } else if (status === 'in-progress') {
        query += ' AND p.currentProgress > 0 AND p.currentProgress < 100';
      } else if (status === 'pending') {
        query += ' AND (p.currentProgress = 0 OR p.currentProgress IS NULL)';
      }
    }

    query += ' ORDER BY e.tag, p.discipline';

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
          updated: row.updatedAt,
          updatedBy: row.updatedBy
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
          p.discipline,
          p.currentProgress,
          p.targetProgress,
          p.observations,
          p.updatedAt,
          u.name as updatedBy
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        LEFT JOIN Progress p ON e.id = p.equipmentId
        LEFT JOIN Users u ON p.updatedBy = u.id
        WHERE e.id = @equipmentId
        ORDER BY p.discipline
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
          updatedBy: row.updatedBy,
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

// Atualizar progresso
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

    // Verificar se já existe progresso para esta disciplina
    const existingProgress = await pool.request()
      .input('equipmentId', sql.Int, equipmentId)
      .input('discipline', sql.NVarChar, discipline)
      .query('SELECT id, currentProgress FROM Progress WHERE equipmentId = @equipmentId AND discipline = @discipline');

    if (existingProgress.recordset.length > 0) {
      // Atualizar progresso existente
      const progressId = existingProgress.recordset[0].id;
      const previousProgress = existingProgress.recordset[0].currentProgress;

      // Inserir no histórico
      await pool.request()
        .input('progressId', sql.Int, progressId)
        .input('previousProgress', sql.Decimal(5,2), previousProgress)
        .input('newProgress', sql.Decimal(5,2), currentProgress)
        .input('observations', sql.NVarChar, observations)
        .input('updatedBy', sql.Int, decoded.userId)
        .query(`
          INSERT INTO ProgressHistory (progressId, previousProgress, newProgress, observations, updatedBy)
          VALUES (@progressId, @previousProgress, @newProgress, @observations, @updatedBy)
        `);

      // Atualizar progresso
      await pool.request()
        .input('progressId', sql.Int, progressId)
        .input('currentProgress', sql.Decimal(5,2), currentProgress)
        .input('observations', sql.NVarChar, observations)
        .input('updatedBy', sql.Int, decoded.userId)
        .query(`
          UPDATE Progress 
          SET currentProgress = @currentProgress, 
              observations = @observations, 
              updatedBy = @updatedBy,
              updatedAt = GETDATE()
          WHERE id = @progressId
        `);
    } else {
      // Criar novo progresso
      const result = await pool.request()
        .input('equipmentId', sql.Int, equipmentId)
        .input('discipline', sql.NVarChar, discipline)
        .input('currentProgress', sql.Decimal(5,2), currentProgress)
        .input('observations', sql.NVarChar, observations)
        .input('updatedBy', sql.Int, decoded.userId)
        .query(`
          INSERT INTO Progress (equipmentId, discipline, currentProgress, observations, updatedBy)
          OUTPUT INSERTED.id
          VALUES (@equipmentId, @discipline, @currentProgress, @observations, @updatedBy)
        `);

      const progressId = result.recordset[0].id;

      // Inserir no histórico
      await pool.request()
        .input('progressId', sql.Int, progressId)
        .input('newProgress', sql.Decimal(5,2), currentProgress)
        .input('observations', sql.NVarChar, observations)
        .input('updatedBy', sql.Int, decoded.userId)
        .query(`
          INSERT INTO ProgressHistory (progressId, newProgress, observations, updatedBy)
          VALUES (@progressId, @newProgress, @observations, @updatedBy)
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
          ph.previousProgress,
          ph.newProgress,
          ph.observations,
          ph.updatedAt,
          u.name as updatedBy
        FROM Progress p
        JOIN ProgressHistory ph ON p.id = ph.progressId
        JOIN Users u ON ph.updatedBy = u.id
        WHERE p.equipmentId = @equipmentId AND p.discipline = @discipline
        ORDER BY ph.updatedAt DESC
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
