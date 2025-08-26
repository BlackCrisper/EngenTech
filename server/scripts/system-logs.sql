-- Tabela de Logs do Sistema
-- ========================

CREATE TABLE SystemLogs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    level NVARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'debug'
    message NVARCHAR(500) NOT NULL,
    details NVARCHAR(MAX), -- JSON com detalhes adicionais
    userId INT,
    userAction NVARCHAR(100), -- 'login', 'logout', 'create', 'update', 'delete', etc.
    ipAddress NVARCHAR(45), -- IPv4 ou IPv6
    userAgent NVARCHAR(500),
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Índices para melhor performance
CREATE INDEX IX_SystemLogs_Level ON SystemLogs(level);
CREATE INDEX IX_SystemLogs_CreatedAt ON SystemLogs(createdAt);
CREATE INDEX IX_SystemLogs_UserId ON SystemLogs(userId);
CREATE INDEX IX_SystemLogs_UserAction ON SystemLogs(userAction);

-- Inserir alguns logs de exemplo
INSERT INTO SystemLogs (level, message, details, userId, userAction, ipAddress, userAgent, createdAt) VALUES
('info', 'Sistema iniciado', '{"version": "1.0.0", "environment": "production"}', NULL, 'system_start', '127.0.0.1', 'System', GETDATE()),
('info', 'Usuário logado', '{"username": "admin", "role": "admin"}', 1, 'login', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', GETDATE()),
('warning', 'Tentativa de login falhou', '{"username": "usuario_inexistente", "reason": "invalid_credentials"}', NULL, 'login_failed', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', GETDATE()),
('info', 'Área criada', '{"areaName": "Moagem", "areaId": 1}', 1, 'create_area', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', GETDATE()),
('info', 'Equipamento atualizado', '{"equipmentTag": "COMP-001", "equipmentId": 1}', 1, 'update_equipment', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', GETDATE()),
('error', 'Erro ao conectar com banco de dados', '{"error": "Connection timeout", "retryCount": 3}', NULL, 'database_error', '127.0.0.1', 'System', GETDATE());
