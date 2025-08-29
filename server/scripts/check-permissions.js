import { getConnection } from '../config/database.js';

async function checkPermissions() {
  try {
    console.log('🔍 Verificando permissões de tarefas...');
    
    const pool = await getConnection();
    
    // Verificar permissões de deletar tarefas normais
    console.log('\n📊 Permissões para deletar tarefas normais:');
    const tasksDeleteResult = await pool.request().query(`
      SELECT p.name, rp.role, rp.granted
      FROM Permissions p
      JOIN RolePermissions rp ON p.id = rp.permissionId
      WHERE p.name = 'tasks.delete'
      ORDER BY rp.role
    `);
    
    if (tasksDeleteResult.recordset.length === 0) {
      console.log('   ❌ Nenhuma permissão encontrada para tasks.delete');
    } else {
      tasksDeleteResult.recordset.forEach(perm => {
        const status = perm.granted ? '✅ PODE' : '❌ NÃO PODE';
        console.log(`   ${perm.role}: ${status} deletar tarefas normais`);
      });
    }
    
    // Verificar permissões de deletar tarefas padrão
    console.log('\n📊 Permissões para deletar tarefas padrão:');
    const standardTasksDeleteResult = await pool.request().query(`
      SELECT p.name, rp.role, rp.granted
      FROM Permissions p
      JOIN RolePermissions rp ON p.id = rp.permissionId
      WHERE p.name = 'standard-tasks.delete'
      ORDER BY rp.role
    `);
    
    if (standardTasksDeleteResult.recordset.length === 0) {
      console.log('   ❌ Nenhuma permissão encontrada para standard-tasks.delete');
    } else {
      standardTasksDeleteResult.recordset.forEach(perm => {
        const status = perm.granted ? '✅ PODE' : '❌ NÃO PODE';
        console.log(`   ${perm.role}: ${status} deletar tarefas padrão`);
      });
    }
    
    // Verificar todas as permissões de tarefas
    console.log('\n📊 Todas as permissões de tarefas:');
    const allTasksPermissions = await pool.request().query(`
      SELECT p.name, p.resource, p.action, rp.role, rp.granted
      FROM Permissions p
      JOIN RolePermissions rp ON p.id = rp.permissionId
      WHERE p.resource IN ('tasks', 'standard-tasks')
      ORDER BY p.resource, p.action, rp.role
    `);
    
    allTasksPermissions.recordset.forEach(perm => {
      const status = perm.granted ? '✅' : '❌';
      console.log(`   ${status} ${perm.role}: ${perm.resource}.${perm.action}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error);
  } finally {
    process.exit(0);
  }
}

checkPermissions();
