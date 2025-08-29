-- =====================================================
-- Adicionar Permissões de Tarefas ao Sistema
-- =====================================================

-- Inserir permissões de tarefas que estão faltando
INSERT INTO Permissions (name, description, resource, action) VALUES
-- Tarefas
('tasks.create', 'Criar tarefas', 'tasks', 'create'),
('tasks.read', 'Visualizar tarefas', 'tasks', 'read'),
('tasks.update', 'Editar tarefas', 'tasks', 'update'),
('tasks.delete', 'Excluir tarefas', 'tasks', 'delete'),
('tasks.export', 'Exportar dados de tarefas', 'tasks', 'export'),

-- Tarefas Padrão
('standard-tasks.create', 'Criar tarefas padrão', 'standard-tasks', 'create'),
('standard-tasks.read', 'Visualizar tarefas padrão', 'standard-tasks', 'read'),
('standard-tasks.update', 'Editar tarefas padrão', 'standard-tasks', 'update'),
('standard-tasks.delete', 'Excluir tarefas padrão', 'standard-tasks', 'delete');

-- Definir permissões por perfil para tarefas

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

PRINT '✅ Permissões de tarefas adicionadas com sucesso!'
GO
