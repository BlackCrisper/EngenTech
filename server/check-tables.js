import { getConnection } from './config/database.js';

async function checkTables() {
  try {
    console.log('🔍 Verificando tabelas no banco EngTech...');
    
    const pool = await getConnection();
    
    // Verificar todas as tabelas
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📊 Tabelas encontradas:');
    if (tablesResult.recordset.length === 0) {
      console.log('   ⚠️ Nenhuma tabela encontrada. O banco está vazio.');
    } else {
      tablesResult.recordset.forEach(table => {
        console.log(`   - ${table.TABLE_NAME}`);
      });
    }
    
    // Verificar se o banco EngTech existe
    const databasesResult = await pool.request().query(`
      SELECT name 
      FROM sys.databases 
      WHERE name = 'EngTech'
    `);
    
    if (databasesResult.recordset.length > 0) {
      console.log('\n✅ Banco EngTech encontrado!');
    } else {
      console.log('\n❌ Banco EngTech não encontrado!');
    }
    
    console.log('\n🎉 Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

checkTables()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na verificação:', error);
    process.exit(1);
  });
