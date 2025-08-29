import { getConnection } from '../config/database.js';

async function checkTaskType() {
  try {
    console.log('🔍 Verificando informações da tarefa 193...');
    
    const pool = await getConnection();
    
    // Verificar informações da tarefa
    const taskInfo = await pool.request()
      .input('taskId', 193)
      .query(`
        SELECT 
          et.id,
          et.name,
          et.discipline,
          et.isCustom,
          et.currentProgress,
          et.status,
          st.name as standardTaskName,
          e.equipmentTag
        FROM EquipmentTasks et
        LEFT JOIN StandardTasks st ON et.standardTaskId = st.id
        JOIN Equipment e ON et.equipmentId = e.id
        WHERE et.id = @taskId
      `);
    
    if (taskInfo.recordset.length === 0) {
      console.log('❌ Tarefa 193 não encontrada');
      return;
    }
    
    const task = taskInfo.recordset[0];
    
    console.log('\n📋 Informações da Tarefa 193:');
    console.log(`   Nome: ${task.name}`);
    console.log(`   Disciplina: ${task.discipline}`);
    console.log(`   É Customizada: ${task.isCustom ? 'SIM' : 'NÃO'}`);
    console.log(`   Progresso Atual: ${task.currentProgress}%`);
    console.log(`   Status: ${task.status}`);
    console.log(`   Tarefa Padrão Base: ${task.standardTaskName || 'N/A'}`);
    console.log(`   Equipamento: ${task.equipmentTag}`);
    
    // Verificar se é uma tarefa padrão
    if (!task.isCustom) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
      console.log('   Esta é uma TAREFA PADRÃO (isCustom = false)');
      console.log('   SUPERVISOR não pode deletar tarefas padrão');
      console.log('   Apenas ADMIN pode deletar tarefas padrão');
    } else {
      console.log('\n✅ Esta é uma TAREFA CUSTOMIZADA');
      console.log('   SUPERVISOR deveria conseguir deletar');
    }
    
    // Verificar outras validações
    if (task.currentProgress > 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
      console.log(`   Tarefa tem ${task.currentProgress}% de progresso`);
      console.log('   Tarefas com progresso não podem ser deletadas');
    }
    
    // Verificar histórico
    const historyCount = await pool.request()
      .input('taskId', 193)
      .query('SELECT COUNT(*) as count FROM TaskHistory WHERE taskId = @taskId');
    
    if (historyCount.recordset[0].count > 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
      console.log(`   Tarefa tem ${historyCount.recordset[0].count} registro(s) de histórico`);
      console.log('   Tarefas com histórico não podem ser deletadas');
    }
    
    // Verificar fotos
    const photosCount = await pool.request()
      .input('taskId', 193)
      .query(`
        SELECT COUNT(*) as count 
        FROM TaskHistory 
        WHERE taskId = @taskId AND photos IS NOT NULL AND photos != ''
      `);
    
    if (photosCount.recordset[0].count > 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
      console.log(`   Tarefa tem ${photosCount.recordset[0].count} registro(s) com fotos`);
      console.log('   Tarefas com fotos não podem ser deletadas');
    }
    
    console.log('\n📊 Resumo:');
    if (!task.isCustom) {
      console.log('   ❌ SUPERVISOR não pode deletar (é tarefa padrão)');
    } else if (task.currentProgress > 0) {
      console.log('   ❌ Ninguém pode deletar (tem progresso)');
    } else if (historyCount.recordset[0].count > 0) {
      console.log('   ❌ Ninguém pode deletar (tem histórico)');
    } else if (photosCount.recordset[0].count > 0) {
      console.log('   ❌ Ninguém pode deletar (tem fotos)');
    } else {
      console.log('   ✅ SUPERVISOR deveria conseguir deletar');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tarefa:', error);
  } finally {
    process.exit(0);
  }
}

checkTaskType();
