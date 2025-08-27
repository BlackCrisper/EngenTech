import { getConnection } from './config/database.js';

async function createAllTables() {
  try {
    console.log('🔧 Criando todas as tabelas do sistema...');
    
    const pool = await getConnection();
    
    // 1. Tabelas básicas (já existem)
    console.log('✅ Tabelas básicas já existem: Users, Areas, Equipment, Progress, ProgressHistory, Documents, DashboardMetrics');
    
    // 2. Sistema de Permissões
    console.log('\n📝 Criando sistema de permissões...');
    
    await pool.request().query(`
      CREATE TABLE Permissions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500),
        resource NVARCHAR(100) NOT NULL,
        action NVARCHAR(100) NOT NULL,
        createdAt DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('   ✅ Tabela Permissions criada');
    
    await pool.request().query(`
      CREATE TABLE RolePermissions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        role NVARCHAR(50) NOT NULL,
        permissionId INT NOT NULL,
        granted BIT DEFAULT 1,
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (permissionId) REFERENCES Permissions(id),
        UNIQUE(role, permissionId)
      )
    `);
    console.log('   ✅ Tabela RolePermissions criada');
    
    await pool.request().query(`
      CREATE TABLE AuditLog (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        action NVARCHAR(100) NOT NULL,
        resource NVARCHAR(100) NOT NULL,
        resourceId INT,
        details NVARCHAR(MAX),
        ipAddress NVARCHAR(45),
        userAgent NVARCHAR(500),
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES Users(id)
      )
    `);
    console.log('   ✅ Tabela AuditLog criada');
    
    // 3. Sistema SESMT
    console.log('\n📝 Criando sistema SESMT...');
    
    await pool.request().query(`
      CREATE TABLE SESMTOccurrenceTypes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        severity NVARCHAR(20) NOT NULL,
        isActive BIT DEFAULT 1,
        createdAt DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('   ✅ Tabela SESMTOccurrenceTypes criada');
    
    await pool.request().query(`
      CREATE TABLE SESMTOccurrences (
        id INT IDENTITY(1,1) PRIMARY KEY,
        areaId INT NOT NULL,
        occurrenceTypeId INT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX),
        severity NVARCHAR(20) NOT NULL,
        status NVARCHAR(20) DEFAULT 'open',
        reportedBy INT NOT NULL,
        involvedPersons NVARCHAR(500),
        dateTimeOccurrence DATETIME NOT NULL,
        dateTimeReport DATETIME DEFAULT GETDATE(),
        location NVARCHAR(200),
        weatherConditions NVARCHAR(100),
        equipmentInvolved NVARCHAR(500),
        immediateActions NVARCHAR(MAX),
        recommendations NVARCHAR(MAX),
        photos NVARCHAR(MAX),
        documents NVARCHAR(MAX),
        isConfidential BIT DEFAULT 0,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (areaId) REFERENCES Areas(id),
        FOREIGN KEY (occurrenceTypeId) REFERENCES SESMTOccurrenceTypes(id),
        FOREIGN KEY (reportedBy) REFERENCES Users(id)
      )
    `);
    console.log('   ✅ Tabela SESMTOccurrences criada');
    
    await pool.request().query(`
      CREATE TABLE SESMTOccurrenceHistory (
        id INT IDENTITY(1,1) PRIMARY KEY,
        occurrenceId INT NOT NULL,
        previousStatus NVARCHAR(20),
        newStatus NVARCHAR(20) NOT NULL,
        comments NVARCHAR(MAX),
        updatedBy INT NOT NULL,
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (occurrenceId) REFERENCES SESMTOccurrences(id),
        FOREIGN KEY (updatedBy) REFERENCES Users(id)
      )
    `);
    console.log('   ✅ Tabela SESMTOccurrenceHistory criada');
    
    await pool.request().query(`
      CREATE TABLE SESMTOccurrenceComments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        occurrenceId INT NOT NULL,
        comment NVARCHAR(MAX) NOT NULL,
        commentedBy INT NOT NULL,
        commentedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (occurrenceId) REFERENCES SESMTOccurrences(id),
        FOREIGN KEY (commentedBy) REFERENCES Users(id)
      )
    `);
    console.log('   ✅ Tabela SESMTOccurrenceComments criada');
    
    await pool.request().query(`
      CREATE TABLE SESMTInvestigations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        occurrenceId INT NOT NULL,
        investigatorId INT NOT NULL,
        investigationDate DATETIME NOT NULL,
        findings NVARCHAR(MAX),
        rootCauses NVARCHAR(MAX),
        recommendations NVARCHAR(MAX),
        status NVARCHAR(20) DEFAULT 'pending',
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (occurrenceId) REFERENCES SESMTOccurrences(id),
        FOREIGN KEY (investigatorId) REFERENCES Users(id)
      )
    `);
    console.log('   ✅ Tabela SESMTInvestigations criada');
    
    await pool.request().query(`
      CREATE TABLE SESMTActions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        occurrenceId INT NOT NULL,
        actionType NVARCHAR(50) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        responsible NVARCHAR(100),
        dueDate DATE,
        completedDate DATE,
        status NVARCHAR(20) DEFAULT 'pending',
        createdBy INT NOT NULL,
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (occurrenceId) REFERENCES SESMTOccurrences(id),
        FOREIGN KEY (createdBy) REFERENCES Users(id)
      )
    `);
    console.log('   ✅ Tabela SESMTActions criada');
    
    // 4. Sistema de Tarefas
    console.log('\n📝 Criando sistema de tarefas...');
    
    await pool.request().query(`
      CREATE TABLE StandardTasks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        discipline NVARCHAR(50) NOT NULL,
        name NVARCHAR(200) NOT NULL,
        description NVARCHAR(500),
        estimatedHours DECIMAL(5,2) DEFAULT 0,
        isActive BIT DEFAULT 1,
        sortOrder INT DEFAULT 0,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('   ✅ Tabela StandardTasks criada');
    
    await pool.request().query(`
      CREATE TABLE EquipmentTasks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        equipmentId INT NOT NULL,
        standardTaskId INT NULL,
        discipline NVARCHAR(50) NOT NULL,
        name NVARCHAR(200) NOT NULL,
        description NVARCHAR(500),
        currentProgress DECIMAL(5,2) DEFAULT 0,
        targetProgress DECIMAL(5,2) DEFAULT 100,
        estimatedHours DECIMAL(5,2) DEFAULT 0,
        actualHours DECIMAL(5,2) DEFAULT 0,
        status NVARCHAR(50) DEFAULT 'pending',
        priority NVARCHAR(20) DEFAULT 'normal',
        startDate DATE,
        dueDate DATE,
        completedDate DATE,
        isCustom BIT DEFAULT 0,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (equipmentId) REFERENCES Equipment(id),
        FOREIGN KEY (standardTaskId) REFERENCES StandardTasks(id)
      )
    `);
    console.log('   ✅ Tabela EquipmentTasks criada');
    
    await pool.request().query(`
      CREATE TABLE TaskHistory (
        id INT IDENTITY(1,1) PRIMARY KEY,
        taskId INT NOT NULL,
        previousProgress DECIMAL(5,2),
        newProgress DECIMAL(5,2) NOT NULL,
        previousStatus NVARCHAR(50),
        newStatus NVARCHAR(50) NOT NULL,
        comments NVARCHAR(MAX),
        updatedBy INT NOT NULL,
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (taskId) REFERENCES EquipmentTasks(id),
        FOREIGN KEY (updatedBy) REFERENCES Users(id)
      )
    `);
    console.log('   ✅ Tabela TaskHistory criada');
    
    // 5. Sistema de Logs
    console.log('\n📝 Criando sistema de logs...');
    
    await pool.request().query(`
      CREATE TABLE SystemLogs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        level NVARCHAR(20) NOT NULL,
        message NVARCHAR(500) NOT NULL,
        details NVARCHAR(MAX),
        userId INT,
        userAction NVARCHAR(100),
        ipAddress NVARCHAR(45),
        userAgent NVARCHAR(500),
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES Users(id)
      )
    `);
    console.log('   ✅ Tabela SystemLogs criada');
    
    // 6. Inserir dados iniciais
    console.log('\n📝 Inserindo dados iniciais...');
    
    // Tipos de ocorrências SESMT
    await pool.request().query(`
      INSERT INTO SESMTOccurrenceTypes (name, description, severity) VALUES
      ('Acidente de Trabalho', 'Acidente que causa lesão corporal ou perturbação funcional', 'critical'),
      ('Incidente', 'Ocorrência que poderia ter resultado em acidente', 'high'),
      ('Quase Acidente', 'Situação que quase resultou em acidente', 'medium'),
      ('Condição Insegura', 'Condição que pode causar acidente', 'medium'),
      ('Ato Inseguro', 'Comportamento que pode causar acidente', 'medium'),
      ('Observação de Segurança', 'Observação positiva ou negativa relacionada à segurança', 'low'),
      ('Inspeção de Segurança', 'Relatório de inspeção de segurança', 'low'),
      ('Treinamento de Segurança', 'Registro de treinamento realizado', 'low')
    `);
    console.log('   ✅ Tipos de ocorrências SESMT inseridos');
    
    // Permissões básicas
    await pool.request().query(`
      INSERT INTO Permissions (name, description, resource, action) VALUES
      ('users.create', 'Criar usuários', 'users', 'create'),
      ('users.read', 'Visualizar usuários', 'users', 'read'),
      ('users.update', 'Editar usuários', 'users', 'update'),
      ('users.delete', 'Excluir usuários', 'users', 'delete'),
      ('users.export', 'Exportar dados de usuários', 'users', 'export'),
      ('areas.create', 'Criar áreas', 'areas', 'create'),
      ('areas.read', 'Visualizar áreas', 'areas', 'read'),
      ('areas.update', 'Editar áreas', 'areas', 'update'),
      ('areas.delete', 'Excluir áreas', 'areas', 'delete'),
      ('areas.export', 'Exportar dados de áreas', 'areas', 'export'),
      ('equipment.create', 'Criar equipamentos', 'equipment', 'create'),
      ('equipment.read', 'Visualizar equipamentos', 'equipment', 'read'),
      ('equipment.update', 'Editar equipamentos', 'equipment', 'update'),
      ('equipment.delete', 'Excluir equipamentos', 'equipment', 'delete'),
      ('equipment.export', 'Exportar dados de equipamentos', 'equipment', 'export'),
      ('progress.read', 'Visualizar progresso', 'progress', 'read'),
      ('progress.update', 'Atualizar progresso', 'progress', 'update'),
      ('progress.export', 'Exportar dados de progresso', 'progress', 'export'),
      ('reports.read', 'Visualizar relatórios', 'reports', 'read'),
      ('reports.create', 'Gerar relatórios', 'reports', 'create'),
      ('reports.export', 'Exportar relatórios', 'reports', 'export'),
      ('dashboard.read', 'Visualizar dashboard', 'dashboard', 'read'),
      ('settings.read', 'Visualizar configurações', 'settings', 'read'),
      ('settings.update', 'Editar configurações', 'settings', 'update')
    `);
    console.log('   ✅ Permissões básicas inseridas');
    
    // Permissões para admin
    await pool.request().query(`
      INSERT INTO RolePermissions (role, permissionId)
      SELECT 'admin', id FROM Permissions
    `);
    console.log('   ✅ Permissões de admin configuradas');
    
    // Logs iniciais
    await pool.request().query(`
      INSERT INTO SystemLogs (level, message, details, userAction, ipAddress, userAgent) VALUES
      ('info', 'Sistema iniciado', '{"version": "1.0.0", "environment": "production"}', 'system_start', '127.0.0.1', 'System'),
      ('info', 'Banco de dados inicializado', '{"tables": "all", "status": "ready"}', 'database_init', '127.0.0.1', 'System')
    `);
    console.log('   ✅ Logs iniciais inseridos');
    
    console.log('\n🎉 Todas as tabelas foram criadas com sucesso!');
    
    // Verificar todas as tabelas criadas
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📊 Todas as tabelas no sistema:');
    tablesResult.recordset.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
    console.log(`\n✅ Total de tabelas: ${tablesResult.recordset.length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

createAllTables()
  .then(() => {
    console.log('\n✅ Processo concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no processo:', error);
    process.exit(1);
  });
