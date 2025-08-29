// Configuração de logs do sistema
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Configurar nível de log baseado em variável de ambiente
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
const CURRENT_LOG_LEVEL = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.INFO;

// Função para verificar se deve logar
const shouldLog = (level) => {
  return LOG_LEVELS[level] <= CURRENT_LOG_LEVEL;
};

// Funções de log
export const logger = {
  error: (message, ...args) => {
    if (shouldLog('ERROR')) {
      console.error(`❌ ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (shouldLog('WARN')) {
      console.warn(`⚠️  ${message}`, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (shouldLog('INFO')) {
      console.log(`ℹ️  ${message}`, ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (shouldLog('DEBUG')) {
      console.log(`🔍 ${message}`, ...args);
    }
  },
  
  success: (message, ...args) => {
    if (shouldLog('INFO')) {
      console.log(`✅ ${message}`, ...args);
    }
  },
  
  auth: (message, ...args) => {
    if (shouldLog('INFO')) {
      console.log(`🔐 ${message}`, ...args);
    }
  },
  
  permission: (message, ...args) => {
    if (shouldLog('INFO')) {
      console.log(`🚫 ${message}`, ...args);
    }
  }
};

// Configurações específicas para diferentes ambientes
export const logConfig = {
  // Logs de autenticação (sempre ativos para segurança)
  auth: {
    enabled: true,
    level: 'INFO'
  },
  
  // Logs de permissões (sempre ativos para auditoria)
  permissions: {
    enabled: true,
    level: 'INFO'
  },
  
  // Logs de rotas (reduzidos em produção)
  routes: {
    enabled: process.env.NODE_ENV !== 'production',
    level: 'DEBUG'
  },
  
  // Logs de banco de dados (apenas erros em produção)
  database: {
    enabled: true,
    level: process.env.NODE_ENV === 'production' ? 'ERROR' : 'INFO'
  }
};

export default logger;
