-- Script para inserir dados de teste nas tarefas
-- ==============================================

-- Inserir dados de teste na tabela EquipmentTasks
INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, actualHours, status) VALUES
-- Tarefas Civis
(1, 'civil', 'Preparação de Fundação', 'Preparação da fundação para equipamento', 25.0, 100.0, 32.0, 8.0, 'in-progress'),
(1, 'civil', 'Instalação de Estrutura', 'Instalação da estrutura civil', 0.0, 100.0, 24.0, 0.0, 'pending'),
(2, 'civil', 'Preparação de Fundação', 'Preparação da fundação para equipamento', 50.0, 100.0, 32.0, 16.0, 'in-progress'),
(2, 'civil', 'Alvenaria', 'Execução de alvenaria', 100.0, 100.0, 20.0, 20.0, 'completed'),
(3, 'civil', 'Instalação de Estrutura', 'Instalação da estrutura civil', 75.0, 100.0, 24.0, 18.0, 'in-progress'),

-- Tarefas Elétricas
(1, 'electrical', 'Instalação de Painel Elétrico', 'Instalação do painel principal', 0.0, 100.0, 16.0, 0.0, 'pending'),
(2, 'electrical', 'Cabeamento de Potência', 'Instalação de cabos de potência', 30.0, 100.0, 24.0, 7.2, 'in-progress'),
(2, 'electrical', 'Instalação de Iluminação', 'Instalação do sistema de iluminação', 100.0, 100.0, 12.0, 12.0, 'completed'),
(3, 'electrical', 'Instalação de Tomadas', 'Instalação de tomadas', 60.0, 100.0, 8.0, 4.8, 'in-progress'),
(4, 'electrical', 'Teste de Continuidade', 'Teste de continuidade elétrica', 0.0, 100.0, 4.0, 0.0, 'pending'),

-- Tarefas Mecânicas
(1, 'mechanical', 'Montagem de Estrutura', 'Montagem da estrutura mecânica', 40.0, 100.0, 20.0, 8.0, 'in-progress'),
(2, 'mechanical', 'Instalação de Motores', 'Instalação dos motores', 100.0, 100.0, 16.0, 16.0, 'completed'),
(3, 'mechanical', 'Instalação de Bombas', 'Instalação das bombas', 20.0, 100.0, 12.0, 2.4, 'in-progress'),
(3, 'mechanical', 'Instalação de Válvulas', 'Instalação das válvulas', 0.0, 100.0, 8.0, 0.0, 'pending'),
(4, 'mechanical', 'Lubrificação', 'Lubrificação dos componentes', 0.0, 100.0, 4.0, 0.0, 'pending');

-- Verificar os dados inseridos
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
