#!/bin/bash

# Script de Deploy para EngenTech
# Uso: ./deploy.sh [production|development]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Iniciando deploy para ambiente: $ENVIRONMENT"

# Verificar se o PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 não está instalado. Instalando..."
    npm install -g pm2
fi

# Criar diretório de logs se não existir
mkdir -p logs

# Parar processos existentes
echo "🛑 Parando processos existentes..."
pm2 stop ecosystem.config.cjs 2>/dev/null || true
pm2 delete ecosystem.config.cjs 2>/dev/null || true

# Instalar dependências
echo "📦 Instalando dependências..."
if [ "$ENVIRONMENT" = "production" ]; then
    npm run install:prod
else
    npm run install:dev
fi

# Build do frontend
echo "🔨 Fazendo build do frontend..."
npm run build:frontend

# Iniciar aplicação
echo "▶️ Iniciando aplicação..."
if [ "$ENVIRONMENT" = "production" ]; then
    pm2 start ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs
fi

# Salvar configuração do PM2
echo "💾 Salvando configuração do PM2..."
pm2 save

# Configurar startup automático
echo "⚙️ Configurando startup automático..."
pm2 startup

echo "✅ Deploy concluído com sucesso!"
echo "📊 Status dos processos:"
pm2 status

echo "📝 Logs disponíveis com: npm run logs"
echo "🖥️ Monitoramento disponível com: npm run monit"
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend: http://localhost:3010"
