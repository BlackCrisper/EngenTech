@echo off
REM Script de Deploy para EngenTech (Windows)
REM Uso: deploy.bat [production|development]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

echo 🚀 Iniciando deploy para ambiente: %ENVIRONMENT%

REM Verificar se o PM2 está instalado
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PM2 não está instalado. Instalando...
    npm install -g pm2
)

REM Criar diretório de logs se não existir
if not exist "logs" mkdir logs

REM Parar processos existentes
echo 🛑 Parando processos existentes...
pm2 stop ecosystem.config.cjs 2>nul
pm2 delete ecosystem.config.cjs 2>nul

REM Instalar dependências
echo 📦 Instalando dependências...
if "%ENVIRONMENT%"=="production" (
    call npm run install:prod
) else (
    call npm run install:dev
)

REM Build do frontend
echo 🔨 Fazendo build do frontend...
call npm run build:frontend

REM Iniciar aplicação
echo ▶️ Iniciando aplicação...
if "%ENVIRONMENT%"=="production" (
    pm2 start ecosystem.config.cjs --env production
) else (
    pm2 start ecosystem.config.cjs
)

REM Salvar configuração do PM2
echo 💾 Salvando configuração do PM2...
pm2 save

REM Configurar startup automático
echo ⚙️ Configurando startup automático...
pm2 startup

echo ✅ Deploy concluído com sucesso!
echo 📊 Status dos processos:
pm2 status

echo 📝 Logs disponíveis com: npm run logs
echo 🖥️ Monitoramento disponível com: npm run monit
echo 🌐 Frontend: http://localhost:8080
echo 🔧 Backend: http://localhost:3010

pause
