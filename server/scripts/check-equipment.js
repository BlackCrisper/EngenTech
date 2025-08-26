import { getConnection, sql } from '../config/database.js';

async function checkEquipment() {
  try {
    const pool = await getConnection();
    console.log('✅ Conectado ao banco de dados');

    // Verificar estrutura da tabela Equipment
    console.log('\n📋 Estrutura da tabela Equipment:');
    const structureResult = await pool.request()
      .query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Equipment'
        ORDER BY ORDINAL_POSITION
      `);
    
    console.table(structureResult.recordset);

    // Verificar equipamentos existentes
    console.log('\n🔧 Equipamentos existentes:');
    const equipmentResult = await pool.request()
      .query(`
        SELECT 
          id,
          tag,
          type,
          areaId,
          description,
          isParent,
          hierarchyLevel,
          parentTag
        FROM Equipment
        ORDER BY id
      `);
    
    console.table(equipmentResult.recordset);

    // Verificar se a tabela EquipmentTasks existe
    console.log('\n📋 Verificando tabela EquipmentTasks:');
    const tasksTableResult = await pool.request()
      .query(`
        SELECT COUNT(*) as tableExists
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = 'EquipmentTasks'
      `);
    
    if (tasksTableResult.recordset[0].tableExists > 0) {
      console.log('✅ Tabela EquipmentTasks existe');
      
      // Verificar estrutura da tabela EquipmentTasks
      const tasksStructureResult = await pool.request()
        .query(`
          SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'EquipmentTasks'
          ORDER BY ORDINAL_POSITION
        `);
      
      console.table(tasksStructureResult.recordset);
    } else {
      console.log('❌ Tabela EquipmentTasks não existe');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkEquipment();
