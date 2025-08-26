import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Buscar métricas do dashboard
router.get('/metrics', async (req, res) => {
  try {
    const pool = await getConnection();

    // Buscar métricas do banco
    const metricsResult = await pool.request()
      .query('SELECT * FROM DashboardMetrics ORDER BY recordedAt DESC');

    // Calcular progresso total baseado no progresso das tarefas
    const progressResult = await pool.request()
      .query(`
        SELECT AVG(currentProgress) as averageProgress
        FROM EquipmentTasks
        WHERE currentProgress IS NOT NULL
      `);

    const averageProgress = progressResult.recordset[0]?.averageProgress || 0;

    // Contar equipamentos
    const equipmentResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM Equipment');

    // Contar áreas ativas
    const areasResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM Areas WHERE active = 1');

    // Contar tarefas concluídas (progresso = 100%)
    const completedTasksResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM EquipmentTasks WHERE currentProgress = 100');

    // Contar alertas (progresso < 50%)
    const alertsResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM EquipmentTasks WHERE currentProgress < 50');

    // Contar usuários ativos
    const usersResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM Users WHERE active = 1');

    const metrics = {
      progressTotal: Math.round(averageProgress),
      equipmentCount: equipmentResult.recordset[0].total,
      completedTasks: completedTasksResult.recordset[0].total,
      activeAreas: areasResult.recordset[0].total,
      alerts: alertsResult.recordset[0].total,
      activeTeam: usersResult.recordset[0].total,
      lastUpdated: new Date().toISOString()
    };

    res.json(metrics);

  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar próximas atividades
router.get('/upcoming-activities', async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request()
      .query(`
        SELECT TOP 10
          e.tag as equipmentTag,
          e.description as equipmentName,
          a.name as areaName,
          et.discipline,
          et.currentProgress,
          et.updatedAt
        FROM EquipmentTasks et
        JOIN Equipment e ON et.equipmentId = e.id
        JOIN Areas a ON e.areaId = a.id
        WHERE et.currentProgress < 100
        ORDER BY et.updatedAt DESC
      `);

    const activities = result.recordset.map(item => ({
      equipmentTag: item.equipmentTag,
      equipmentName: item.equipmentName,
      area: item.areaName,
      discipline: item.discipline,
      progress: item.currentProgress,
      lastUpdated: item.updatedAt
    }));

    res.json(activities);

  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar status do sistema
router.get('/system-status', async (req, res) => {
  try {
    const pool = await getConnection();

    // Testar conexão com banco
    await pool.request().query('SELECT 1');

    const status = {
      database: 'Online',
      lastUpdate: new Date().toISOString(),
      system: 'Online',
      activeUsers: 12, // Mock - implementar contagem real se necessário
      uptime: process.uptime()
    };

    res.json(status);

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ 
      database: 'Offline',
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar gráfico de progresso por área
router.get('/progress-by-area', async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request()
      .query(`
        SELECT 
          a.name as areaName,
          AVG(et.currentProgress) as averageProgress,
          COUNT(DISTINCT e.id) as equipmentCount
        FROM Areas a
        LEFT JOIN Equipment e ON a.id = e.areaId
        LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
        WHERE a.active = 1
        GROUP BY a.id, a.name
        ORDER BY averageProgress DESC
      `);

    const progressByArea = result.recordset.map(item => ({
      area: item.areaName,
      progress: Math.round(item.averageProgress || 0),
      equipmentCount: item.equipmentCount
    }));

    res.json(progressByArea);

  } catch (error) {
    console.error('Erro ao buscar progresso por área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar progresso por disciplina
router.get('/progress-by-discipline', async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request()
      .query(`
        SELECT 
          discipline,
          AVG(currentProgress) as averageProgress,
          COUNT(*) as taskCount
        FROM EquipmentTasks
        GROUP BY discipline
        ORDER BY averageProgress DESC
      `);

    const progressByDiscipline = result.recordset.map(item => ({
      discipline: item.discipline,
      progress: Math.round(item.averageProgress || 0),
      taskCount: item.taskCount
    }));

    res.json(progressByDiscipline);

  } catch (error) {
    console.error('Erro ao buscar progresso por disciplina:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
