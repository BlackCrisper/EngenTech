import { getConnection, sql } from '../config/database.js';

async function debugEquipment() {
  try {
    const pool = await getConnection();
    
    console.log('=== DEBUG EQUIPAMENTOS ÁREA 1 ===');
    
    // Verificar equipamentos da área 1
    const equipmentResult = await pool.request()
      .input('areaId', sql.Int, 1)
      .query(`
        SELECT 
          e.id,
          e.tag,
          e.type,
          e.description,
          e.isParent,
          e.parentTag,
          e.areaId,
          a.name as areaName
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        WHERE e.areaId = @areaId
        ORDER BY e.isParent DESC, e.tag
      `);
    
    console.log('Equipamentos na área 1:');
    equipmentResult.recordset.forEach((eq, index) => {
      console.log(`${index + 1}. ID: ${eq.id}, Tag: ${eq.tag}, Tipo: ${eq.type}, É Pai: ${eq.isParent}, Pai: ${eq.parentTag || 'N/A'}`);
    });
    
    // Verificar tarefas dos equipamentos
    console.log('\n=== TAREFAS DOS EQUIPAMENTOS ===');
    for (const eq of equipmentResult.recordset) {
      const tasksResult = await pool.request()
        .input('equipmentId', sql.Int, eq.id)
        .query(`
          SELECT 
            et.id,
            et.discipline,
            et.name,
            et.currentProgress,
            et.targetProgress,
            et.status
          FROM EquipmentTasks et
          WHERE et.equipmentId = @equipmentId
        `);
      
      console.log(`\nEquipamento ${eq.tag} (ID: ${eq.id}):`);
      if (tasksResult.recordset.length === 0) {
        console.log('  - Nenhuma tarefa encontrada');
      } else {
        tasksResult.recordset.forEach(task => {
          console.log(`  - ${task.discipline}: ${task.currentProgress}% (${task.name})`);
        });
      }
    }
    
    // Verificar progresso por área
    console.log('\n=== PROGRESSO POR ÁREA ===');
    const progressResult = await pool.request()
      .input('areaId', sql.Int, 1)
      .query(`
        SELECT 
          e.id as equipmentId,
          e.tag as equipmentTag,
          e.type as equipmentName,
          a.name as areaName,
          et.discipline,
          et.currentProgress,
          et.targetProgress,
          et.description as observations,
          et.updatedAt
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
        WHERE a.id = @areaId
        ORDER BY e.tag, et.discipline
      `);
    
    console.log('Dados de progresso:');
    progressResult.recordset.forEach((row, index) => {
      console.log(`${index + 1}. ${row.equipmentTag} - ${row.discipline || 'N/A'}: ${row.currentProgress || 0}%`);
    });
    
    await pool.close();
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

debugEquipment();
