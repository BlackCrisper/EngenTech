import { getConnection } from './config/database.js';
import fs from 'fs';
import path from 'path';

async function initDatabase() {
  try {
    console.log('🚀 Inicializando banco de dados EngTech...');
    
    const pool = await getConnection();
    
    // Ler o script SQL
    const sqlScript = fs.readFileSync(
      path.join(process.cwd(), 'server', 'scripts', 'init-database.sql'), 
      'utf8'
    );
    
    // Dividir o script em comandos individuais
    const commands = sqlScript
      .split('GO')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          await pool.request().query(command);
          console.log(`✅ Comando ${i + 1}/${commands.length} executado com sucesso`);
        } catch (error) {
          console.log(`⚠️ Comando ${i + 1}/${commands.length}: ${error.message}`);
          // Continuar mesmo com erros (alguns comandos podem falhar se já existirem)
        }
      }
    }
    
    console.log('\n🎉 Inicialização do banco concluída!');
    
    // Verificar se as tabelas foram criadas
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📊 Tabelas criadas:');
    tablesResult.recordset.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
    // Verificar dados inseridos
    const usersCount = await pool.request().query('SELECT COUNT(*) as count FROM Users');
    const areasCount = await pool.request().query('SELECT COUNT(*) as count FROM Areas');
    const equipmentCount = await pool.request().query('SELECT COUNT(*) as count FROM Equipment');
    
    console.log('\n📈 Dados inseridos:');
    console.log(`   - Usuários: ${usersCount.recordset[0].count}`);
    console.log(`   - Áreas: ${areasCount.recordset[0].count}`);
    console.log(`   - Equipamentos: ${equipmentCount.recordset[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error.message);
    throw error;
  }
}

initDatabase()
  .then(() => {
    console.log('\n✅ Banco de dados inicializado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na inicialização:', error);
    process.exit(1);
  });
