-- Script para adicionar campo sector na tabela Users
-- Execute este script para adicionar o campo sector

-- Adicionar coluna sector na tabela Users
ALTER TABLE Users ADD sector NVARCHAR(100) DEFAULT 'Geral';

-- Atualizar usuários existentes com setores padrão
UPDATE Users SET sector = 'Administração' WHERE role = 'admin';
UPDATE Users SET sector = 'Engenharia' WHERE role = 'engineer';
UPDATE Users SET sector = 'Supervisão' WHERE role = 'supervisor';
UPDATE Users SET sector = 'Operação' WHERE role = 'operator';
UPDATE Users SET sector = 'Visualização' WHERE role = 'viewer';

-- Verificar se a coluna foi adicionada
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'sector';
