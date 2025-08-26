-- =====================================================
-- SCHEMA SESMT (Serviços Especializados em Engenharia 
-- de Segurança e em Medicina do Trabalho)
-- =====================================================

-- Tabela de tipos de ocorrências SESMT
CREATE TABLE SESMTOccurrenceTypes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    severity NVARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETDATE()
);

-- Inserir tipos padrão de ocorrências
INSERT INTO SESMTOccurrenceTypes (name, description, severity) VALUES
('Acidente de Trabalho', 'Acidente que causa lesão corporal ou perturbação funcional', 'critical'),
('Incidente', 'Ocorrência que poderia ter resultado em acidente', 'high'),
('Quase Acidente', 'Situação que quase resultou em acidente', 'medium'),
('Condição Insegura', 'Condição que pode causar acidente', 'medium'),
('Ato Inseguro', 'Comportamento que pode causar acidente', 'medium'),
('Observação de Segurança', 'Observação positiva ou negativa relacionada à segurança', 'low'),
('Inspeção de Segurança', 'Relatório de inspeção de segurança', 'low'),
('Treinamento de Segurança', 'Registro de treinamento realizado', 'low');

-- Tabela principal de ocorrências SESMT
CREATE TABLE SESMTOccurrences (
    id INT IDENTITY(1,1) PRIMARY KEY,
    areaId INT NOT NULL,
    occurrenceTypeId INT NOT NULL,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    severity NVARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    status NVARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
    reportedBy INT NOT NULL, -- userId
    involvedPersons NVARCHAR(500), -- Nomes das pessoas envolvidas
    dateTimeOccurrence DATETIME NOT NULL,
    dateTimeReport DATETIME DEFAULT GETDATE(),
    location NVARCHAR(200), -- Local específico dentro da área
    weatherConditions NVARCHAR(100), -- Condições climáticas
    equipmentInvolved NVARCHAR(500), -- Equipamentos envolvidos
    immediateActions NVARCHAR(MAX), -- Ações imediatas tomadas
    recommendations NVARCHAR(MAX), -- Recomendações
    photos NVARCHAR(MAX), -- JSON array com URLs das fotos
    documents NVARCHAR(MAX), -- JSON array com URLs dos documentos
    isConfidential BIT DEFAULT 0, -- Se é confidencial
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    -- Foreign Keys
    FOREIGN KEY (areaId) REFERENCES Areas(id),
    FOREIGN KEY (occurrenceTypeId) REFERENCES SESMTOccurrenceTypes(id),
    FOREIGN KEY (reportedBy) REFERENCES Users(id)
);

-- Tabela de histórico de ocorrências SESMT
CREATE TABLE SESMTOccurrenceHistory (
    id INT IDENTITY(1,1) PRIMARY KEY,
    occurrenceId INT NOT NULL,
    userId INT NOT NULL,
    action NVARCHAR(50) NOT NULL, -- 'created', 'updated', 'status_changed', 'commented'
    previousStatus NVARCHAR(20),
    newStatus NVARCHAR(20),
    previousSeverity NVARCHAR(20),
    newSeverity NVARCHAR(20),
    comments NVARCHAR(MAX),
    photos NVARCHAR(MAX), -- JSON array com URLs das fotos
    documents NVARCHAR(MAX), -- JSON array com URLs dos documentos
    createdAt DATETIME DEFAULT GETDATE(),
    
    -- Foreign Keys
    FOREIGN KEY (occurrenceId) REFERENCES SESMTOccurrences(id),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Tabela de comentários em ocorrências SESMT
CREATE TABLE SESMTOccurrenceComments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    occurrenceId INT NOT NULL,
    userId INT NOT NULL,
    comment NVARCHAR(MAX) NOT NULL,
    photos NVARCHAR(MAX), -- JSON array com URLs das fotos
    documents NVARCHAR(MAX), -- JSON array com URLs dos documentos
    isInternal BIT DEFAULT 0, -- Se é comentário interno (não visível para todos)
    createdAt DATETIME DEFAULT GETDATE(),
    
    -- Foreign Keys
    FOREIGN KEY (occurrenceId) REFERENCES SESMTOccurrences(id),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Tabela de investigações de acidentes
CREATE TABLE SESMTInvestigations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    occurrenceId INT NOT NULL,
    investigatorId INT NOT NULL, -- userId do investigador
    investigationDate DATETIME NOT NULL,
    rootCauses NVARCHAR(MAX), -- Causas raiz identificadas
    contributingFactors NVARCHAR(MAX), -- Fatores contribuintes
    correctiveActions NVARCHAR(MAX), -- Ações corretivas propostas
    preventiveActions NVARCHAR(MAX), -- Ações preventivas propostas
    responsiblePersons NVARCHAR(500), -- Pessoas responsáveis pelas ações
    deadlineActions DATETIME, -- Prazo para implementação das ações
    status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    photos NVARCHAR(MAX), -- JSON array com URLs das fotos
    documents NVARCHAR(MAX), -- JSON array com URLs dos documentos
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    -- Foreign Keys
    FOREIGN KEY (occurrenceId) REFERENCES SESMTOccurrences(id),
    FOREIGN KEY (investigatorId) REFERENCES Users(id)
);

-- Tabela de ações corretivas/preventivas
CREATE TABLE SESMTActions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    occurrenceId INT NOT NULL,
    investigationId INT, -- Pode ser NULL se não for parte de uma investigação
    actionType NVARCHAR(20) NOT NULL, -- 'corrective', 'preventive'
    description NVARCHAR(MAX) NOT NULL,
    responsiblePerson NVARCHAR(100) NOT NULL,
    deadline DATETIME NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue'
    completionDate DATETIME,
    completionNotes NVARCHAR(MAX),
    photos NVARCHAR(MAX), -- JSON array com URLs das fotos
    documents NVARCHAR(MAX), -- JSON array com URLs dos documentos
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    -- Foreign Keys
    FOREIGN KEY (occurrenceId) REFERENCES SESMTOccurrences(id),
    FOREIGN KEY (investigationId) REFERENCES SESMTInvestigations(id)
);

-- Índices para melhor performance
CREATE INDEX IX_SESMTOccurrences_AreaId ON SESMTOccurrences(areaId);
CREATE INDEX IX_SESMTOccurrences_TypeId ON SESMTOccurrences(occurrenceTypeId);
CREATE INDEX IX_SESMTOccurrences_Status ON SESMTOccurrences(status);
CREATE INDEX IX_SESMTOccurrences_Severity ON SESMTOccurrences(severity);
CREATE INDEX IX_SESMTOccurrences_DateTime ON SESMTOccurrences(dateTimeOccurrence);
CREATE INDEX IX_SESMTOccurrences_ReportedBy ON SESMTOccurrences(reportedBy);

CREATE INDEX IX_SESMTOccurrenceHistory_OccurrenceId ON SESMTOccurrenceHistory(occurrenceId);
CREATE INDEX IX_SESMTOccurrenceHistory_UserId ON SESMTOccurrenceHistory(userId);
CREATE INDEX IX_SESMTOccurrenceHistory_CreatedAt ON SESMTOccurrenceHistory(createdAt);

CREATE INDEX IX_SESMTOccurrenceComments_OccurrenceId ON SESMTOccurrenceComments(occurrenceId);
CREATE INDEX IX_SESMTOccurrenceComments_UserId ON SESMTOccurrenceComments(userId);

CREATE INDEX IX_SESMTInvestigations_OccurrenceId ON SESMTInvestigations(occurrenceId);
CREATE INDEX IX_SESMTInvestigations_InvestigatorId ON SESMTInvestigations(investigatorId);

CREATE INDEX IX_SESMTActions_OccurrenceId ON SESMTActions(occurrenceId);
CREATE INDEX IX_SESMTActions_Status ON SESMTActions(status);
CREATE INDEX IX_SESMTActions_Deadline ON SESMTActions(deadline);

-- Inserir dados de exemplo
INSERT INTO SESMTOccurrences (areaId, occurrenceTypeId, title, description, severity, status, reportedBy, involvedPersons, dateTimeOccurrence, location, immediateActions, recommendations) VALUES
(1, 1, 'Acidente com equipamento de proteção', 'Funcionário sofreu pequeno corte na mão durante operação', 'medium', 'investigating', 1, 'João Silva', '2024-01-15 14:30:00', 'Setor de Produção A - Linha 1', 'Primeiros socorros aplicados, funcionário encaminhado ao médico', 'Revisar procedimentos de segurança, treinar equipe'),
(1, 2, 'Quase acidente com empilhadeira', 'Empilhadeira quase colidiu com pedestre', 'high', 'open', 1, 'Maria Santos', '2024-01-16 09:15:00', 'Área de Estoque', 'Sinalização melhorada, treinamento de segurança', 'Implementar barreiras físicas, melhorar sinalização');

-- Inserir histórico de exemplo
INSERT INTO SESMTOccurrenceHistory (occurrenceId, userId, action, previousStatus, newStatus, comments) VALUES
(1, 1, 'created', NULL, 'open', 'Ocorrência registrada'),
(1, 1, 'status_changed', 'open', 'investigating', 'Iniciando investigação do acidente'),
(2, 1, 'created', NULL, 'open', 'Quase acidente registrado');

-- Inserir comentários de exemplo
INSERT INTO SESMTOccurrenceComments (occurrenceId, userId, comment) VALUES
(1, 1, 'Funcionário estava usando EPI adequado no momento do acidente'),
(1, 1, 'Equipamento foi inspecionado e está em boas condições'),
(2, 1, 'Área estava bem iluminada no momento do incidente');

PRINT 'Schema SESMT criado com sucesso!';
