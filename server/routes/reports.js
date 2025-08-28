import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { authenticateToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Buscar dados gerais para relatórios
router.get('/data', checkPermission('reports', 'read'), async (req, res) => {
  try {
    const pool = await getConnection();
    
    // Buscar métricas gerais
    const metricsResult = await pool.request().query(`
      SELECT 
        COUNT(*) as totalTasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
        AVG(currentProgress) as averageProgress
      FROM EquipmentTasks
    `);
    
    // Contar equipamentos
    const equipmentResult = await pool.request().query('SELECT COUNT(*) as total FROM Equipment');
    
    // Contar alertas (progresso < 50%)
    const alertsResult = await pool.request().query('SELECT COUNT(*) as total FROM EquipmentTasks WHERE currentProgress < 50');
    
    const metrics = metricsResult.recordset[0];
    
    res.json({
      totalTasks: metrics.totalTasks || 0,
      completedTasks: metrics.completedTasks || 0,
      averageProgress: Math.round(metrics.averageProgress || 0),
      totalEquipment: equipmentResult.recordset[0].total,
      alerts: alertsResult.recordset[0].total
    });
    
  } catch (error) {
    console.error('Erro ao buscar dados dos relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de progresso geral
router.get('/progress-overview', checkPermission('reports', 'read'), async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as totalTasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as inProgressTasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingTasks,
        AVG(currentProgress) as averageProgress,
        SUM(estimatedHours) as totalEstimatedHours,
        SUM(actualHours) as totalActualHours
      FROM EquipmentTasks
    `);
    
    const stats = result.recordset[0];
    
    res.json({
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      inProgressTasks: stats.inProgressTasks,
      pendingTasks: stats.pendingTasks,
      averageProgress: Math.round(stats.averageProgress || 0),
      totalEstimatedHours: stats.totalEstimatedHours || 0,
      totalActualHours: stats.totalActualHours || 0,
      completionRate: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório de progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório por disciplina
router.get('/by-discipline', checkPermission('reports', 'read'), async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        discipline,
        COUNT(*) as totalTasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
        AVG(currentProgress) as averageProgress,
        SUM(estimatedHours) as totalEstimatedHours,
        SUM(actualHours) as totalActualHours
      FROM EquipmentTasks
      GROUP BY discipline
      ORDER BY discipline
    `);
    
    const disciplines = result.recordset.map(row => ({
      discipline: row.discipline,
      totalTasks: row.totalTasks,
      completedTasks: row.completedTasks,
      averageProgress: Math.round(row.averageProgress || 0),
      totalEstimatedHours: row.totalEstimatedHours || 0,
      totalActualHours: row.totalActualHours || 0,
      completionRate: row.totalTasks > 0 ? Math.round((row.completedTasks / row.totalTasks) * 100) : 0
    }));
    
    res.json(disciplines);
    
  } catch (error) {
    console.error('Erro ao gerar relatório por disciplina:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório por equipamento
router.get('/by-equipment', checkPermission('reports', 'read'), async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        e.tag as equipmentTag,
        e.description as equipmentName,
        a.name as areaName,
        COUNT(et.id) as totalTasks,
        SUM(CASE WHEN et.status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
        AVG(et.currentProgress) as averageProgress,
        SUM(et.estimatedHours) as totalEstimatedHours,
        SUM(et.actualHours) as totalActualHours
      FROM Equipment e
      LEFT JOIN Areas a ON e.areaId = a.id
      LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
      WHERE e.isParent = 0
      GROUP BY e.id, e.tag, e.description, a.name
      ORDER BY e.tag
    `);
    
    const equipment = result.recordset.map(row => ({
      equipmentTag: row.equipmentTag,
      equipmentName: row.equipmentName,
      areaName: row.areaName,
      totalTasks: row.totalTasks,
      completedTasks: row.completedTasks,
      averageProgress: Math.round(row.averageProgress || 0),
      totalEstimatedHours: row.totalEstimatedHours || 0,
      totalActualHours: row.totalActualHours || 0,
      completionRate: row.totalTasks > 0 ? Math.round((row.completedTasks / row.totalTasks) * 100) : 0
    }));
    
    res.json(equipment);
    
  } catch (error) {
    console.error('Erro ao gerar relatório por equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de produtividade por usuário
router.get('/user-productivity', checkPermission('reports', 'read'), async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        u.name as userName,
        u.role,
        COUNT(th.id) as totalUpdates,
        COUNT(DISTINCT th.taskId) as tasksUpdated,
        SUM(th.newProgress - th.previousProgress) as totalProgressAdded,
        COUNT(CASE WHEN th.photos IS NOT NULL THEN 1 END) as updatesWithPhotos
      FROM Users u
      LEFT JOIN TaskHistory th ON u.id = th.userId
      WHERE u.active = 1
      GROUP BY u.id, u.name, u.role
      ORDER BY totalUpdates DESC
    `);
    
    const users = result.recordset.map(row => ({
      userName: row.userName,
      role: row.role,
      totalUpdates: row.totalUpdates,
      tasksUpdated: row.tasksUpdated,
      totalProgressAdded: row.totalProgressAdded || 0,
      updatesWithPhotos: row.updatesWithPhotos,
      averageProgressPerUpdate: row.totalUpdates > 0 ? Math.round((row.totalProgressAdded / row.totalUpdates) * 100) / 100 : 0
    }));
    
    res.json(users);
    
  } catch (error) {
    console.error('Erro ao gerar relatório de produtividade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de tarefas vencidas
router.get('/overdue-tasks', checkPermission('reports', 'read'), async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        et.id,
        et.name as taskName,
        et.discipline,
        et.currentProgress,
        et.status,
        et.dueDate,
        et.priority,
        e.tag as equipmentTag,
        e.description as equipmentName,
        a.name as areaName,
        DATEDIFF(day, et.dueDate, GETDATE()) as daysOverdue
      FROM EquipmentTasks et
      JOIN Equipment e ON et.equipmentId = e.id
      LEFT JOIN Areas a ON e.areaId = a.id
      WHERE et.dueDate < GETDATE() 
        AND et.status != 'completed'
      ORDER BY et.dueDate ASC
    `);
    
    const overdueTasks = result.recordset.map(row => ({
      id: row.id,
      taskName: row.taskName,
      discipline: row.discipline,
      currentProgress: row.currentProgress,
      status: row.status,
      dueDate: row.dueDate,
      priority: row.priority,
      equipmentTag: row.equipmentTag,
      equipmentName: row.equipmentName,
      areaName: row.areaName,
      daysOverdue: row.daysOverdue
    }));
    
    res.json(overdueTasks);
    
  } catch (error) {
    console.error('Erro ao gerar relatório de tarefas vencidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de histórico de uma tarefa específica
router.get('/task/:taskId/history', checkPermission('reports', 'read'), async (req, res) => {
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
          u.name as userName,
          u.role as userRole
        FROM TaskHistory th
        JOIN Users u ON th.userId = u.id
        WHERE th.taskId = @taskId
        ORDER BY th.createdAt DESC
      `);
    
    const history = result.recordset.map(row => ({
      id: row.id,
      action: row.action,
      previousProgress: row.previousProgress,
      newProgress: row.newProgress,
      previousStatus: row.previousStatus,
      newStatus: row.newStatus,
      observations: row.observations,
      photos: row.photos ? JSON.parse(row.photos) : [],
      createdAt: row.createdAt,
      userName: row.userName,
      userRole: row.userRole
    }));
    
    res.json(history);
    
  } catch (error) {
    console.error('Erro ao buscar histórico da tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
