import { getConnection } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  try {
    console.log('🚀 Iniciando inicialização do banco de dados...');
    
    const pool = await getConnection();
    
    // Ler o script SQL
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'init-database.sql'), 
      'utf8'
    );
    
    console.log('📄 Script SQL carregado com sucesso');
    console.log(`📏 Tamanho do script: ${sqlScript.length} caracteres`);
    
    // Dividir o script em comandos individuais usando GO como separador
    const commands = sqlScript
      .split(/\bGO\b/i)
      .map(cmd => cmd.trim())
      .filter(cmd => {
        // Manter comandos que não são vazios e contêm SQL
        if (cmd.length === 0) return false;
        
        // Remover comentários do início para verificar se há SQL
        const sqlOnly = cmd.replace(/^[\s\-]*--.*$/gm, '').trim();
        return sqlOnly.length > 0;
      });
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`\n🔧 Executando comando ${i + 1}/${commands.length}:`);
          console.log(`   ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
          
          await pool.request().query(command);
          console.log(`✅ Comando ${i + 1}/${commands.length} executado com sucesso`);
        } catch (error) {
          // Ignorar erros de tabelas já existentes
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('already an object')) {
            console.log(`⚠️  Comando ${i + 1}/${commands.length} ignorado (já existe): ${error.message}`);
          } else {
            console.error(`❌ Erro no comando ${i + 1}/${commands.length}:`, error.message);
            console.error(`   Comando: ${command}`);
          }
        }
      }
    }
    
    console.log('\n✅ Banco de dados inicializado com sucesso!');
    console.log('📊 Dados de exemplo inseridos:');
    console.log('   - 3 usuários padrão');
    console.log('   - 8 áreas da obra');
    console.log('   - 13 equipamentos');
    console.log('   - Progresso inicial para 15 disciplinas');
    console.log('   - Métricas do dashboard');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
}

// Executar sempre
console.log('🎯 Iniciando script de inicialização do banco de dados...');
initializeDatabase()
  .then(() => {
    console.log('🎉 Inicialização concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na inicialização:', error);
    process.exit(1);
  });

export { initializeDatabase };
