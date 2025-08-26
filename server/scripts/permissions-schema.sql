-- Sistema de Permissões e Auditoria
-- =================================

-- Tabela de Permissões
CREATE TABLE Permissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500),
    resource NVARCHAR(100) NOT NULL, -- 'users', 'areas', 'equipment', 'progress', 'reports'
    action NVARCHAR(100) NOT NULL,   -- 'create', 'read', 'update', 'delete', 'export'
    createdAt DATETIME DEFAULT GETDATE()
);

-- Tabela de Perfis de Permissão
CREATE TABLE RolePermissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    role NVARCHAR(50) NOT NULL, -- 'admin', 'supervisor', 'engineer', 'operator', 'viewer'
    permissionId INT NOT NULL,
    granted BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (permissionId) REFERENCES Permissions(id),
    UNIQUE(role, permissionId)
);

-- Tabela de Log de Auditoria
CREATE TABLE AuditLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    action NVARCHAR(100) NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'export'
    resource NVARCHAR(100) NOT NULL, -- 'users', 'areas', 'equipment', 'progress', 'reports'
    resourceId INT, -- ID do recurso afetado (opcional)
    details NVARCHAR(MAX), -- JSON com detalhes da ação
    ipAddress NVARCHAR(45),
    userAgent NVARCHAR(500),
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Inserir permissões básicas
INSERT INTO Permissions (name, description, resource, action) VALUES
-- Usuários
('users.create', 'Criar usuários', 'users', 'create'),
('users.read', 'Visualizar usuários', 'users', 'read'),
('users.update', 'Editar usuários', 'users', 'update'),
('users.delete', 'Excluir usuários', 'users', 'delete'),
('users.export', 'Exportar dados de usuários', 'users', 'export'),

-- Áreas
('areas.create', 'Criar áreas', 'areas', 'create'),
('areas.read', 'Visualizar áreas', 'areas', 'read'),
('areas.update', 'Editar áreas', 'areas', 'update'),
('areas.delete', 'Excluir áreas', 'areas', 'delete'),
('areas.export', 'Exportar dados de áreas', 'areas', 'export'),

-- Equipamentos
('equipment.create', 'Criar equipamentos', 'equipment', 'create'),
('equipment.read', 'Visualizar equipamentos', 'equipment', 'read'),
('equipment.update', 'Editar equipamentos', 'equipment', 'update'),
('equipment.delete', 'Excluir equipamentos', 'equipment', 'delete'),
('equipment.export', 'Exportar dados de equipamentos', 'equipment', 'export'),

-- Progresso
('progress.read', 'Visualizar progresso', 'progress', 'read'),
('progress.update', 'Atualizar progresso', 'progress', 'update'),
('progress.export', 'Exportar dados de progresso', 'progress', 'export'),

-- Relatórios
('reports.read', 'Visualizar relatórios', 'reports', 'read'),
('reports.create', 'Gerar relatórios', 'reports', 'create'),
('reports.export', 'Exportar relatórios', 'reports', 'export'),

-- Dashboard
('dashboard.read', 'Visualizar dashboard', 'dashboard', 'read'),

-- Configurações
('settings.read', 'Visualizar configurações', 'settings', 'read'),
('settings.update', 'Editar configurações', 'settings', 'update');

-- Definir permissões por perfil
-- Admin: Todas as permissões
INSERT INTO RolePermissions (role, permissionId)
SELECT 'admin', id FROM Permissions;

-- Supervisor: Todas exceto excluir usuários e configurações
INSERT INTO RolePermissions (role, permissionId)
SELECT 'supervisor', id FROM Permissions 
WHERE name NOT IN ('users.delete', 'settings.update');

-- Engenheiro: Leitura geral + atualizar progresso + criar/editar equipamentos
INSERT INTO RolePermissions (role, permissionId)
SELECT 'engineer', id FROM Permissions 
WHERE name IN (
    'users.read', 'areas.read', 'equipment.read', 'equipment.create', 'equipment.update',
    'progress.read', 'progress.update', 'progress.export',
    'reports.read', 'reports.create', 'reports.export',
    'dashboard.read', 'settings.read'
);

-- Operador: Leitura + atualizar progresso
INSERT INTO RolePermissions (role, permissionId)
SELECT 'operator', id FROM Permissions 
WHERE name IN (
    'users.read', 'areas.read', 'equipment.read',
    'progress.read', 'progress.update',
    'reports.read', 'dashboard.read', 'settings.read'
);

-- Visualizador: Apenas leitura
INSERT INTO RolePermissions (role, permissionId)
SELECT 'viewer', id FROM Permissions 
WHERE action = 'read';

GO
