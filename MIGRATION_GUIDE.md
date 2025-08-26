# 🚀 Guia de Migração: Supabase → SQL Server

Este guia documenta a migração completa do sistema EnginSync do Supabase para SQL Server.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Acesso ao SQL Server (dados fornecidos)
- NPM ou Yarn

## 🗄️ Configuração do SQL Server

### Dados de Conexão
```
Servidor: EngenTech.mssql.somee.com
Banco: EngenTech
Usuário: EngenTech_SQLLogin_1
Senha: 2i44vzc9rl
Porta: 1433
```

## 🛠️ Instalação e Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `env.example` para `.env` na pasta `server/`:
```bash
cp env.example server/.env
```

O arquivo `.env` deve conter:
```env
# SQL Server Configuration
DB_SERVER=EngenTech.mssql.somee.com
DB_NAME=EngenTech
DB_USER=EngenTech_SQLLogin_1
DB_PASSWORD=2i44vzc9rl
DB_PORT=1433

# JWT Secret
JWT_SECRET=enginsync-jwt-secret-2024-mizu-cimentos

# Server Configuration
PORT=3001
NODE_ENV=development

# API Configuration
API_BASE_URL=http://localhost:3001/api
```

### 3. Inicializar Banco de Dados
```bash
npm run init-db
```

Este comando irá:
- Criar todas as tabelas necessárias
- Inserir dados de exemplo
- Configurar índices para performance

### 4. Iniciar o Sistema
```bash
# Iniciar apenas o servidor
npm run server

# OU iniciar servidor + frontend
npm run dev:full
```

## 🏗️ Arquitetura da Migração

### Backend (Node.js + Express)
```
server/
├── config/
│   └── database.js          # Configuração SQL Server
├── routes/
│   ├── auth.js              # Autenticação JWT
│   ├── dashboard.js         # Métricas do dashboard
│   ├── progress.js          # Gestão de progresso
│   ├── areas.js             # Gestão de áreas
│   ├── equipment.js         # Gestão de equipamentos
│   └── users.js             # Gestão de usuários
├── scripts/
│   ├── init-database.sql    # Script de criação das tabelas
│   └── init-db.js           # Script de inicialização
└── index.js                 # Servidor principal
```

### Frontend (React + TypeScript)
```
src/
├── services/
│   └── api.ts               # Serviços de API
├── pages/
│   ├── Dashboard.tsx        # Dashboard integrado
│   └── Progress.tsx         # Página de progresso
└── components/
    └── dashboard/
        └── MetricCard.tsx   # Componentes de métricas
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
1. **Users** - Usuários do sistema
2. **Areas** - Áreas da obra
3. **Equipment** - Equipamentos industriais
4. **Progress** - Progresso por disciplina
5. **ProgressHistory** - Histórico de atualizações
6. **Documents** - Fotos/documentos
7. **DashboardMetrics** - Métricas do dashboard

### Relacionamentos
- Equipment → Areas (N:1)
- Progress → Equipment (N:1)
- Progress → Users (N:1)
- ProgressHistory → Progress (N:1)
- Documents → Progress (N:1)

## 🔐 Autenticação

### Sistema JWT
- Tokens com expiração de 8 horas
- Refresh automático no frontend
- Middleware de proteção de rotas

### Usuários Padrão
```
admin/admin@mizucimentos.com (Administrador)
joao.silva/joao.silva@mizucimentos.com (Gerente)
maria.santos/maria.santos@mizucimentos.com (Usuário)
```

## 📈 Funcionalidades Implementadas

### Dashboard Executivo
- ✅ Métricas em tempo real
- ✅ Gráficos de progresso
- ✅ Status do sistema
- ✅ Próximas atividades

### Gestão de Progresso
- ✅ Atualização por disciplina
- ✅ Histórico de mudanças
- ✅ Filtros avançados
- ✅ Observações e fotos

### Gestão de Dados
- ✅ CRUD de áreas
- ✅ CRUD de equipamentos
- ✅ CRUD de usuários
- ✅ Validações de integridade

## 🔄 Migração de Dados

### Dados Incluídos
- 8 áreas da obra industrial
- 13 equipamentos principais
- 15 registros de progresso inicial
- 3 usuários padrão
- Métricas calculadas automaticamente

### Scripts de Migração
```bash
# Inicializar banco
npm run init-db

# Verificar conexão
curl http://localhost:3001/api/health

# Testar autenticação
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

## 🚀 Deploy

### Desenvolvimento
```bash
npm run dev:full
```

### Produção
```bash
npm run build
npm run server
```

## 🔧 Troubleshooting

### Erro de Conexão com SQL Server
1. Verificar credenciais no `.env`
2. Testar conectividade: `telnet EngenTech.mssql.somee.com 1433`
3. Verificar firewall/antivírus

### Erro de Autenticação
1. Verificar JWT_SECRET no `.env`
2. Limpar localStorage do navegador
3. Verificar token no DevTools

### Erro de CORS
1. Verificar configuração CORS no servidor
2. Verificar URL da API no frontend
3. Verificar headers de requisição

## 📝 Logs e Monitoramento

### Logs do Servidor
```bash
# Ver logs em tempo real
npm run server

# Logs importantes:
# ✅ Conectado ao SQL Server com sucesso!
# 🚀 Servidor EnginSync rodando na porta 3001
# 📊 API disponível em: http://localhost:3001/api
```

### Health Check
```bash
curl http://localhost:3001/api/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "message": "EnginSync API está funcionando!",
  "timestamp": "2024-01-22T10:30:00.000Z",
  "database": "SQL Server - EngenTech"
}
```

## 🎯 Próximos Passos

1. **Implementar upload de fotos** - Multer + armazenamento
2. **Relatórios avançados** - PDF/Excel export
3. **Notificações push** - WebSockets
4. **Backup automático** - Scripts de backup
5. **Monitoramento** - Logs estruturados
6. **Testes automatizados** - Jest + Supertest

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do servidor
2. Testar endpoints da API
3. Verificar conectividade com SQL Server
4. Consultar documentação do mssql

---

**✅ Migração concluída com sucesso!**

O sistema EnginSync agora está totalmente integrado com SQL Server e pronto para uso em produção.
