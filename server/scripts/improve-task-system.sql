-- Melhorias no Sistema de Tarefas - Upload de Fotos e Histórico
-- =============================================================

-- 1. Melhorar a tabela TaskHistory para suportar fotos
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TaskHistory') AND name = 'photos')
BEGIN
    ALTER TABLE TaskHistory ADD photos NVARCHAR(MAX) NULL;
END

-- 2. Adicionar coluna para armazenar caminhos das fotos na tabela EquipmentTasks
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('EquipmentTasks') AND name = 'currentPhotos')
BEGIN
    ALTER TABLE EquipmentTasks ADD currentPhotos NVARCHAR(MAX) NULL;
END

-- 3. Criar tabela para armazenar informações das fotos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('TaskPhotos') AND type in (N'U'))
BEGIN
    CREATE TABLE TaskPhotos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        taskId INT NOT NULL,
        historyId INT NULL, -- NULL para fotos atuais da tarefa
        fileName NVARCHAR(255) NOT NULL,
        filePath NVARCHAR(500) NOT NULL,
        fileSize INT,
        mimeType NVARCHAR(100),
        uploadedBy INT NOT NULL,
        uploadedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (taskId) REFERENCES EquipmentTasks(id),
        FOREIGN KEY (historyId) REFERENCES TaskHistory(id),
        FOREIGN KEY (uploadedBy) REFERENCES Users(id)
    );
END

-- 4. Criar índices para melhor performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('TaskPhotos') AND name = 'IX_TaskPhotos_TaskId')
BEGIN
    CREATE INDEX IX_TaskPhotos_TaskId ON TaskPhotos(taskId);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('TaskPhotos') AND name = 'IX_TaskPhotos_HistoryId')
BEGIN
    CREATE INDEX IX_TaskPhotos_HistoryId ON TaskPhotos(historyId);
END

-- 5. Adicionar colunas para melhor controle de progresso
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('EquipmentTasks') AND name = 'lastProgressUpdate')
BEGIN
    ALTER TABLE EquipmentTasks ADD lastProgressUpdate DATETIME2 NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('EquipmentTasks') AND name = 'lastUpdatedBy')
BEGIN
    ALTER TABLE EquipmentTasks ADD lastUpdatedBy INT NULL;
    ALTER TABLE EquipmentTasks ADD CONSTRAINT FK_EquipmentTasks_LastUpdatedBy 
        FOREIGN KEY (lastUpdatedBy) REFERENCES Users(id);
END

-- 6. Melhorar a tabela TaskHistory com mais detalhes
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TaskHistory') AND name = 'actualHours')
BEGIN
    ALTER TABLE TaskHistory ADD actualHours DECIMAL(5,2) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TaskHistory') AND name = 'ipAddress')
BEGIN
    ALTER TABLE TaskHistory ADD ipAddress NVARCHAR(45) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TaskHistory') AND name = 'userAgent')
BEGIN
    ALTER TABLE TaskHistory ADD userAgent NVARCHAR(500) NULL;
END

-- 7. Criar view para facilitar consultas de histórico com fotos
IF EXISTS (SELECT * FROM sys.views WHERE name = 'TaskHistoryWithPhotos')
BEGIN
    DROP VIEW TaskHistoryWithPhotos;
END

CREATE VIEW TaskHistoryWithPhotos AS
SELECT 
    th.id,
    th.taskId,
    th.userId,
    th.action,
    th.previousProgress,
    th.newProgress,
    th.previousStatus,
    th.newStatus,
    th.observations,
    th.actualHours,
    th.photos,
    th.createdAt,
    th.ipAddress,
    th.userAgent,
    u.username as updatedByUsername,
    u.fullName as updatedByFullName,
    u.role as updatedByRole,
    tp.id as photoId,
    tp.fileName,
    tp.filePath,
    tp.fileSize,
    tp.mimeType,
    tp.uploadedAt as photoUploadedAt
FROM TaskHistory th
LEFT JOIN Users u ON th.userId = u.id
LEFT JOIN TaskPhotos tp ON th.id = tp.historyId
ORDER BY th.createdAt DESC, tp.uploadedAt DESC;

-- 8. Criar view para tarefas com informações de fotos
IF EXISTS (SELECT * FROM sys.views WHERE name = 'EquipmentTasksWithPhotos')
BEGIN
    DROP VIEW EquipmentTasksWithPhotos;
END

CREATE VIEW EquipmentTasksWithPhotos AS
SELECT 
    et.*,
    u.username as lastUpdatedByUsername,
    u.fullName as lastUpdatedByFullName,
    tp.id as photoId,
    tp.fileName,
    tp.filePath,
    tp.fileSize,
    tp.mimeType,
    tp.uploadedAt as photoUploadedAt
FROM EquipmentTasks et
LEFT JOIN Users u ON et.lastUpdatedBy = u.id
LEFT JOIN TaskPhotos tp ON et.id = tp.taskId AND tp.historyId IS NULL
ORDER BY et.updatedAt DESC, tp.uploadedAt DESC;

-- 9. Criar stored procedure para atualizar progresso com fotos
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('UpdateTaskProgressWithPhotos') AND type in (N'P'))
BEGIN
    DROP PROCEDURE UpdateTaskProgressWithPhotos;
END

CREATE PROCEDURE UpdateTaskProgressWithPhotos
    @taskId INT,
    @userId INT,
    @newProgress DECIMAL(5,2),
    @observations NVARCHAR(1000) = NULL,
    @actualHours DECIMAL(5,2) = NULL,
    @photoUrls NVARCHAR(MAX) = NULL,
    @ipAddress NVARCHAR(45) = NULL,
    @userAgent NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @previousProgress DECIMAL(5,2);
    DECLARE @previousStatus NVARCHAR(50);
    DECLARE @newStatus NVARCHAR(50);
    DECLARE @historyId INT;
    
    -- Buscar progresso atual
    SELECT @previousProgress = currentProgress, @previousStatus = status
    FROM EquipmentTasks 
    WHERE id = @taskId;
    
    -- Determinar novo status
    SET @newStatus = CASE 
        WHEN @newProgress >= 100 THEN 'completed'
        WHEN @newProgress > 0 THEN 'in-progress'
        ELSE 'pending'
    END;
    
    -- Atualizar tarefa
    UPDATE EquipmentTasks
    SET currentProgress = @newProgress,
        status = @newStatus,
        actualHours = ISNULL(@actualHours, actualHours),
        lastProgressUpdate = GETDATE(),
        lastUpdatedBy = @userId,
        updatedAt = GETDATE()
    WHERE id = @taskId;
    
    -- Inserir no histórico
    INSERT INTO TaskHistory (taskId, userId, action, previousProgress, newProgress, previousStatus, newStatus, observations, actualHours, photos, ipAddress, userAgent)
    VALUES (@taskId, @userId, 'progress-updated', @previousProgress, @newProgress, @previousStatus, @newStatus, @observations, @actualHours, @photoUrls, @ipAddress, @userAgent);
    
    SET @historyId = SCOPE_IDENTITY();
    
    -- Retornar informações da atualização
    SELECT 
        @taskId as taskId,
        @newProgress as currentProgress,
        @newStatus as status,
        @historyId as historyId,
        'Progresso atualizado com sucesso' as message;
END;

-- 10. Criar stored procedure para buscar histórico de uma tarefa
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('GetTaskHistory') AND type in (N'P'))
BEGIN
    DROP PROCEDURE GetTaskHistory;
END

CREATE PROCEDURE GetTaskHistory
    @taskId INT,
    @limit INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@limit)
        th.id,
        th.action,
        th.previousProgress,
        th.newProgress,
        th.previousStatus,
        th.newStatus,
        th.observations,
        th.actualHours,
        th.photos,
        th.createdAt,
        th.ipAddress,
        u.username as updatedByUsername,
        u.fullName as updatedByFullName,
        u.role as updatedByRole
    FROM TaskHistory th
    LEFT JOIN Users u ON th.userId = u.id
    WHERE th.taskId = @taskId
    ORDER BY th.createdAt DESC;
END;

PRINT 'Sistema de tarefas melhorado com sucesso!';
PRINT '- Tabela TaskPhotos criada para armazenar fotos';
PRINT '- Views criadas para facilitar consultas';
PRINT '- Stored procedures criadas para operações complexas';
PRINT '- Índices otimizados para melhor performance';
