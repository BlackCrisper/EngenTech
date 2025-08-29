# EngenTech - Sistema de Gerenciamento de Engenharia

Sistema completo para gerenciamento de projetos de engenharia, equipamentos, tarefas e progresso.

## 🚀 Deploy para Produção

### Pré-requisitos

- Node.js 18+ 
- SQL Server
- PM2 (será instalado automaticamente)

### Instalação e Deploy

#### Linux/Mac
```bash
# Dar permissão de execução ao script
chmod +x deploy.sh

# Deploy para produção
./deploy.sh production

# Deploy para desenvolvimento
./deploy.sh development
```

#### Windows
```cmd
# Deploy para produção
deploy.bat production

# Deploy para desenvolvimento
deploy.bat development
```

#### Manual
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Testar configuração
npm run test-pm2

# Instalar dependências
npm run install:prod

# Build do frontend
npm run build:frontend

# Iniciar aplicação
npm run start

# Ou para desenvolvimento
npm run start:dev
```

### Comandos PM2

```bash
# Status dos processos
npm run status

# Ver logs
npm run logs

# Monitoramento
npm run monit

# Reiniciar aplicação
npm run restart

# Recarregar aplicação (zero downtime)
npm run reload

# Parar aplicação
npm run stop

# Deletar aplicação
npm run delete
```

### Estrutura de Produção

```
EngenTech/
├── dist/                    # Build do frontend
├── server/                  # Backend Node.js
├── uploads/                 # Arquivos enviados
├── logs/                    # Logs do PM2
├── ecosystem.config.cjs     # Configuração PM2 (CommonJS)
├── deploy.sh               # Script de deploy (Linux/Mac)
├── deploy.bat              # Script de deploy (Windows)
└── package.json
```

### Portas

- **Frontend**: 8080
- **Backend**: 3010

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DB_SERVER=localhost
DB_DATABASE=EngenTech
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=seu_jwt_secret_muito_seguro

# Server
PORT=3010
NODE_ENV=production

# Logs
LOG_LEVEL=INFO
```

## 🛠️ Desenvolvimento

### Instalação

```bash
# Clonar repositório
git clone <url-do-repositorio>
cd EngenTech

# Instalar dependências
npm install

# Configurar banco de dados
npm run setup

# Iniciar desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                    # Frontend + Backend
npm run dev:frontend          # Apenas frontend
npm run dev:backend           # Apenas backend

# Build
npm run build                 # Build completo
npm run build:frontend        # Build do frontend

# Produção
npm run start                 # Iniciar produção
npm run start:dev            # Iniciar desenvolvimento
npm run deploy               # Deploy rápido

# PM2
npm run status               # Status dos processos
npm run logs                 # Ver logs
npm run monit                # Monitoramento
npm run restart              # Reiniciar
npm run reload               # Recarregar
npm run stop                 # Parar
npm run delete               # Deletar
npm run test-pm2             # Testar configuração PM2

# Banco de dados
npm run setup                # Configurar banco
npm run cleanup-sample       # Limpar dados de exemplo
npm run cleanup-all          # Limpar tudo

# Permissões
npm run apply-tasks-permissions    # Aplicar permissões de tarefas
npm run fix-tasks-permissions      # Corrigir permissões
npm run check-permissions          # Verificar permissões

# Sistema de tarefas
npm run apply-task-improvements    # Aplicar melhorias
npm run test-upload-system         # Testar upload
npm run apply-history-permissions  # Aplicar permissões de histórico
```

## 📁 Estrutura do Projeto

```
src/
├── components/              # Componentes React
│   ├── auth/               # Autenticação
│   ├── dashboard/          # Dashboard
│   ├── layout/             # Layout principal
│   ├── tasks/              # Componentes de tarefas
│   └── ui/                 # Componentes UI
├── config/                 # Configurações
├── contexts/               # Contextos React
├── hooks/                  # Hooks customizados
├── lib/                    # Utilitários
├── pages/                  # Páginas da aplicação
└── services/               # Serviços API

server/
├── config/                 # Configurações do servidor
├── middleware/             # Middlewares
├── routes/                 # Rotas da API
├── scripts/                # Scripts de banco
└── index.js               # Servidor principal
```

## 🔧 Configuração do Banco de Dados

### SQL Server

1. Instale o SQL Server
2. Crie um banco de dados chamado `EngenTech`
3. Configure as variáveis de ambiente no `.env`
4. Execute `npm run setup` para inicializar o banco

### Estrutura Principal

- **Users**: Usuários do sistema
- **Areas**: Áreas do projeto
- **Equipment**: Equipamentos
- **EquipmentTasks**: Tarefas dos equipamentos
- **TaskHistory**: Histórico de progresso
- **TaskPhotos**: Fotos das tarefas
- **Permissions**: Permissões do sistema
- **RolePermissions**: Permissões por papel

## 🎨 Design System

O sistema utiliza um design monocromático baseado em:
- **Cores primárias**: `text-primary`, `bg-primary`
- **Cores neutras**: `text-foreground`, `text-muted-foreground`
- **Fundos**: `bg-muted`, `bg-primary/10`, `bg-background`
- **Bordas**: `border-border`, `border-primary/20`

## 📊 Monitoramento

### Logs

Os logs são salvos em:
- `logs/backend-error.log`
- `logs/backend-out.log`
- `logs/backend-combined.log`
- `logs/frontend-error.log`
- `logs/frontend-out.log`
- `logs/frontend-combined.log`

### Monitoramento PM2

```bash
# Interface web de monitoramento
pm2 monit

# Status detalhado
pm2 show engentech-backend
pm2 show engentech-frontend
```

## 🔒 Segurança

- Autenticação JWT
- Controle de acesso baseado em papéis (RBAC)
- Validação de entrada
- Sanitização de dados
- Logs de auditoria

## 🚀 Performance

- Build otimizado do frontend
- Compressão de resposta
- Cache de consultas
- Lazy loading de componentes
- Otimização de imagens

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Conflito de dependências**
   ```bash
   # Usar --legacy-peer-deps
   npm install --legacy-peer-deps
   ```

2. **Erro no ecosystem.config.js**
   - O arquivo agora é `ecosystem.config.cjs` (CommonJS)
   - Compatível com PM2

3. **PM2 não reconhece configuração**
   ```bash
   # Testar configuração
   npm run test-pm2
   ```

4. **Porta já em uso**
   ```bash
   # Verificar processos
   netstat -tulpn | grep :3010
   netstat -tulpn | grep :8080
   ```

## 📝 Licença

Este projeto está sob a licença MIT.
