import { getConnection } from './config/database.js';

async function checkUsersTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela Users...');
    
    const pool = await getConnection();
    
    // Verificar colunas da tabela Users
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📊 Colunas da tabela Users:');
    columnsResult.recordset.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Verificar dados na tabela
    const usersResult = await pool.request().query('SELECT TOP 3 * FROM Users');
    
    console.log('\n👥 Dados de exemplo na tabela Users:');
    usersResult.recordset.forEach((user, index) => {
      console.log(`   Usuário ${index + 1}:`, user);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkUsersTable()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na verificação:', error);
    process.exit(1);
  });
