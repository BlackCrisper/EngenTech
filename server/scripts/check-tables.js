import { getConnection } from '../config/database.js';
import { logger } from '../config/logger.js';

async function checkTables() {
  try {
    logger.info('🔍 Verificando tabelas do sistema...');
    
    const pool = await getConnection();
    
    // Listar todas as tabelas
    const tables = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    logger.info('📋 Tabelas encontradas:');
    tables.recordset.forEach(table => {
      logger.info(`   - ${table.TABLE_NAME}`);
    });
    
    // Verificar tabelas relacionadas a roles e permissões
    const roleTables = tables.recordset.filter(t => 
      t.TABLE_NAME.toLowerCase().includes('role') || 
      t.TABLE_NAME.toLowerCase().includes('permission') ||
      t.TABLE_NAME.toLowerCase().includes('user')
    );
    
    logger.info('\n🔐 Tabelas de roles/permissões:');
    roleTables.forEach(table => {
      logger.info(`   - ${table.TABLE_NAME}`);
    });
    
    // Verificar estrutura da tabela Users se existir
    if (tables.recordset.some(t => t.TABLE_NAME === 'Users')) {
      const userColumns = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Users'
        ORDER BY ORDINAL_POSITION
      `);
      
      logger.info('\n👥 Colunas da tabela Users:');
      userColumns.recordset.forEach(col => {
        logger.info(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
      });
    }
    
    // Verificar se existe alguma tabela de permissões
    const permissionTables = tables.recordset.filter(t => 
      t.TABLE_NAME.toLowerCase().includes('permission')
    );
    
    if (permissionTables.length > 0) {
      logger.info('\n🔑 Tabelas de permissões encontradas:');
      for (const table of permissionTables) {
        const columns = await pool.request().query(`
          SELECT COLUMN_NAME, DATA_TYPE 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = '${table.TABLE_NAME}'
          ORDER BY ORDINAL_POSITION
        `);
        
        logger.info(`\n📋 Estrutura de ${table.TABLE_NAME}:`);
        columns.recordset.forEach(col => {
          logger.info(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
        });
      }
    }
    
  } catch (error) {
    logger.error('❌ Erro ao verificar tabelas:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTables();
