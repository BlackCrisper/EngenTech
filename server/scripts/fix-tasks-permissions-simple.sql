-- =====================================================
-- Corrigir Permissões de Tarefas - Versão Simples
-- =====================================================

-- Inserir permissões de tarefas padrão (ignorar se já existem)
INSERT INTO Permissions (name, description, resource, action) 
SELECT 'standard-tasks.create', 'Criar tarefas padrão', 'standard-tasks', 'create'
WHERE NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'standard-tasks.create');

INSERT INTO Permissions (name, description, resource, action) 
SELECT 'standard-tasks.read', 'Visualizar tarefas padrão', 'standard-tasks', 'read'
WHERE NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'standard-tasks.read');

INSERT INTO Permissions (name, description, resource, action) 
SELECT 'standard-tasks.update', 'Editar tarefas padrão', 'standard-tasks', 'update'
WHERE NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'standard-tasks.update');

INSERT INTO Permissions (name, description, resource, action) 
SELECT 'standard-tasks.delete', 'Excluir tarefas padrão', 'standard-tasks', 'delete'
WHERE NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'standard-tasks.delete');

-- Remover permissões incorretas de tarefas padrão
DELETE FROM RolePermissions 
WHERE permissionId IN (
    SELECT p.id FROM Permissions p 
    WHERE p.name = 'standard-tasks.delete'
);

-- Adicionar permissão de deletar tarefas padrão apenas para admin
INSERT INTO RolePermissions (role, permissionId)
SELECT 'admin', id FROM Permissions 
WHERE name = 'standard-tasks.delete';

-- Adicionar outras permissões de tarefas padrão para supervisor e engineer
INSERT INTO RolePermissions (role, permissionId)
SELECT 'supervisor', id FROM Permissions 
WHERE name IN ('standard-tasks.create', 'standard-tasks.read', 'standard-tasks.update')
AND NOT EXISTS (
    SELECT 1 FROM RolePermissions rp 
    WHERE rp.role = 'supervisor' AND rp.permissionId = Permissions.id
);

INSERT INTO RolePermissions (role, permissionId)
SELECT 'engineer', id FROM Permissions 
WHERE name IN ('standard-tasks.read', 'standard-tasks.update')
AND NOT EXISTS (
    SELECT 1 FROM RolePermissions rp 
    WHERE rp.role = 'engineer' AND rp.permissionId = Permissions.id
);

INSERT INTO RolePermissions (role, permissionId)
SELECT 'operator', id FROM Permissions 
WHERE name IN ('standard-tasks.read', 'standard-tasks.update')
AND NOT EXISTS (
    SELECT 1 FROM RolePermissions rp 
    WHERE rp.role = 'operator' AND rp.permissionId = Permissions.id
);

INSERT INTO RolePermissions (role, permissionId)
SELECT 'viewer', id FROM Permissions 
WHERE name = 'standard-tasks.read'
AND NOT EXISTS (
    SELECT 1 FROM RolePermissions rp 
    WHERE rp.role = 'viewer' AND rp.permissionId = Permissions.id
);
