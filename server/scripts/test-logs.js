import { logger } from '../config/logger.js';

async function testLogs() {
  console.log('🧪 Testando sistema de logs...\n');
  
  // Testar diferentes níveis de log
  logger.error('Este é um erro de teste');
  logger.warn('Este é um aviso de teste');
  logger.info('Esta é uma informação de teste');
  logger.debug('Este é um debug de teste');
  logger.success('Esta é uma mensagem de sucesso');
  logger.auth('Este é um log de autenticação');
  logger.permission('Este é um log de permissão');
  
  console.log('\n📋 Configurações atuais:');
  console.log('   LOG_LEVEL:', process.env.LOG_LEVEL || 'INFO');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
  
  console.log('\n💡 Para reduzir logs:');
  console.log('   - Defina LOG_LEVEL=ERROR no .env');
  console.log('   - Ou LOG_LEVEL=WARN para menos verbosidade');
  console.log('   - LOG_LEVEL=DEBUG para todos os logs');
  
  console.log('\n✅ Teste de logs concluído!');
}

testLogs();
