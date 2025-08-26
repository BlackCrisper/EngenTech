-- Hierarquia de Equipamentos e Sistema de Tarefas
-- ===============================================

-- Adicionar colunas para hierarquia na tabela Equipment
ALTER TABLE Equipment ADD 
    parentId INT NULL,
    equipmentType NVARCHAR(50) DEFAULT 'child', -- 'parent' ou 'child'
    hierarchyLevel INT DEFAULT 1,
    FOREIGN KEY (parentId) REFERENCES Equipment(id);

-- Tabela de Tarefas Padrão por Disciplina
CREATE TABLE StandardTasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    discipline NVARCHAR(50) NOT NULL, -- 'electrical', 'mechanical', 'civil'
    name NVARCHAR(200) NOT NULL,
    description NVARCHAR(500),
    estimatedHours DECIMAL(5,2) DEFAULT 0,
    isActive BIT DEFAULT 1,
    sortOrder INT DEFAULT 0,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Tabela de Tarefas por Equipamento
CREATE TABLE EquipmentTasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    equipmentId INT NOT NULL,
    standardTaskId INT NULL, -- NULL para tarefas personalizadas
    discipline NVARCHAR(50) NOT NULL, -- 'electrical', 'mechanical', 'civil'
    name NVARCHAR(200) NOT NULL,
    description NVARCHAR(500),
    currentProgress DECIMAL(5,2) DEFAULT 0,
    targetProgress DECIMAL(5,2) DEFAULT 100,
    estimatedHours DECIMAL(5,2) DEFAULT 0,
    actualHours DECIMAL(5,2) DEFAULT 0,
    status NVARCHAR(50) DEFAULT 'pending', -- 'pending', 'in-progress', 'completed', 'on-hold'
    priority NVARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
    startDate DATE,
    dueDate DATE,
    completedDate DATE,
    isCustom BIT DEFAULT 0, -- 1 para tarefas personalizadas
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (equipmentId) REFERENCES Equipment(id),
    FOREIGN KEY (standardTaskId) REFERENCES StandardTasks(id)
);

-- Tabela de Histórico de Tarefas
CREATE TABLE TaskHistory (
    id INT IDENTITY(1,1) PRIMARY KEY,
    taskId INT NOT NULL,
    userId INT NOT NULL,
    action NVARCHAR(50) NOT NULL, -- 'created', 'updated', 'completed', 'status-changed'
    previousProgress DECIMAL(5,2),
    newProgress DECIMAL(5,2),
    previousStatus NVARCHAR(50),
    newStatus NVARCHAR(50),
    observations NVARCHAR(1000),
    photos NVARCHAR(MAX), -- JSON array com URLs das fotos
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (taskId) REFERENCES EquipmentTasks(id),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Inserir tarefas padrão por disciplina
INSERT INTO StandardTasks (discipline, name, description, estimatedHours, sortOrder) VALUES
-- Elétrica
('electrical', 'Instalação de Painel Elétrico', 'Instalação e montagem do painel elétrico principal', 16.0, 1),
('electrical', 'Cabeamento de Potência', 'Instalação de cabos de potência e distribuição', 24.0, 2),
('electrical', 'Instalação de Iluminação', 'Instalação de sistema de iluminação', 12.0, 3),
('electrical', 'Instalação de Tomadas', 'Instalação de tomadas e pontos de energia', 8.0, 4),
('electrical', 'Teste de Continuidade', 'Teste de continuidade e isolamento', 4.0, 5),
('electrical', 'Teste de Funcionamento', 'Teste de funcionamento dos sistemas elétricos', 6.0, 6),

-- Mecânica
('mechanical', 'Montagem de Estrutura', 'Montagem da estrutura mecânica', 20.0, 1),
('mechanical', 'Instalação de Motores', 'Instalação e alinhamento de motores', 16.0, 2),
('mechanical', 'Instalação de Bombas', 'Instalação e teste de bombas', 12.0, 3),
('mechanical', 'Instalação de Válvulas', 'Instalação e regulagem de válvulas', 8.0, 4),
('mechanical', 'Lubrificação', 'Lubrificação de componentes mecânicos', 4.0, 5),
('mechanical', 'Teste de Funcionamento', 'Teste de funcionamento dos sistemas mecânicos', 8.0, 6),

-- Civil
('civil', 'Preparação de Fundação', 'Preparação e nivelamento da fundação', 32.0, 1),
('civil', 'Instalação de Estrutura', 'Instalação da estrutura civil', 24.0, 2),
('civil', 'Alvenaria', 'Execução de alvenaria e vedação', 20.0, 3),
('civil', 'Acabamento', 'Acabamento e pintura', 16.0, 4),
('civil', 'Instalação de Piso', 'Instalação de piso e revestimentos', 12.0, 5),
('civil', 'Teste de Resistência', 'Teste de resistência estrutural', 8.0, 6);

-- Criar índices para melhor performance
CREATE INDEX IX_Equipment_ParentId ON Equipment(parentId);
CREATE INDEX IX_EquipmentTasks_EquipmentId ON EquipmentTasks(equipmentId);
CREATE INDEX IX_EquipmentTasks_Discipline ON EquipmentTasks(discipline);
CREATE INDEX IX_EquipmentTasks_Status ON EquipmentTasks(status);
CREATE INDEX IX_TaskHistory_TaskId ON TaskHistory(taskId);
CREATE INDEX IX_TaskHistory_CreatedAt ON TaskHistory(createdAt);

GO
