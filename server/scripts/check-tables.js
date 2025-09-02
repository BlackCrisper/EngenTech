import { getConnection, sql } from '../config/database.js';
import { logger } from '../config/logger.js';

async function checkTables() {
  try {
    const pool = await getConnection();
    
    console.log('🔍 Verificando estrutura das tabelas...');
    
    // Verificar se TaskHistory tem coluna photos
    const historyColumns = await pool.request()
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'TaskHistory' 
        ORDER BY ORDINAL_POSITION
      `);
    
    console.log('📋 Colunas da tabela TaskHistory:');
    historyColumns.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });
    
    // Verificar se TaskPhotos existe
    const taskPhotosExists = await pool.request()
      .query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'TaskPhotos'
      `);
    
    if (taskPhotosExists.recordset[0].count > 0) {
      console.log('✅ Tabela TaskPhotos existe');
      
      // Verificar estrutura da TaskPhotos
      const photoColumns = await pool.request()
        .query(`
          SELECT COLUMN_NAME, DATA_TYPE 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'TaskPhotos' 
          ORDER BY ORDINAL_POSITION
        `);
      
      console.log('📸 Colunas da tabela TaskPhotos:');
      photoColumns.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
      });
    } else {
      console.log('❌ Tabela TaskPhotos não existe');
    }
    
    // Verificar se EquipmentTasks tem coluna photos
    const equipmentColumns = await pool.request()
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'EquipmentTasks' 
        ORDER BY ORDINAL_POSITION
      `);
    
    console.log('⚙️ Colunas da tabela EquipmentTasks:');
    equipmentColumns.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error);
  }
}

checkTables();
