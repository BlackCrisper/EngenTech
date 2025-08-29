-- =====================================================
-- Corrigir Permissões de Tarefas no Sistema
-- =====================================================

-- Verificar e inserir permissões de tarefas que estão faltando
IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'tasks.create')
BEGIN
    INSERT INTO Permissions (name, description, resource, action) VALUES
    ('tasks.create', 'Criar tarefas', 'tasks', 'create');
END

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'tasks.read')
BEGIN
    INSERT INTO Permissions (name, description, resource, action) VALUES
    ('tasks.read', 'Visualizar tarefas', 'tasks', 'read');
END

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'tasks.update')
BEGIN
    INSERT INTO Permissions (name, description, resource, action) VALUES
    ('tasks.update', 'Editar tarefas', 'tasks', 'update');
END

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'tasks.delete')
BEGIN
    INSERT INTO Permissions (name, description, resource, action) VALUES
    ('tasks.delete', 'Excluir tarefas', 'tasks', 'delete');
END

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'tasks.export')
BEGIN
    INSERT INTO Permissions (name, description, resource, action) VALUES
    ('tasks.export', 'Exportar dados de tarefas', 'tasks', 'export');
END

-- Verificar e inserir permissões de tarefas padrão
IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'standard-tasks.create')
BEGIN
    INSERT INTO Permissions (name, description, resource, action) VALUES
    ('standard-tasks.create', 'Criar tarefas padrão', 'standard-tasks', 'create');
END

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'standard-tasks.read')
BEGIN
    INSERT INTO Permissions (name, description, resource, action) VALUES
    ('standard-tasks.read', 'Visualizar tarefas padrão', 'standard-tasks', 'read');
END

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'standard-tasks.update')
BEGIN
    INSERT INTO Permissions (name, description, resource, action) VALUES
    ('standard-tasks.update', 'Editar tarefas padrão', 'standard-tasks', 'update');
END

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'standard-tasks.delete')
BEGIN
    INSERT INTO Permissions (name, description, resource, action) VALUES
    ('standard-tasks.delete', 'Excluir tarefas padrão', 'standard-tasks', 'delete');
END

-- Remover permissões incorretas (se existirem)
DELETE FROM RolePermissions 
WHERE permissionId IN (
    SELECT p.id FROM Permissions p 
    WHERE p.resource IN ('tasks', 'standard-tasks')
);

-- Definir permissões corretas por perfil

-- Admin: Todas as permissões de tarefas
INSERT INTO RolePermissions (role, permissionId)
SELECT 'admin', id FROM Permissions 
WHERE resource IN ('tasks', 'standard-tasks');

-- Supervisor: Pode gerenciar tarefas, mas NÃO pode deletar tarefas padrão
INSERT INTO RolePermissions (role, permissionId)
SELECT 'supervisor', id FROM Permissions 
WHERE resource IN ('tasks', 'standard-tasks')
  AND name NOT IN ('standard-tasks.delete');

-- Engenheiro: Pode criar/editar tarefas, mas NÃO pode deletar tarefas padrão
INSERT INTO RolePermissions (role, permissionId)
SELECT 'engineer', id FROM Permissions 
WHERE resource IN ('tasks', 'standard-tasks')
  AND name NOT IN ('standard-tasks.delete', 'standard-tasks.create');

-- Operador: Pode visualizar e atualizar tarefas, mas NÃO pode deletar
INSERT INTO RolePermissions (role, permissionId)
SELECT 'operator', id FROM Permissions 
WHERE resource IN ('tasks', 'standard-tasks')
  AND action IN ('read', 'update')
  AND name NOT IN ('standard-tasks.delete');

-- Visualizador: Apenas leitura de tarefas
INSERT INTO RolePermissions (role, permissionId)
SELECT 'viewer', id FROM Permissions 
WHERE resource IN ('tasks', 'standard-tasks')
  AND action = 'read';

PRINT '✅ Permissões de tarefas corrigidas com sucesso!'
GO
