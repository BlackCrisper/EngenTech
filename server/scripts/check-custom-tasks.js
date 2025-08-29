import { getConnection } from '../config/database.js';

async function checkCustomTasks() {
  try {
    console.log('🔍 Verificando tarefas customizadas disponíveis...');
    
    const pool = await getConnection();
    
    // Verificar tarefas customizadas
    const customTasks = await pool.request().query(`
      SELECT 
        et.id,
        et.name,
        et.discipline,
        et.isCustom,
        et.currentProgress,
        et.status,
        e.equipmentTag
      FROM EquipmentTasks et
      JOIN Equipment e ON et.equipmentId = e.id
      WHERE et.isCustom = 1
      ORDER BY et.id
    `);
    
    console.log(`\n📊 Tarefas Customizadas encontradas: ${customTasks.recordset.length}`);
    
    if (customTasks.recordset.length === 0) {
      console.log('❌ Nenhuma tarefa customizada encontrada');
      console.log('💡 Para testar, crie uma tarefa personalizada primeiro');
    } else {
      console.log('\n📋 Lista de Tarefas Customizadas:');
      customTasks.recordset.forEach(task => {
        const canDelete = task.currentProgress === 0 ? '✅ PODE' : '❌ NÃO PODE';
        console.log(`   ID ${task.id}: ${task.name} (${task.discipline}) - ${canDelete} deletar`);
      });
    }
    
    // Verificar tarefas padrão também
    const standardTasks = await pool.request().query(`
      SELECT TOP 5
        et.id,
        et.name,
        et.discipline,
        et.isCustom,
        et.currentProgress,
        et.status,
        e.equipmentTag
      FROM EquipmentTasks et
      JOIN Equipment e ON et.equipmentId = e.id
      WHERE et.isCustom = 0
      ORDER BY et.id
    `);
    
    console.log(`\n📊 Primeiras 5 Tarefas Padrão:`);
    standardTasks.recordset.forEach(task => {
      const canDelete = task.currentProgress === 0 ? '✅ ADMIN PODE' : '❌ NINGUÉM PODE';
      console.log(`   ID ${task.id}: ${task.name} (${task.discipline}) - ${canDelete} deletar`);
    });
    
    console.log('\n📋 Resumo de Permissões:');
    console.log('   - ADMIN: Pode deletar tarefas normais e padrão');
    console.log('   - SUPERVISOR: Pode deletar apenas tarefas normais (customizadas)');
    console.log('   - ENGINEER/OPERATOR/VIEWER: Não podem deletar nenhuma tarefa');
    
  } catch (error) {
    console.error('❌ Erro ao verificar tarefas:', error);
  } finally {
    process.exit(0);
  }
}

checkCustomTasks();
