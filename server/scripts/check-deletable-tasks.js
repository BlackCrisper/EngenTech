import { getConnection } from '../config/database.js';

async function checkDeletableTasks() {
  try {
    console.log('🔍 Verificando tarefas que podem ser deletadas...');
    
    const pool = await getConnection();
    
    // Verificar tarefas que podem ser deletadas (sem progresso, sem histórico, sem fotos)
    const deletableTasks = await pool.request().query(`
      SELECT 
        et.id,
        et.name,
        et.discipline,
        et.isCustom,
        et.currentProgress,
        et.status,
        e.equipmentTag,
        CASE 
          WHEN et.isCustom = 1 THEN 'SUPERVISOR pode deletar'
          WHEN et.isCustom = 0 THEN 'Apenas ADMIN pode deletar'
        END as whoCanDelete
      FROM EquipmentTasks et
      JOIN Equipment e ON et.equipmentId = e.id
      WHERE et.currentProgress = 0
      AND NOT EXISTS (SELECT 1 FROM TaskHistory WHERE taskId = et.id)
      ORDER BY et.isCustom DESC, et.id
    `);
    
    console.log(`\n📊 Tarefas que podem ser deletadas: ${deletableTasks.recordset.length}`);
    
    if (deletableTasks.recordset.length === 0) {
      console.log('❌ Nenhuma tarefa pode ser deletada');
      console.log('💡 Todas as tarefas têm progresso, histórico ou fotos');
    } else {
      console.log('\n📋 Lista de Tarefas Deletáveis:');
      deletableTasks.recordset.forEach(task => {
        const type = task.isCustom ? 'CUSTOMIZADA' : 'PADRÃO';
        console.log(`   ID ${task.id}: ${task.name} (${task.discipline}) - ${type} - ${task.whoCanDelete}`);
      });
    }
    
    // Verificar tarefas que NÃO podem ser deletadas
    const nonDeletableTasks = await pool.request().query(`
      SELECT 
        et.id,
        et.name,
        et.discipline,
        et.isCustom,
        et.currentProgress,
        et.status,
        e.equipmentTag,
        CASE 
          WHEN et.currentProgress > 0 THEN 'Tem progresso'
          WHEN EXISTS (SELECT 1 FROM TaskHistory WHERE taskId = et.id) THEN 'Tem histórico'
          WHEN EXISTS (SELECT 1 FROM TaskHistory WHERE taskId = et.id AND photos IS NOT NULL AND photos != '') THEN 'Tem fotos'
          ELSE 'Outro motivo'
        END as reason
      FROM EquipmentTasks et
      JOIN Equipment e ON et.equipmentId = e.id
      WHERE et.currentProgress > 0
      OR EXISTS (SELECT 1 FROM TaskHistory WHERE taskId = et.id)
      ORDER BY et.id
      LIMIT 10
    `);
    
    console.log(`\n📊 Tarefas que NÃO podem ser deletadas (primeiras 10):`);
    nonDeletableTasks.recordset.forEach(task => {
      const type = task.isCustom ? 'CUSTOMIZADA' : 'PADRÃO';
      console.log(`   ID ${task.id}: ${task.name} (${task.discipline}) - ${type} - ${task.reason}`);
    });
    
    console.log('\n📋 Resumo:');
    console.log('   - Para SUPERVISOR testar: Crie uma tarefa personalizada');
    console.log('   - Para ADMIN testar: Use qualquer tarefa padrão sem progresso');
    console.log('   - Tarefas com progresso: Ninguém pode deletar');
    console.log('   - Tarefas com histórico: Ninguém pode deletar');
    
  } catch (error) {
    console.error('❌ Erro ao verificar tarefas:', error);
  } finally {
    process.exit(0);
  }
}

checkDeletableTasks();
