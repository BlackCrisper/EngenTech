# 🚀 Guia Rápido de Deploy - EngenTech

## Deploy Automático

### Windows
```cmd
deploy.bat production
```

### Linux/Mac
```bash
chmod +x deploy.sh
./deploy.sh production
```

## Deploy Manual

### 1. Instalar PM2
```bash
npm install -g pm2
```

### 2. Testar Configuração
```bash
npm run test-pm2
```

### 3. Configurar Ambiente
```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar variáveis de ambiente
nano .env
```

### 4. Instalar Dependências
```bash
# Produção (sem devDependencies)
npm run install:prod

# Desenvolvimento (com devDependencies)
npm run install:dev
```

### 5. Build do Frontend
```bash
npm run build:frontend
```

### 6. Iniciar Aplicação
```bash
# Produção
npm run start

# Desenvolvimento
npm run start:dev
```

## Comandos Úteis

### Status e Monitoramento
```bash
npm run status    # Status dos processos
npm run logs      # Ver logs
npm run monit     # Interface de monitoramento
```

### Gerenciamento
```bash
npm run restart   # Reiniciar aplicação
npm run reload    # Recarregar (zero downtime)
npm run stop      # Parar aplicação
npm run delete    # Deletar aplicação
```

### Deploy Rápido
```bash
npm run deploy    # Build + reload
```

## Verificação

Após o deploy, verifique:

1. **Frontend**: http://localhost:8080
2. **Backend**: http://localhost:3010/api/health
3. **Logs**: `npm run logs`
4. **Status**: `npm run status`

## Troubleshooting

### Problemas Comuns

1. **Conflito de dependências**
   ```bash
   # Usar --legacy-peer-deps
   npm install --legacy-peer-deps
   npm run install:prod
   ```

2. **Erro no ecosystem.config.js**
   - O arquivo agora é `ecosystem.config.cjs` (CommonJS)
   - Compatível com PM2

3. **PM2 não encontrado**
   ```bash
   npm install -g pm2
   ```

4. **Erro de permissão (Linux/Mac)**
   ```bash
   chmod +x deploy.sh
   sudo npm install -g pm2
   ```

5. **Banco de dados não conecta**
   - Verificar `.env`
   - Verificar SQL Server
   - Executar `npm run setup`

6. **Porta já em uso**
   ```bash
   # Verificar processos
   netstat -tulpn | grep :3010
   netstat -tulpn | grep :8080
   
   # Matar processo
   kill -9 <PID>
   ```

### Logs Detalhados
```bash
# Logs do backend
pm2 logs engentech-backend

# Logs do frontend
pm2 logs engentech-frontend

# Logs de erro
pm2 logs engentech-backend --err
```

## Configuração de Produção

### Variáveis de Ambiente (.env)
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

### Firewall (Linux)
```bash
# Permitir portas
sudo ufw allow 8080
sudo ufw allow 3010
```

### Nginx (Opcional)
```bash
# Copiar configuração
sudo cp nginx.conf /etc/nginx/sites-available/engentech

# Ativar site
sudo ln -s /etc/nginx/sites-available/engentech /etc/nginx/sites-enabled/

# Testar e reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

## Backup e Restore

### Backup do Banco
```bash
# Backup automático (configurar no SQL Server)
# Ou manual:
sqlcmd -S localhost -d EngenTech -Q "BACKUP DATABASE EngenTech TO DISK = 'backup.bak'"
```

### Backup dos Uploads
```bash
# Backup dos arquivos
tar -czf uploads-backup.tar.gz uploads/
```

## Monitoramento

### Métricas PM2
```bash
pm2 monit                    # Interface web
pm2 show engentech-backend   # Detalhes do processo
pm2 show engentech-frontend  # Detalhes do processo
```

### Logs Estruturados
- `logs/backend-error.log` - Erros do backend
- `logs/backend-out.log` - Saída do backend
- `logs/frontend-error.log` - Erros do frontend
- `logs/frontend-out.log` - Saída do frontend

## Segurança

### Checklist
- [ ] JWT_SECRET forte configurado
- [ ] Senhas do banco seguras
- [ ] Firewall configurado
- [ ] Logs de acesso ativos
- [ ] Backup automático configurado
- [ ] SSL/HTTPS configurado (produção)

### SSL/HTTPS (Produção)
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot --nginx -d seu-dominio.com
```

## Arquivos de Configuração

### ecosystem.config.cjs
- Configuração PM2 em formato CommonJS
- Compatível com PM2
- Logs estruturados
- Restart automático

### Scripts de Deploy
- `deploy.sh` - Linux/Mac
- `deploy.bat` - Windows
- Deploy automático com verificação

### Teste de Configuração
```bash
npm run test-pm2
```
