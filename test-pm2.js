#!/usr/bin/env node

// Script de teste para verificar configuração do PM2
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧪 Testando configuração do PM2...\n');

// Verificar se o PM2 está instalado
try {
  execSync('pm2 --version', { stdio: 'pipe' });
  console.log('✅ PM2 está instalado');
} catch (error) {
  console.log('❌ PM2 não está instalado. Execute: npm install -g pm2');
  process.exit(1);
}

// Verificar se o arquivo de configuração existe
const configFile = 'ecosystem.config.cjs';
if (fs.existsSync(configFile)) {
  console.log('✅ Arquivo de configuração encontrado:', configFile);
} else {
  console.log('❌ Arquivo de configuração não encontrado:', configFile);
  process.exit(1);
}

// Verificar se o diretório dist existe
const distDir = 'dist';
if (fs.existsSync(distDir)) {
  console.log('✅ Diretório dist encontrado');
} else {
  console.log('⚠️ Diretório dist não encontrado. Execute: npm run build:frontend');
}

// Verificar se o diretório logs existe
const logsDir = 'logs';
if (fs.existsSync(logsDir)) {
  console.log('✅ Diretório logs encontrado');
} else {
  console.log('ℹ️ Diretório logs será criado automaticamente');
}

// Verificar se o arquivo .env existe
const envFile = '.env';
if (fs.existsSync(envFile)) {
  console.log('✅ Arquivo .env encontrado');
} else {
  console.log('⚠️ Arquivo .env não encontrado. Copie env.example para .env');
}

// Verificar se o diretório uploads existe
const uploadsDir = 'uploads';
if (fs.existsSync(uploadsDir)) {
  console.log('✅ Diretório uploads encontrado');
} else {
  console.log('ℹ️ Diretório uploads será criado automaticamente');
}

console.log('\n🎯 Para iniciar a aplicação:');
console.log('   npm run start          # Produção');
console.log('   npm run start:dev      # Desenvolvimento');
console.log('\n📊 Para monitorar:');
console.log('   npm run status         # Status dos processos');
console.log('   npm run logs           # Ver logs');
console.log('   npm run monit          # Interface de monitoramento');

console.log('\n✅ Teste concluído!');
