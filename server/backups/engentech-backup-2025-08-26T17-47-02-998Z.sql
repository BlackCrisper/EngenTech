-- Backup do Sistema EngenTech - 2025-08-26T17:47:02.998Z

-- Dados da tabela Users
INSERT INTO Users VALUES
(1, 'administrador', 'admin@enginsync.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', true, NULL, NULL, '2025-08-25T11:54:50.890Z', NULL, 'Administração', 'all'),
(11, 'victoria.santana', 'victoria.santana@mizu.com.br', '$2a$10$oF/3s5x/MwqFOPUC8.iKs.xaTj.P3SjtPe4zljwzw.ry8jGpsgn1a', 'admin', true, NULL, NULL, '2025-08-25T12:26:11.840Z', NULL, NULL, 'all'),
(12, 'antonio.neto', 'antonio.neto@mizu.com.br', '$2a$10$91x5IVQL13dZK5g2GEyNEehNm17hY788qGfY6boJ.52hIkyaVeg3S', 'admin', true, NULL, NULL, '2025-08-25T09:32:08.463Z', NULL, NULL, 'all'),
(15, 'ivan.silva', 'ivan.silva@mizu.com.br', '$2a$10$pY6vyuC333x3lHXwP0S6h.hZVeZq/B742bYoQqtaCNwjCPRAKX/d2', 'engineer', true, NULL, NULL, '2025-08-25T15:07:56.143Z', NULL, NULL, 'electrical'),
(16, 'visualizador', 'visualizador@engtech.com', '$2a$10$KjSIR8DP6RNpIyboJrJOaO2vf.qufyBNJ05EHFWmOYFhpU8tifWUu', 'viewer', true, NULL, NULL, '2025-08-26T10:13:37.330Z', NULL, NULL, 'all'),
(17, 'operador.eletrica', 'operador.eletrica@engtech.com', '$2a$10$jZOaFMb4yB/WgYB1Y3UIm.e3LnZKzZD2CD1AuYXHZliOgMvgFs71.', 'operator', true, NULL, NULL, '2025-08-26T10:14:10.077Z', NULL, NULL, 'electrical');

-- Dados da tabela Areas
INSERT INTO Areas VALUES
(6, 'MOAGEM', 'MOAGEM DE CIMENTO', 'MOAGEM', true, '2025-08-26T10:34:49.163Z');

-- Dados da tabela Equipment
INSERT INTO Equipment VALUES
(22, 'Z1M03', 'parent', 6, NULL, 'MINHO DE CIMENTO 3', '2025-08-26T10:35:15.030Z', NULL, true, 0),
(23, 'Z1M03M1', 'child', 6, NULL, 'MOTOR MOINHO DE CIMENTO 3', '2025-08-26T10:35:42.203Z', 'Z1M03', false, 1);

-- Dados da tabela EquipmentTasks
INSERT INTO EquipmentTasks VALUES
(85, 23, 1, 'electrical', 'Instalação de Painel Elétrico', 'Instalação e montagem do painel elétrico principal', 0, 100, 16, 0, 'pending', 'normal', NULL, NULL, NULL, false, '2025-08-26T10:35:50.810Z', '2025-08-26T10:35:50.810Z'),
(86, 23, 2, 'electrical', 'Cabeamento de Potência', 'Instalação de cabos de potência e distribuição', 0, 100, 24, 0, 'pending', 'normal', NULL, NULL, NULL, false, '2025-08-26T10:35:51.103Z', '2025-08-26T10:35:51.103Z'),
(87, 23, 3, 'electrical', 'Instalação de Iluminação', 'Instalação de sistema de iluminação', 0, 100, 12, 0, 'pending', 'normal', NULL, NULL, NULL, false, '2025-08-26T10:35:51.383Z', '2025-08-26T10:35:51.383Z'),
(88, 23, 4, 'electrical', 'Instalação de Tomadas', 'Instalação de tomadas e pontos de energia', 0, 100, 8, 0, 'pending', 'normal', NULL, NULL, NULL, false, '2025-08-26T10:35:51.670Z', '2025-08-26T10:35:51.670Z'),
(89, 23, 5, 'electrical', 'Teste de Continuidade', 'Teste de continuidade e isolamento', 0, 100, 4, 0, 'pending', 'normal', NULL, NULL, NULL, false, '2025-08-26T10:35:51.947Z', '2025-08-26T10:35:51.947Z'),
(90, 23, 6, 'electrical', 'Teste de Funcionamento', 'Teste de funcionamento dos sistemas elétricos', 0, 100, 6, 0, 'pending', 'normal', NULL, NULL, NULL, false, '2025-08-26T10:35:52.227Z', '2025-08-26T10:35:52.227Z');

-- Dados da tabela StandardTasks
INSERT INTO StandardTasks VALUES
(1, 'electrical', 'Instalação de Painel Elétrico', 'Instalação e montagem do painel elétrico principal', 16, true, 1, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(2, 'electrical', 'Cabeamento de Potência', 'Instalação de cabos de potência e distribuição', 24, true, 2, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(3, 'electrical', 'Instalação de Iluminação', 'Instalação de sistema de iluminação', 12, true, 3, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(4, 'electrical', 'Instalação de Tomadas', 'Instalação de tomadas e pontos de energia', 8, true, 4, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(5, 'electrical', 'Teste de Continuidade', 'Teste de continuidade e isolamento', 4, true, 5, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(6, 'electrical', 'Teste de Funcionamento', 'Teste de funcionamento dos sistemas elétricos', 6, true, 6, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(7, 'mechanical', 'Montagem de Estrutura', 'Montagem da estrutura mecânica', 20, true, 1, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(8, 'mechanical', 'Instalação de Motores', 'Instalação e alinhamento de motores', 16, true, 2, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(9, 'mechanical', 'Instalação de Bombas', 'Instalação e teste de bombas', 12, true, 3, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(10, 'mechanical', 'Instalação de Válvulas', 'Instalação e regulagem de válvulas', 8, true, 4, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(11, 'mechanical', 'Lubrificação', 'Lubrificação de componentes mecânicos', 4, true, 5, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(12, 'mechanical', 'Teste de Funcionamento', 'Teste de funcionamento dos sistemas mecânicos', 8, true, 6, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(13, 'civil', 'Preparação de Fundação', 'Preparação e nivelamento da fundação', 32, true, 1, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(14, 'civil', 'Instalação de Estrutura', 'Instalação da estrutura civil', 24, true, 2, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(15, 'civil', 'Alvenaria', 'Execução de alvenaria e vedação', 20, true, 3, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(16, 'civil', 'Acabamento', 'Acabamento e pintura', 16, true, 4, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(17, 'civil', 'Instalação de Piso', 'Instalação de piso e revestimentos', 12, true, 5, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z'),
(18, 'civil', 'Teste de Resistência', 'Teste de resistência estrutural', 8, true, 6, '2025-08-22T14:25:18.440Z', '2025-08-22T14:25:18.440Z');

-- Dados da tabela DashboardMetrics
INSERT INTO DashboardMetrics VALUES
(1, 'Progresso Total', 76.5, '%', 'Progresso geral da obra', '2025-08-22T13:00:59.136Z'),
(2, 'Equipamentos Cadastrados', 142, 'unidades', 'Total de equipamentos no sistema', '2025-08-22T13:00:59.136Z'),
(3, 'Tarefas Concluídas', 324, 'tarefas', 'Tarefas finalizadas', '2025-08-22T13:00:59.136Z'),
(4, 'Áreas Ativas', 8, 'áreas', 'Áreas em progresso', '2025-08-22T13:00:59.136Z'),
(5, 'Alertas', 3, 'alertas', 'Alertas que requerem atenção', '2025-08-22T13:00:59.136Z'),
(6, 'Equipe Ativa', 24, 'técnicos', 'Técnicos trabalhando', '2025-08-22T13:00:59.136Z');

