-- Script para inserir tarefas de exemplo
-- =====================================

-- Inserir tarefas para equipamentos existentes
-- Equipamento 1 (Moinho de Cru)
INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, status, priority) VALUES
(1, 'electrical', 'Instalação de Painel Elétrico', 'Instalação e montagem do painel elétrico principal do moinho', 75, 100, 16.0, 'in-progress', 'high'),
(1, 'mechanical', 'Montagem de Estrutura', 'Montagem da estrutura mecânica do moinho', 90, 100, 20.0, 'in-progress', 'high'),
(1, 'civil', 'Preparação de Fundação', 'Preparação e nivelamento da fundação', 100, 100, 32.0, 'completed', 'high');

-- Equipamento 2 (Forno Rotativo)
INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, status, priority) VALUES
(2, 'electrical', 'Cabeamento de Potência', 'Instalação de cabos de potência e distribuição', 60, 100, 24.0, 'in-progress', 'high'),
(2, 'mechanical', 'Instalação de Motores', 'Instalação e alinhamento de motores', 45, 100, 16.0, 'in-progress', 'high'),
(2, 'civil', 'Instalação de Estrutura', 'Instalação da estrutura civil', 80, 100, 24.0, 'in-progress', 'high');

-- Equipamento 3 (Resfriador)
INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, status, priority) VALUES
(3, 'electrical', 'Instalação de Iluminação', 'Instalação de sistema de iluminação', 30, 100, 12.0, 'in-progress', 'normal'),
(3, 'mechanical', 'Instalação de Bombas', 'Instalação e teste de bombas', 20, 100, 12.0, 'in-progress', 'high'),
(3, 'civil', 'Alvenaria', 'Execução de alvenaria e vedação', 50, 100, 20.0, 'in-progress', 'normal');

-- Equipamento 4 (Separador)
INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, status, priority) VALUES
(4, 'electrical', 'Instalação de Tomadas', 'Instalação de tomadas e pontos de energia', 15, 100, 8.0, 'pending', 'normal'),
(4, 'mechanical', 'Instalação de Válvulas', 'Instalação e regulagem de válvulas', 0, 100, 8.0, 'pending', 'normal'),
(4, 'civil', 'Acabamento', 'Acabamento e pintura', 0, 100, 16.0, 'pending', 'low');

-- Equipamento 5 (Filtro de Pó)
INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, status, priority) VALUES
(5, 'electrical', 'Teste de Continuidade', 'Teste de continuidade e isolamento', 0, 100, 4.0, 'pending', 'normal'),
(5, 'mechanical', 'Lubrificação', 'Lubrificação de componentes mecânicos', 0, 100, 4.0, 'pending', 'normal'),
(5, 'civil', 'Instalação de Piso', 'Instalação de piso e revestimentos', 0, 100, 12.0, 'pending', 'low');

-- Equipamento 6 (Transportador de Correia)
INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, status, priority) VALUES
(6, 'electrical', 'Teste de Funcionamento', 'Teste de funcionamento dos sistemas elétricos', 0, 100, 6.0, 'pending', 'high'),
(6, 'mechanical', 'Teste de Funcionamento', 'Teste de funcionamento dos sistemas mecânicos', 0, 100, 8.0, 'pending', 'high'),
(6, 'civil', 'Teste de Resistência', 'Teste de resistência estrutural', 0, 100, 8.0, 'pending', 'high');

-- Inserir algumas tarefas para equipamentos filhos (se existirem)
-- Equipamento 7 (Bomba de Água - filho do Moinho)
INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, status, priority) VALUES
(7, 'electrical', 'Instalação de Painel Elétrico', 'Instalação do painel elétrico da bomba', 85, 100, 8.0, 'in-progress', 'high'),
(7, 'mechanical', 'Instalação de Bombas', 'Instalação e teste da bomba de água', 95, 100, 12.0, 'in-progress', 'high');

-- Equipamento 8 (Ventilador - filho do Moinho)
INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, status, priority) VALUES
(8, 'electrical', 'Instalação de Motores', 'Instalação do motor do ventilador', 70, 100, 10.0, 'in-progress', 'high'),
(8, 'mechanical', 'Instalação de Válvulas', 'Instalação e regulagem das válvulas', 40, 100, 6.0, 'in-progress', 'normal');

-- Equipamento 9 (Sistema de Lubrificação - filho do Forno)
INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, status, priority) VALUES
(9, 'electrical', 'Instalação de Painel Elétrico', 'Instalação do painel elétrico do sistema', 55, 100, 12.0, 'in-progress', 'high'),
(9, 'mechanical', 'Lubrificação', 'Instalação do sistema de lubrificação', 65, 100, 8.0, 'in-progress', 'high');

-- Equipamento 10 (Sistema de Refrigeração - filho do Forno)
INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, status, priority) VALUES
(10, 'electrical', 'Cabeamento de Potência', 'Instalação de cabos para o sistema de refrigeração', 25, 100, 16.0, 'in-progress', 'high'),
(10, 'mechanical', 'Instalação de Bombas', 'Instalação das bombas de refrigeração', 35, 100, 14.0, 'in-progress', 'high');

GO

-- Verificar as tarefas inseridas
SELECT 
  e.equipmentTag,
  e.name as equipmentName,
  et.discipline,
  et.name as taskName,
  et.currentProgress,
  et.targetProgress,
  et.status,
  et.priority
FROM Equipment e
JOIN EquipmentTasks et ON e.id = et.equipmentId
ORDER BY e.equipmentTag, et.discipline;

GO
