import { getConnection } from '../config/database.js';
import { logger } from '../config/logger.js';

async function testUploadSystem() {
  try {
    logger.info('🧪 Testando sistema de upload de fotos...');
    
    const pool = await getConnection();
    
    // 1. Verificar se a tabela TaskPhotos existe
    const taskPhotosExists = await pool.request().query(`
      SELECT COUNT(*) as count FROM sys.objects 
      WHERE object_id = OBJECT_ID('TaskPhotos') AND type in (N'U')
    `);
    
    if (taskPhotosExists.recordset[0].count > 0) {
      logger.success('✅ Tabela TaskPhotos existe');
    } else {
      logger.error('❌ Tabela TaskPhotos não encontrada');
      return;
    }
    
    // 2. Verificar se as stored procedures existem
    const procedures = ['UpdateTaskProgressWithPhotos', 'GetTaskHistory'];
    for (const proc of procedures) {
      const procExists = await pool.request().query(`
        SELECT COUNT(*) as count FROM sys.objects 
        WHERE object_id = OBJECT_ID('${proc}') AND type in (N'P')
      `);
      
      if (procExists.recordset[0].count > 0) {
        logger.success(`✅ Stored procedure ${proc} existe`);
      } else {
        logger.error(`❌ Stored procedure ${proc} não encontrada`);
      }
    }
    
    // 3. Verificar se as views existem
    const views = ['TaskHistoryWithPhotos', 'EquipmentTasksWithPhotos'];
    for (const view of views) {
      const viewExists = await pool.request().query(`
        SELECT COUNT(*) as count FROM sys.views 
        WHERE name = '${view}'
      `);
      
      if (viewExists.recordset[0].count > 0) {
        logger.success(`✅ View ${view} existe`);
      } else {
        logger.error(`❌ View ${view} não encontrada`);
      }
    }
    
    // 4. Verificar colunas adicionadas nas tabelas existentes
    const columnsToCheck = [
      { table: 'TaskHistory', column: 'photos' },
      { table: 'TaskHistory', column: 'actualHours' },
      { table: 'TaskHistory', column: 'ipAddress' },
      { table: 'TaskHistory', column: 'userAgent' },
      { table: 'EquipmentTasks', column: 'currentPhotos' },
      { table: 'EquipmentTasks', column: 'lastProgressUpdate' },
      { table: 'EquipmentTasks', column: 'lastUpdatedBy' }
    ];
    
    for (const { table, column } of columnsToCheck) {
      const columnExists = await pool.request().query(`
        SELECT COUNT(*) as count FROM sys.columns 
        WHERE object_id = OBJECT_ID('${table}') AND name = '${column}'
      `);
      
      if (columnExists.recordset[0].count > 0) {
        logger.success(`✅ Coluna ${table}.${column} existe`);
      } else {
        logger.warn(`⚠️  Coluna ${table}.${column} não encontrada`);
      }
    }
    
    // 5. Verificar se há tarefas para testar
    const tasksCount = await pool.request().query(`
      SELECT COUNT(*) as count FROM EquipmentTasks
    `);
    
    logger.info(`📊 Total de tarefas no sistema: ${tasksCount.recordset[0].count}`);
    
    // 6. Verificar se há histórico para testar
    const historyCount = await pool.request().query(`
      SELECT COUNT(*) as count FROM TaskHistory
    `);
    
    logger.info(`📊 Total de registros de histórico: ${historyCount.recordset[0].count}`);
    
    // 7. Verificar se há fotos para testar
    const photosCount = await pool.request().query(`
      SELECT COUNT(*) as count FROM TaskPhotos
    `);
    
    logger.info(`📊 Total de fotos no sistema: ${photosCount.recordset[0].count}`);
    
    // 8. Testar a view TaskHistoryWithPhotos
    try {
      const viewTest = await pool.request().query(`
        SELECT TOP 5 * FROM TaskHistoryWithPhotos
      `);
      logger.success(`✅ View TaskHistoryWithPhotos funciona - ${viewTest.recordset.length} registros`);
    } catch (error) {
      logger.error('❌ Erro ao testar view TaskHistoryWithPhotos:', error.message);
    }
    
    // 9. Testar a view EquipmentTasksWithPhotos
    try {
      const viewTest = await pool.request().query(`
        SELECT TOP 5 * FROM EquipmentTasksWithPhotos
      `);
      logger.success(`✅ View EquipmentTasksWithPhotos funciona - ${viewTest.recordset.length} registros`);
    } catch (error) {
      logger.error('❌ Erro ao testar view EquipmentTasksWithPhotos:', error.message);
    }
    
    logger.success('🎉 Teste do sistema de upload concluído!');
    logger.info('📋 Funcionalidades disponíveis:');
    logger.info('   - Upload de fotos para tarefas');
    logger.info('   - Histórico detalhado de progresso');
    logger.info('   - Armazenamento de fotos no banco');
    logger.info('   - Views otimizadas para consultas');
    logger.info('   - Stored procedures para operações complexas');
    
  } catch (error) {
    logger.error('❌ Erro ao testar sistema de upload:', error.message);
  } finally {
    process.exit(0);
  }
}

testUploadSystem();
