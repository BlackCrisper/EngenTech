-- =====================================================
-- Script de Inicialização do Banco de Dados EnginSync
-- Banco: EngenTech
-- =====================================================

-- Criar tabela de usuários
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) UNIQUE NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    fullName NVARCHAR(100) NOT NULL,
    role NVARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    isActive BIT DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
)
GO

-- Criar tabela de áreas
CREATE TABLE Areas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
)
GO

-- Criar tabela de equipamentos
CREATE TABLE Equipment (
    id INT IDENTITY(1,1) PRIMARY KEY,
    equipmentTag NVARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(100) NOT NULL,
    areaId INT NOT NULL,
    description NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (areaId) REFERENCES Areas(id)
)
GO

-- Criar tabela de progresso por disciplina
CREATE TABLE Progress (
    id INT IDENTITY(1,1) PRIMARY KEY,
    equipmentId INT NOT NULL,
    discipline NVARCHAR(20) NOT NULL CHECK (discipline IN ('electrical', 'mechanical', 'civil')),
    currentProgress DECIMAL(5,2) DEFAULT 0 CHECK (currentProgress >= 0 AND currentProgress <= 100),
    targetProgress DECIMAL(5,2) DEFAULT 100,
    observations NVARCHAR(1000),
    updatedBy INT NOT NULL,
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (equipmentId) REFERENCES Equipment(id),
    FOREIGN KEY (updatedBy) REFERENCES Users(id)
)
GO

-- Criar tabela de histórico de atualizações
CREATE TABLE ProgressHistory (
    id INT IDENTITY(1,1) PRIMARY KEY,
    progressId INT NOT NULL,
    previousProgress DECIMAL(5,2),
    newProgress DECIMAL(5,2) NOT NULL,
    observations NVARCHAR(1000),
    updatedBy INT NOT NULL,
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (progressId) REFERENCES Progress(id),
    FOREIGN KEY (updatedBy) REFERENCES Users(id)
)
GO

-- Criar tabela de fotos/documentos
CREATE TABLE Documents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    progressId INT NOT NULL,
    fileName NVARCHAR(255) NOT NULL,
    filePath NVARCHAR(500) NOT NULL,
    fileType NVARCHAR(50),
    fileSize INT,
    uploadedBy INT NOT NULL,
    uploadedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (progressId) REFERENCES Progress(id),
    FOREIGN KEY (uploadedBy) REFERENCES Users(id)
)
GO

-- Criar tabela de métricas do dashboard
CREATE TABLE DashboardMetrics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    metricName NVARCHAR(50) NOT NULL,
    metricValue DECIMAL(10,2) NOT NULL,
    metricUnit NVARCHAR(20),
    description NVARCHAR(200),
    recordedAt DATETIME2 DEFAULT GETDATE()
)
GO

-- Inserir dados iniciais

-- Usuários padrão
INSERT INTO Users (username, email, password, fullName, role) VALUES
('admin', 'admin@mizucimentos.com', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Administrador Sistema', 'admin'),
('joao.silva', 'joao.silva@mizucimentos.com', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'João Silva', 'manager'),
('maria.santos', 'maria.santos@mizucimentos.com', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Maria Santos', 'user')
GO

-- Áreas
INSERT INTO Areas (name, description) VALUES
('Área de Produção A', 'Principal área de produção com moinhos e fornos'),
('Área de Produção B', 'Área secundária de produção'),
('Estação de Ensacamento', 'Área de ensacamento e empacotamento'),
('Laboratório de Qualidade', 'Laboratório para controle de qualidade'),
('Área de Armazenamento', 'Silos e área de armazenamento de matérias-primas'),
('Subestação Elétrica', 'Subestação principal de energia'),
('Sistema de Água', 'Sistema de tratamento e distribuição de água'),
('Sistema de Ar Comprimido', 'Compressores e rede de ar comprimido')
GO

-- Equipamentos
INSERT INTO Equipment (equipmentTag, name, areaId, description) VALUES
('MOINHO-01', 'Moinho Principal', 1, 'Moinho de bolas principal para moagem de clínquer'),
('MOINHO-02', 'Moinho Secundário', 1, 'Moinho auxiliar para moagem fina'),
('ESTEIRA-01', 'Esteira Transportadora 01', 1, 'Esteira principal de transporte de materiais'),
('ESTEIRA-02', 'Esteira Transportadora 02', 3, 'Esteira de alimentação do ensacamento'),
('BOMBA-HIDR-01', 'Bomba Hidráulica 01', 7, 'Bomba principal do sistema de água'),
('BOMBA-HIDR-02', 'Bomba Hidráulica 02', 7, 'Bomba auxiliar do sistema de água'),
('BOMBA-HIDR-03', 'Bomba Hidráulica 03', 7, 'Bomba de emergência do sistema de água'),
('COMPRESSOR-01', 'Compressor de Ar 01', 8, 'Compressor principal de ar comprimido'),
('COMPRESSOR-02', 'Compressor de Ar 02', 8, 'Compressor auxiliar de ar comprimido'),
('TRANSFORMADOR-01', 'Transformador Principal', 6, 'Transformador principal da subestação'),
('SILO-01', 'Silo de Clínquer', 5, 'Silo principal de armazenamento de clínquer'),
('SILO-02', 'Silo de Gesso', 5, 'Silo de armazenamento de gesso'),
('FORNO-01', 'Forno Rotativo', 1, 'Forno principal de calcinação')
GO

-- Progresso inicial
INSERT INTO Progress (equipmentId, discipline, currentProgress, updatedBy) VALUES
(1, 'electrical', 85, 1),
(1, 'mechanical', 72, 1),
(1, 'civil', 90, 1),
(2, 'electrical', 45, 1),
(2, 'mechanical', 60, 1),
(2, 'civil', 30, 1),
(3, 'electrical', 100, 1),
(3, 'mechanical', 100, 1),
(3, 'civil', 100, 1),
(4, 'electrical', 75, 1),
(4, 'mechanical', 80, 1),
(4, 'civil', 65, 1),
(5, 'electrical', 90, 1),
(5, 'mechanical', 85, 1),
(5, 'civil', 95, 1)
GO

-- Métricas do dashboard
INSERT INTO DashboardMetrics (metricName, metricValue, metricUnit, description) VALUES
('Progresso Total', 76.5, '%', 'Progresso geral da obra'),
('Equipamentos Cadastrados', 142, 'unidades', 'Total de equipamentos no sistema'),
('Tarefas Concluídas', 324, 'tarefas', 'Tarefas finalizadas'),
('Áreas Ativas', 8, 'áreas', 'Áreas em progresso'),
('Alertas', 3, 'alertas', 'Alertas que requerem atenção'),
('Equipe Ativa', 24, 'técnicos', 'Técnicos trabalhando')
GO

-- Criar índices para melhor performance
CREATE INDEX IX_Equipment_AreaId ON Equipment(areaId)
GO
CREATE INDEX IX_Progress_EquipmentId ON Progress(equipmentId)
GO
CREATE INDEX IX_ProgressHistory_ProgressId ON ProgressHistory(progressId)
GO
CREATE INDEX IX_Documents_ProgressId ON Documents(progressId)
GO

PRINT '✅ Banco de dados EnginSync inicializado com sucesso!'
GO
