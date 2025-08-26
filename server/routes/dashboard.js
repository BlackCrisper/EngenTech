import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Buscar métricas do dashboard
router.get('/metrics', async (req, res) => {
  try {
    const pool = await getConnection();

    // 1. Calcular progresso total baseado no progresso das tarefas
    const progressResult = await pool.request()
      .query(`
        SELECT 
          AVG(currentProgress) as averageProgress,
          COUNT(*) as totalTasks,
          COUNT(CASE WHEN currentProgress = 100 THEN 1 END) as completedTasks,
          COUNT(CASE WHEN currentProgress < 50 THEN 1 END) as lowProgressTasks,
          COUNT(CASE WHEN currentProgress >= 50 AND currentProgress < 100 THEN 1 END) as inProgressTasks
        FROM EquipmentTasks
        WHERE currentProgress IS NOT NULL
      `);

    const progressData = progressResult.recordset[0];
    const averageProgress = progressData?.averageProgress || 0;
    const totalTasks = progressData?.totalTasks || 0;
    const completedTasks = progressData?.completedTasks || 0;
    const lowProgressTasks = progressData?.lowProgressTasks || 0;
    const inProgressTasks = progressData?.inProgressTasks || 0;

    // 2. Contar equipamentos por status
    const equipmentResult = await pool.request()
      .query(`
        SELECT 
          COUNT(CASE WHEN isParent = 1 THEN 1 END) as parentEquipment,
          COUNT(CASE WHEN isParent = 0 OR isParent IS NULL THEN 1 END) as childEquipment
        FROM Equipment
      `);

    const equipmentData = equipmentResult.recordset[0];

    // 3. Contar áreas ativas e progresso por área
    const areasResult = await pool.request()
      .query(`
        SELECT 
          COUNT(*) as totalAreas,
          COUNT(CASE WHEN active = 1 THEN 1 END) as activeAreas,
          AVG(areaProgress.averageProgress) as overallAreaProgress
        FROM Areas a
        LEFT JOIN (
          SELECT 
            e.areaId,
            AVG(et.currentProgress) as averageProgress
          FROM Equipment e
          LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
          WHERE et.currentProgress IS NOT NULL
          GROUP BY e.areaId
        ) areaProgress ON a.id = areaProgress.areaId
      `);

    const areasData = areasResult.recordset[0];



    // 5. Calcular tarefas vencidas (se houver datas de vencimento)
    const overdueTasksResult = await pool.request()
      .query(`
        SELECT COUNT(*) as overdueTasks
        FROM EquipmentTasks
        WHERE dueDate IS NOT NULL 
          AND dueDate < GETDATE() 
          AND currentProgress < 100
      `);

    const overdueTasks = overdueTasksResult.recordset[0]?.overdueTasks || 0;

    // 6. Calcular produtividade recente (últimos 7 dias)
    const recentActivityResult = await pool.request()
      .query(`
        SELECT COUNT(*) as recentUpdates
        FROM TaskHistory
        WHERE createdAt >= DATEADD(day, -7, GETDATE())
      `);

    const recentUpdates = recentActivityResult.recordset[0]?.recentUpdates || 0;

    // 7. Calcular progresso por disciplina
    const disciplineProgressResult = await pool.request()
      .query(`
        SELECT 
          discipline,
          AVG(currentProgress) as averageProgress,
          COUNT(*) as taskCount,
          COUNT(CASE WHEN currentProgress = 100 THEN 1 END) as completedCount
        FROM EquipmentTasks
        GROUP BY discipline
      `);

    const disciplineProgress = disciplineProgressResult.recordset.map(item => ({
      discipline: item.discipline,
      progress: Math.round(item.averageProgress || 0),
      taskCount: item.taskCount,
      completedCount: item.completedCount
    }));

    // 8. Calcular equipamentos com maior progresso
    const topEquipmentResult = await pool.request()
      .query(`
        SELECT TOP 5
          e.tag as equipmentTag,
          e.type as equipmentName,
          a.name as areaName,
          AVG(et.currentProgress) as averageProgress,
          COUNT(et.id) as taskCount
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
        WHERE et.currentProgress IS NOT NULL
        GROUP BY e.id, e.tag, e.type, a.name
        ORDER BY averageProgress DESC
      `);

    const topEquipment = topEquipmentResult.recordset.map(item => ({
      equipmentTag: item.equipmentTag,
      equipmentName: item.equipmentName,
      areaName: item.areaName,
      progress: Math.round(item.averageProgress || 0),
      taskCount: item.taskCount
    }));

    // 9. Calcular equipamentos com menor progresso (que precisam de atenção)
    const lowProgressEquipmentResult = await pool.request()
      .query(`
        SELECT TOP 5
          e.tag as equipmentTag,
          e.type as equipmentName,
          a.name as areaName,
          AVG(et.currentProgress) as averageProgress,
          COUNT(et.id) as taskCount
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
        WHERE et.currentProgress IS NOT NULL
        GROUP BY e.id, e.tag, e.type, a.name
        HAVING AVG(et.currentProgress) < 50
        ORDER BY averageProgress ASC
      `);

    const lowProgressEquipment = lowProgressEquipmentResult.recordset.map(item => ({
      equipmentTag: item.equipmentTag,
      equipmentName: item.equipmentName,
      areaName: item.areaName,
      progress: Math.round(item.averageProgress || 0),
      taskCount: item.taskCount
    }));

    // Buscar estatísticas SESMT (acidentes e incidentes)
    const sesmtStatsResult = await pool.request()
      .query(`
        SELECT 
          COUNT(CASE WHEN occurrenceTypeId IN (1, 2) THEN 1 END) as accidents_incidents,
          COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as critical_occurrences
        FROM SESMTOccurrences
        WHERE dateTimeOccurrence >= DATEADD(day, -30, GETDATE())
      `);

    const sesmtStats = sesmtStatsResult.recordset[0] || { accidents_incidents: 0, critical_occurrences: 0 };

    const metrics = {
      // Métricas principais
      progressTotal: Math.round(averageProgress),
      equipmentCount: equipmentData?.parentEquipment || 0,
      completedTasks: completedTasks,
      activeAreas: areasData?.activeAreas || 0,
      alerts: lowProgressTasks + overdueTasks + sesmtStats.accidents_incidents,
      childEquipmentCount: equipmentData?.childEquipment || 0,
      
      // Métricas detalhadas
      totalTasks: totalTasks,
      inProgressTasks: inProgressTasks,
      lowProgressTasks: lowProgressTasks,
      overdueTasks: overdueTasks,
      recentUpdates: recentUpdates,
      
      // Status de equipamentos
      activeEquipment: equipmentData?.childEquipment || 0,
      inactiveEquipment: 0, // Não temos essa informação na estrutura atual
      maintenanceEquipment: 0, // Não temos essa informação na estrutura atual
      
      // Status de áreas
      totalAreas: areasData?.totalAreas || 0,
      completedAreas: 0, // Não temos essa informação na estrutura atual
      overallAreaProgress: Math.round(areasData?.overallAreaProgress || 0),
      
      // Dados para gráficos
      disciplineProgress: disciplineProgress,
      topEquipment: topEquipment,
      lowProgressEquipment: lowProgressEquipment,
      
      // Dados SESMT
      sesmtStats: sesmtStats,
      
      lastUpdated: new Date().toISOString()
    };

    res.json(metrics);

  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});



// Buscar gráfico de progresso por área
router.get('/progress-by-area', async (req, res) => {
  try {
    const pool = await getConnection();

    // Buscar áreas com progresso por disciplina
    const result = await pool.request()
      .query(`
        SELECT 
          a.id,
          a.name as areaName,
          a.active as areaStatus,
          et.discipline,
          AVG(et.currentProgress) as disciplineProgress,
          COUNT(et.id) as taskCount,
          COUNT(CASE WHEN et.currentProgress = 100 THEN 1 END) as completedTasks,
          COUNT(CASE WHEN et.currentProgress < 50 THEN 1 END) as lowProgressTasks,
          COUNT(CASE WHEN et.dueDate IS NOT NULL AND et.dueDate < GETDATE() AND et.currentProgress < 100 THEN 1 END) as overdueTasks
        FROM Areas a
        LEFT JOIN Equipment e ON a.id = e.areaId
        LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
        WHERE a.active = 1 AND et.currentProgress IS NOT NULL AND et.discipline IS NOT NULL
        GROUP BY a.id, a.name, a.active, et.discipline
        ORDER BY a.name, et.discipline
      `);

    // Agrupar por área
    const areasMap = new Map();
    
    result.recordset.forEach(item => {
      const areaId = item.id;
      
      if (!areasMap.has(areaId)) {
        areasMap.set(areaId, {
          areaId: item.id,
          area: item.areaName,
          status: item.areaStatus ? 'active' : 'inactive',
          disciplines: {},
          totalTasks: 0,
          completedTasks: 0,
          lowProgressTasks: 0,
          overdueTasks: 0
        });
      }
      
      const area = areasMap.get(areaId);
      area.disciplines[item.discipline] = {
        progress: Math.round(item.disciplineProgress || 0),
        taskCount: item.taskCount,
        completedTasks: item.completedTasks,
        lowProgressTasks: item.lowProgressTasks,
        overdueTasks: item.overdueTasks
      };
      
      area.totalTasks += item.taskCount;
      area.completedTasks += item.completedTasks;
      area.lowProgressTasks += item.lowProgressTasks;
      area.overdueTasks += item.overdueTasks;
    });

    // Calcular progresso total por área
    const progressByArea = Array.from(areasMap.values()).map(area => {
      const disciplineProgresses = Object.values(area.disciplines).map(d => d.progress);
      const totalProgress = disciplineProgresses.length > 0 
        ? Math.round(disciplineProgresses.reduce((sum, p) => sum + p, 0) / disciplineProgresses.length)
        : 0;
      
      // Determinar status da área
      let areaStatus = 'on-time';
      if (area.overdueTasks > 0) {
        areaStatus = 'overdue';
      } else if (totalProgress === 100) {
        areaStatus = 'completed';
      } else if (totalProgress < 50) {
        areaStatus = 'overdue';
      }
      
      return {
        ...area,
        totalProgress,
        areaStatus,
        // Garantir que todas as disciplinas existam
        disciplines: {
          electrical: area.disciplines.electrical || { progress: 0, taskCount: 0, completedTasks: 0, lowProgressTasks: 0, overdueTasks: 0 },
          mechanical: area.disciplines.mechanical || { progress: 0, taskCount: 0, completedTasks: 0, lowProgressTasks: 0, overdueTasks: 0 },
          civil: area.disciplines.civil || { progress: 0, taskCount: 0, completedTasks: 0, lowProgressTasks: 0, overdueTasks: 0 }
        }
      };
    });

    res.json(progressByArea);

  } catch (error) {
    console.error('Erro ao buscar progresso por área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});



export default router;
