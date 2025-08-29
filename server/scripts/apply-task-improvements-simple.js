import { getConnection } from '../config/database.js';
import { logger } from '../config/logger.js';

async function applyTaskImprovementsSimple() {
  try {
    logger.info('🔧 Aplicando melhorias no sistema de tarefas (versão simplificada)...');
    
    const pool = await getConnection();
    
    // 1. Adicionar coluna photos na tabela TaskHistory
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TaskHistory') AND name = 'photos')
        BEGIN
          ALTER TABLE TaskHistory ADD photos NVARCHAR(MAX) NULL;
        END
      `);
      logger.success('✅ Coluna photos adicionada na TaskHistory');
    } catch (error) {
      logger.warn('⚠️  Coluna photos já existe ou erro:', error.message);
    }

    // 2. Adicionar coluna currentPhotos na tabela EquipmentTasks
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('EquipmentTasks') AND name = 'currentPhotos')
        BEGIN
          ALTER TABLE EquipmentTasks ADD currentPhotos NVARCHAR(MAX) NULL;
        END
      `);
      logger.success('✅ Coluna currentPhotos adicionada na EquipmentTasks');
    } catch (error) {
      logger.warn('⚠️  Coluna currentPhotos já existe ou erro:', error.message);
    }

    // 3. Criar tabela TaskPhotos
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('TaskPhotos') AND type in (N'U'))
        BEGIN
          CREATE TABLE TaskPhotos (
            id INT IDENTITY(1,1) PRIMARY KEY,
            taskId INT NOT NULL,
            historyId INT NULL,
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
      `);
      logger.success('✅ Tabela TaskPhotos criada');
    } catch (error) {
      logger.warn('⚠️  Tabela TaskPhotos já existe ou erro:', error.message);
    }

    // 4. Adicionar colunas na TaskHistory
    const taskHistoryColumns = [
      { name: 'actualHours', type: 'DECIMAL(5,2) NULL' },
      { name: 'ipAddress', type: 'NVARCHAR(45) NULL' },
      { name: 'userAgent', type: 'NVARCHAR(500) NULL' }
    ];

    for (const column of taskHistoryColumns) {
      try {
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TaskHistory') AND name = '${column.name}')
          BEGIN
            ALTER TABLE TaskHistory ADD ${column.name} ${column.type};
          END
        `);
        logger.success(`✅ Coluna ${column.name} adicionada na TaskHistory`);
      } catch (error) {
        logger.warn(`⚠️  Coluna ${column.name} já existe ou erro:`, error.message);
      }
    }

    // 5. Adicionar colunas na EquipmentTasks
    const equipmentTasksColumns = [
      { name: 'lastProgressUpdate', type: 'DATETIME2 NULL' },
      { name: 'lastUpdatedBy', type: 'INT NULL' }
    ];

    for (const column of equipmentTasksColumns) {
      try {
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('EquipmentTasks') AND name = '${column.name}')
          BEGIN
            ALTER TABLE EquipmentTasks ADD ${column.name} ${column.type};
          END
        `);
        logger.success(`✅ Coluna ${column.name} adicionada na EquipmentTasks`);
      } catch (error) {
        logger.warn(`⚠️  Coluna ${column.name} já existe ou erro:`, error.message);
      }
    }

    // 6. Adicionar foreign key para lastUpdatedBy
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_EquipmentTasks_LastUpdatedBy')
        BEGIN
          ALTER TABLE EquipmentTasks ADD CONSTRAINT FK_EquipmentTasks_LastUpdatedBy 
            FOREIGN KEY (lastUpdatedBy) REFERENCES Users(id);
        END
      `);
      logger.success('✅ Foreign key FK_EquipmentTasks_LastUpdatedBy criada');
    } catch (error) {
      logger.warn('⚠️  Foreign key já existe ou erro:', error.message);
    }

    // 7. Criar índices para TaskPhotos
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('TaskPhotos') AND name = 'IX_TaskPhotos_TaskId')
        BEGIN
          CREATE INDEX IX_TaskPhotos_TaskId ON TaskPhotos(taskId);
        END
      `);
      logger.success('✅ Índice IX_TaskPhotos_TaskId criado');
    } catch (error) {
      logger.warn('⚠️  Índice já existe ou erro:', error.message);
    }

    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('TaskPhotos') AND name = 'IX_TaskPhotos_HistoryId')
        BEGIN
          CREATE INDEX IX_TaskPhotos_HistoryId ON TaskPhotos(historyId);
        END
      `);
      logger.success('✅ Índice IX_TaskPhotos_HistoryId criado');
    } catch (error) {
      logger.warn('⚠️  Índice já existe ou erro:', error.message);
    }

    // 8. Criar stored procedure UpdateTaskProgressWithPhotos
    try {
      await pool.request().query(`
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('UpdateTaskProgressWithPhotos') AND type in (N'P'))
        BEGIN
          DROP PROCEDURE UpdateTaskProgressWithPhotos;
        END
      `);
      
      await pool.request().query(`
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
          
          SELECT @previousProgress = currentProgress, @previousStatus = status
          FROM EquipmentTasks 
          WHERE id = @taskId;
          
          SET @newStatus = CASE 
            WHEN @newProgress >= 100 THEN 'completed'
            WHEN @newProgress > 0 THEN 'in-progress'
            ELSE 'pending'
          END;
          
          UPDATE EquipmentTasks
          SET currentProgress = @newProgress,
              status = @newStatus,
              actualHours = ISNULL(@actualHours, actualHours),
              lastProgressUpdate = GETDATE(),
              lastUpdatedBy = @userId,
              updatedAt = GETDATE()
          WHERE id = @taskId;
          
          INSERT INTO TaskHistory (taskId, userId, action, previousProgress, newProgress, previousStatus, newStatus, observations, actualHours, photos, ipAddress, userAgent)
          VALUES (@taskId, @userId, 'progress-updated', @previousProgress, @newProgress, @previousStatus, @newStatus, @observations, @actualHours, @photoUrls, @ipAddress, @userAgent);
          
          SET @historyId = SCOPE_IDENTITY();
          
          SELECT 
            @taskId as taskId,
            @newProgress as currentProgress,
            @newStatus as status,
            @historyId as historyId,
            'Progresso atualizado com sucesso' as message;
        END
      `);
      logger.success('✅ Stored procedure UpdateTaskProgressWithPhotos criada');
    } catch (error) {
      logger.warn('⚠️  Erro ao criar stored procedure:', error.message);
    }

    // 9. Criar stored procedure GetTaskHistory
    try {
      await pool.request().query(`
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('GetTaskHistory') AND type in (N'P'))
        BEGIN
          DROP PROCEDURE GetTaskHistory;
        END
      `);
      
      await pool.request().query(`
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
            u.role as updatedByRole
          FROM TaskHistory th
          LEFT JOIN Users u ON th.userId = u.id
          WHERE th.taskId = @taskId
          ORDER BY th.createdAt DESC;
        END
      `);
      logger.success('✅ Stored procedure GetTaskHistory criada');
    } catch (error) {
      logger.warn('⚠️  Erro ao criar stored procedure:', error.message);
    }

    logger.success('🎉 Melhorias no sistema de tarefas aplicadas com sucesso!');
    
  } catch (error) {
    logger.error('❌ Erro ao aplicar melhorias:', error.message);
  } finally {
    process.exit(0);
  }
}

applyTaskImprovementsSimple();
