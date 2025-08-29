# 🔒 Sistema de Permissões por Setor - EngenTech

## 📋 **Visão Geral**

O sistema de permissões por setor foi implementado para controlar o acesso dos usuários baseado em seu setor de atuação, seguindo as regras de negócio específicas.

## 🎯 **Regras de Permissão Implementadas**

### **1. ADMIN**
- ✅ **Pode tudo** - Acesso total a todos os recursos e setores
- ✅ **Sem restrições** - Pode criar, editar, deletar e visualizar qualquer tarefa

### **2. SUPERVISOR "all"**
- ✅ **Pode tudo** (limitado ao projeto)
- ✅ **Acesso total** - Pode criar, editar, deletar e visualizar qualquer tarefa
- ✅ **Sem restrições de setor** - Pode trabalhar em qualquer setor

### **3. SUPERVISOR de Setor Específico**
- ✅ **Pode visualizar todas as tarefas** (de qualquer setor)
- ✅ **Pode editar/deletar/atualizar apenas tarefas do seu próprio setor**
- ❌ **NÃO pode editar/deletar/atualizar tarefas de outros setores**

## 🔧 **Implementação Técnica**

### **Middleware Criados**

#### **1. `checkSectorPermission(resource, action)`**
- Verifica permissões baseadas no setor do usuário
- Aplica regras específicas para cada tipo de usuário
- Controla acesso a recursos por setor

#### **2. `checkTaskSectorPermission(action)`**
- Verifica permissões específicas para tarefas
- Busca o setor do equipamento da tarefa
- Aplica regras de restrição por setor

### **Rotas Atualizadas**

Todas as rotas de tarefas foram atualizadas para usar os novos middlewares:

```javascript
// Antes
checkPermission('tasks', 'update')

// Depois
checkTaskSectorPermission('update')
```

## 📊 **Estrutura de Dados**

### **Tabelas Atualizadas**

#### **Users**
- Adicionada coluna `sector` (NVARCHAR(50))
- Valores possíveis: `'all'`, `'electrical'`, `'mechanical'`, `'instrumentation'`, `'civil'`, `'safety'`

#### **Areas**
- Adicionada coluna `sector` (NVARCHAR(50))
- Mapeamento automático baseado no nome da área

#### **Equipment**
- Adicionada coluna `sector` (NVARCHAR(50))
- Herda setor da área pai

### **Mapeamento de Setores**

| Área | Setor |
|------|-------|
| MOAGEM | mechanical |
| ENSACADEIRA | mechanical |
| ELÉTRICA | electrical |
| INSTRUMENTAÇÃO | instrumentation |
| CIVIL | civil |
| SEGURANÇA | safety |

## 🧪 **Testes Implementados**

### **Scripts de Teste**

1. **`test-sector-permissions.js`**
   - Verifica estrutura de dados
   - Lista usuários e setores
   - Mostra equipamentos e tarefas por setor

2. **`test-sector-permissions-practical.js`**
   - Simula cenários reais de permissão
   - Testa regras específicas por usuário
   - Valida restrições de setor

3. **`fix-supervisor-sectors.js`**
   - Corrige setores dos supervisores
   - Mapeia nomes de usuário para setores
   - Mantém supervisores gerais como "all"

## 🎯 **Cenários de Teste**

### **Cenário 1: Supervisor Elétrica vs Tarefa Elétrica**
- ✅ **READ**: Pode visualizar tarefa do próprio setor
- ✅ **UPDATE**: Pode editar tarefa do próprio setor
- ✅ **DELETE**: Pode deletar tarefa do próprio setor
- ✅ **CREATE**: Pode criar tarefa no próprio setor

### **Cenário 2: Supervisor Elétrica vs Tarefa Outro Setor**
- ✅ **READ**: Pode visualizar tarefa de outro setor
- ❌ **UPDATE**: Não pode editar tarefa de outro setor
- ❌ **DELETE**: Não pode deletar tarefa de outro setor
- ❌ **CREATE**: Não pode criar tarefa em outro setor

### **Cenário 3: Supervisor "all" vs Qualquer Tarefa**
- ✅ **READ**: Pode visualizar qualquer tarefa
- ✅ **UPDATE**: Pode editar qualquer tarefa
- ✅ **DELETE**: Pode deletar qualquer tarefa
- ✅ **CREATE**: Pode criar qualquer tarefa

## 🔍 **Logs e Auditoria**

### **Logs de Permissão**
- Registra tentativas de acesso negado
- Inclui informações do usuário e setor
- Detalha ação e recurso tentado

### **Logs de Auditoria**
- Registra todas as ações realizadas
- Inclui setor do usuário nos detalhes
- Mantém histórico completo de alterações

## 🚀 **Como Usar**

### **Para Desenvolvedores**

1. **Aplicar middleware em rotas:**
```javascript
import { checkTaskSectorPermission } from '../middleware/auth.js';

router.put('/:taskId/progress', 
  checkTaskSectorPermission('update'), 
  auditLog('update', 'tasks'),
  async (req, res) => {
    // Lógica da rota
  });
```

2. **Verificar permissões programaticamente:**
```javascript
import { hasPermission } from '../middleware/auth.js';

const canUpdate = await hasPermission(userId, 'tasks', 'update');
```

### **Para Administradores**

1. **Configurar setores de usuários:**
```sql
UPDATE Users SET sector = 'electrical' WHERE username = 'supervisor.eletrica';
UPDATE Users SET sector = 'all' WHERE username = 'supervisor.geral';
```

2. **Verificar permissões:**
```bash
node server/scripts/test-sector-permissions.js
```

## ✅ **Status da Implementação**

- ✅ **Middleware de permissão por setor** - Implementado
- ✅ **Rotas de tarefas atualizadas** - Implementado
- ✅ **Estrutura de dados** - Configurada
- ✅ **Scripts de teste** - Criados
- ✅ **Logs de auditoria** - Implementados
- ✅ **Documentação** - Completa

## 🎉 **Conclusão**

O sistema de permissões por setor está **totalmente funcional** e implementa todas as regras de negócio solicitadas:

1. **Supervisor "all"** pode fazer quase tudo que o admin pode
2. **Supervisor de setor específico** pode visualizar todas as tarefas
3. **Supervisor de setor específico** pode editar apenas tarefas do próprio setor
4. **Sistema de logs** completo para auditoria
5. **Testes automatizados** para validação

O sistema está pronto para uso em produção! 🚀
