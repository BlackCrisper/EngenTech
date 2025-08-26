import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

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
          COUNT(*) as totalEquipment,
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

    // 4. Contar usuários ativos
    const usersResult = await pool.request()
      .query(`
        SELECT 
          COUNT(*) as totalUsers,
          COUNT(CASE WHEN active = 1 THEN 1 END) as activeUsers,
          COUNT(CASE WHEN active = 0 THEN 1 END) as inactiveUsers
        FROM Users
      `);

    const usersData = usersResult.recordset[0];

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

    const metrics = {
      // Métricas principais
      progressTotal: Math.round(averageProgress),
      equipmentCount: equipmentData?.totalEquipment || 0,
      completedTasks: completedTasks,
      activeAreas: areasData?.activeAreas || 0,
      alerts: lowProgressTasks + overdueTasks,
      activeTeam: usersData?.activeUsers || 0,
      
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
      
      // Status de usuários
      totalUsers: usersData?.totalUsers || 0,
      inactiveUsers: usersData?.inactiveUsers || 0,
      
      // Dados para gráficos
      disciplineProgress: disciplineProgress,
      topEquipment: topEquipment,
      lowProgressEquipment: lowProgressEquipment,
      
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
          e.type as equipmentName,
          a.name as areaName,
          et.discipline,
          et.currentProgress,
          et.dueDate,
          et.updatedAt
        FROM EquipmentTasks et
        JOIN Equipment e ON et.equipmentId = e.id
        JOIN Areas a ON e.areaId = a.id
        WHERE et.currentProgress < 100
        ORDER BY 
          CASE 
            WHEN et.dueDate IS NOT NULL AND et.dueDate < GETDATE() THEN 1
            WHEN et.currentProgress < 30 THEN 2
            ELSE 3
          END,
          et.updatedAt DESC
      `);

    const activities = result.recordset.map(item => ({
      equipmentTag: item.equipmentTag,
      equipmentName: item.equipmentName,
      area: item.areaName,
      discipline: item.discipline,
      progress: item.currentProgress,
      dueDate: item.dueDate,
      lastUpdated: item.updatedAt,
      priority: item.dueDate && item.dueDate < new Date() ? 'high' : 
                item.currentProgress < 30 ? 'medium' : 'low'
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

    // Contar usuários ativos nas últimas 24 horas
    const activeUsersResult = await pool.request()
      .query(`
        SELECT COUNT(DISTINCT userId) as activeUsers
        FROM TaskHistory
        WHERE createdAt >= DATEADD(hour, -24, GETDATE())
      `);

    const activeUsers = activeUsersResult.recordset[0]?.activeUsers || 0;

    // Contar atualizações recentes
    const recentUpdatesResult = await pool.request()
      .query(`
        SELECT COUNT(*) as recentUpdates
        FROM TaskHistory
        WHERE createdAt >= DATEADD(hour, -1, GETDATE())
      `);

    const recentUpdates = recentUpdatesResult.recordset[0]?.recentUpdates || 0;

    const status = {
      database: 'Online',
      lastUpdate: new Date().toISOString(),
      system: 'Online',
      activeUsers: activeUsers,
      recentUpdates: recentUpdates,
      uptime: process.uptime(),
      serverTime: new Date().toISOString()
    };

    res.json(status);

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ 
      database: 'Offline',
      error: 'Erro interno do servidor',
      lastUpdate: new Date().toISOString()
    });
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

// Buscar progresso por disciplina
router.get('/progress-by-discipline', async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request()
      .query(`
        SELECT 
          discipline,
          AVG(currentProgress) as averageProgress,
          COUNT(*) as taskCount,
          COUNT(CASE WHEN currentProgress = 100 THEN 1 END) as completedCount,
          COUNT(CASE WHEN currentProgress < 50 THEN 1 END) as lowProgressCount,
          COUNT(CASE WHEN dueDate IS NOT NULL AND dueDate < GETDATE() AND currentProgress < 100 THEN 1 END) as overdueCount
        FROM EquipmentTasks
        GROUP BY discipline
        ORDER BY averageProgress DESC
      `);

    const progressByDiscipline = result.recordset.map(item => ({
      discipline: item.discipline,
      progress: Math.round(item.averageProgress || 0),
      taskCount: item.taskCount,
      completedCount: item.completedCount,
      lowProgressCount: item.lowProgressCount,
      overdueCount: item.overdueCount
    }));

    res.json(progressByDiscipline);

  } catch (error) {
    console.error('Erro ao buscar progresso por disciplina:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Nova rota: Buscar tendências de progresso (últimos 30 dias)
router.get('/progress-trends', async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request()
      .query(`
        SELECT 
          CAST(createdAt AS DATE) as date,
          COUNT(*) as updates,
          AVG(newProgress) as averageProgress
        FROM TaskHistory
        WHERE createdAt >= DATEADD(day, -30, GETDATE())
        GROUP BY CAST(createdAt AS DATE)
        ORDER BY date
      `);

    const trends = result.recordset.map(item => ({
      date: item.date,
      updates: item.updates,
      averageProgress: Math.round(item.averageProgress || 0)
    }));

    res.json(trends);

  } catch (error) {
    console.error('Erro ao buscar tendências:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Nova rota: Buscar equipamentos críticos (baixo progresso ou vencidos)
router.get('/critical-equipment', async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request()
      .query(`
        SELECT 
          e.tag as equipmentTag,
          e.type as equipmentName,
          a.name as areaName,
          AVG(et.currentProgress) as averageProgress,
          COUNT(et.id) as taskCount,
          COUNT(CASE WHEN et.dueDate IS NOT NULL AND et.dueDate < GETDATE() AND et.currentProgress < 100 THEN 1 END) as overdueTasks,
          MAX(et.updatedAt) as lastUpdate
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
        WHERE et.currentProgress IS NOT NULL
        GROUP BY e.id, e.tag, e.type, a.name
        HAVING AVG(et.currentProgress) < 50 OR 
               COUNT(CASE WHEN et.dueDate IS NOT NULL AND et.dueDate < GETDATE() AND et.currentProgress < 100 THEN 1 END) > 0
        ORDER BY averageProgress ASC
      `);

    const criticalEquipment = result.recordset.map(item => ({
      equipmentTag: item.equipmentTag,
      equipmentName: item.equipmentName,
      areaName: item.areaName,
      progress: Math.round(item.averageProgress || 0),
      taskCount: item.taskCount,
      overdueTasks: item.overdueTasks,
      lastUpdate: item.lastUpdate,
      priority: item.overdueTasks > 0 ? 'critical' : 'high'
    }));

    res.json(criticalEquipment);

  } catch (error) {
    console.error('Erro ao buscar equipamentos críticos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
