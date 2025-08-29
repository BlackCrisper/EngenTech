# Sistema de Logs - EngenTech

## 📋 Visão Geral

O sistema de logs foi otimizado para reduzir a verbosidade no console e permitir controle granular sobre os tipos de logs exibidos.

## 🎛️ Configuração

### Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```env
# Logging Configuration
LOG_LEVEL=INFO
NODE_ENV=development
```

### Níveis de Log Disponíveis

| Nível | Descrição | Logs Exibidos |
|-------|-----------|---------------|
| `ERROR` | Apenas erros | ❌ Erros críticos |
| `WARN` | Erros e avisos | ❌ Erros + ⚠️ Avisos |
| `INFO` | Padrão | ❌ Erros + ⚠️ Avisos + ℹ️ Info + ✅ Sucesso + 🔐 Auth + 🚫 Permissões |
| `DEBUG` | Desenvolvimento | Todos os logs incluindo 🔍 Debug |

## 🔧 Como Usar

### Importar o Logger

```javascript
import { logger } from '../config/logger.js';
```

### Tipos de Log Disponíveis

```javascript
// Erros (sempre exibidos)
logger.error('Mensagem de erro');

// Avisos
logger.warn('Aviso importante');

// Informações gerais
logger.info('Informação do sistema');

// Debug (apenas em DEBUG mode)
logger.debug('Informação de debug');

// Sucessos
logger.success('Operação realizada com sucesso');

// Autenticação
logger.auth('Usuário logado: admin');

// Permissões
logger.permission('Acesso negado para tarefas');
```

## 🚀 Otimizações Implementadas

### Antes (Verboso)
```
🔐 Autenticando rota: GET /equipment/42
✅ Token fornecido, verificando...
✅ Token válido, userId: 21
✅ Usuário autenticado: supervisor Role: supervisor
🔐 Autenticando rota: GET /equipment/42
✅ Token fornecido, verificando...
✅ Token válido, userId: 21
✅ Usuário autenticado: supervisor Role: supervisor
```

### Depois (Limpo)
```
🔐 GET /equipment/42 - supervisor (supervisor)
```

## 📊 Logs por Tipo de Ação

### Logs Sempre Exibidos (INFO+)
- ❌ **Erros**: Problemas críticos do sistema
- ⚠️ **Avisos**: Situações que merecem atenção
- 🔐 **Autenticação**: Logins e ações importantes
- 🚫 **Permissões**: Tentativas de acesso negado

### Logs Reduzidos
- ℹ️ **Informações**: Logs gerais do sistema
- ✅ **Sucessos**: Operações bem-sucedidas
- 🔍 **Debug**: Informações detalhadas (apenas DEBUG)

## 🎯 Configurações Recomendadas

### Desenvolvimento
```env
LOG_LEVEL=DEBUG
NODE_ENV=development
```

### Produção
```env
LOG_LEVEL=ERROR
NODE_ENV=production
```

### Teste
```env
LOG_LEVEL=WARN
NODE_ENV=development
```

## 🧪 Testar o Sistema

```bash
# Testar todos os tipos de log
npm run test-logs

# Verificar configuração atual
echo $LOG_LEVEL
```

## 📝 Exemplos de Uso

### Log de Erro
```javascript
try {
  // código que pode falhar
} catch (error) {
  logger.error('Falha na operação:', error.message);
}
```

### Log de Autenticação
```javascript
logger.auth(`${req.method} ${req.path} - ${user.username} (${user.role})`);
```

### Log de Permissão
```javascript
logger.permission(`${user.username} (${user.role}) tentou ${action} ${resource}`);
```

## 🔄 Migração

O sistema foi migrado automaticamente. Os logs antigos foram substituídos pelos novos métodos:

- `console.log()` → `logger.info()` ou `logger.success()`
- `console.error()` → `logger.error()`
- `console.warn()` → `logger.warn()`

## 📈 Benefícios

1. **Console mais limpo** - Menos poluição visual
2. **Controle granular** - Escolha o nível de detalhe
3. **Logs estruturados** - Emojis para identificação rápida
4. **Configuração flexível** - Adapte para diferentes ambientes
5. **Manutenção fácil** - Sistema centralizado
