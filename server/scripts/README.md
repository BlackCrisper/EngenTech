# Scripts de Limpeza do Banco de Dados

Este diretório contém scripts para limpar dados desnecessários que foram criados pelo `npm run setup`.

## 📋 Scripts Disponíveis

### 1. `npm run cleanup-sample`
**Arquivo:** `remove-sample-data.js`

Remove apenas os **dados de exemplo** criados pelo setup inicial, mantendo:
- ✅ Estrutura do banco intacta
- ✅ Sistema SESMT completo
- ✅ Sistema de permissões
- ✅ Usuário admin

**Remove:**
- Usuários de exemplo (joao.silva, maria.santos)
- Áreas de exemplo (Produção A, Produção B, etc.)
- Equipamentos de exemplo (MOINHO-01, ESTEIRA-01, etc.)
- Progresso de exemplo
- Tarefas de exemplo
- Métricas do dashboard de exemplo

### 2. `npm run cleanup-unused`
**Arquivo:** `cleanup-unused.js`

Script de **verificação** que mostra quais tabelas e dados podem ser removidos, mas **não remove automaticamente**. Útil para verificar o que existe antes de decidir o que remover.

### 3. `npm run remove-permissions`
**Arquivo:** `remove-permissions.js`

Remove completamente o sistema de permissões (tabelas `Permissions`, `RolePermissions`, `AuditLog`).

⚠️ **ATENÇÃO:** Sem o sistema de permissões, todos os usuários terão acesso total ao sistema.

### 4. `npm run remove-sesmt`
**Arquivo:** `remove-sesmt.js`

Remove completamente o sistema SESMT (segurança do trabalho).

⚠️ **ATENÇÃO:** Este script não é recomendado se você precisa do sistema SESMT.

## 🚀 Como Usar

### Limpeza Básica (Recomendada)
```bash
npm run cleanup-sample
```

### Verificar o que pode ser removido
```bash
npm run cleanup-unused
```

### Remover sistema de permissões (se não necessário)
```bash
npm run remove-permissions
```

## 📊 O que o `npm run setup` criou

O comando `npm run setup` executou:

1. **init-db.js** → Criou tabelas básicas + dados de exemplo
2. **apply-updates.js** → Criou sistema de permissões + hierarquia de equipamentos

### Tabelas Criadas:
- **Básicas:** Users, Areas, Equipment, Progress, ProgressHistory, Documents, DashboardMetrics
- **Permissões:** Permissions, RolePermissions, AuditLog
- **Tarefas:** StandardTasks, EquipmentTasks, TaskHistory
- **SESMT:** SESMTOccurrenceTypes, SESMTOccurrences, SESMTOccurrenceHistory, SESMTOccurrenceComments
- **Hierarquia:** Colunas parentId, equipmentType, hierarchyLevel na tabela Equipment

### Dados de Exemplo Inseridos:
- 3 usuários (admin, joao.silva, maria.santos)
- 8 áreas industriais
- 13 equipamentos
- Progresso inicial para 15 disciplinas
- Métricas do dashboard
- 18 tarefas padrão por disciplina
- 8 tipos de ocorrências SESMT

## 🔧 Personalização

Para personalizar os scripts:

1. **Editar condições de remoção:** Modifique as condições `WHERE` nos scripts
2. **Adicionar novas tabelas:** Inclua novas tabelas na lista de remoções
3. **Remover automaticamente:** Descomente as linhas de remoção nos scripts

## ⚠️ Avisos Importantes

1. **Faça backup** antes de executar qualquer script de limpeza
2. **Teste em ambiente de desenvolvimento** primeiro
3. **O sistema SESMT é mantido** por padrão (se necessário)
4. **O usuário admin é preservado** em todos os scripts
5. **Foreign keys são respeitadas** na ordem de remoção

## 🆘 Em caso de problemas

Se algo der errado:

1. Verifique os logs de erro no console
2. Restaure o backup do banco
3. Execute os scripts individualmente para identificar o problema
4. Verifique se as foreign keys estão sendo respeitadas
