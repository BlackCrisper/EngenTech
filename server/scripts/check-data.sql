-- Script para verificar dados na tabela EquipmentTasks
-- ===================================================

-- Verificar se há dados
SELECT COUNT(*) as totalRecords FROM EquipmentTasks;

-- Verificar dados por disciplina (se houver)
SELECT 
    discipline,
    COUNT(*) as totalTasks,
    AVG(currentProgress) as averageProgress,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasks
FROM EquipmentTasks 
GROUP BY discipline 
ORDER BY discipline;

-- Verificar métricas gerais
SELECT 
    COUNT(*) as totalTasks,
    AVG(currentProgress) as averageProgress,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
    SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as inProgressTasks,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingTasks
FROM EquipmentTasks;
