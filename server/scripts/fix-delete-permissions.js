import { getConnection } from '../config/database.js';

async function fixDeletePermissions() {
  try {
    console.log('🔧 Corrigindo permissões de deleção - apenas ADMIN e SUPERVISOR...');
    
    const pool = await getConnection();
    
    // 1. Remover permissão de deletar tarefas de ENGINEER e OPERATOR
    console.log('🗑️  Removendo permissão de deletar tarefas de ENGINEER e OPERATOR...');
    
    await pool.request().query(`
      DELETE FROM RolePermissions 
      WHERE role IN ('engineer', 'operator') 
      AND permissionId IN (
        SELECT id FROM Permissions WHERE name = 'tasks.delete'
      )
    `);
    
    console.log('✅ Permissões removidas de ENGINEER e OPERATOR');
    
    // 2. Verificar se ADMIN e SUPERVISOR têm permissão
    console.log('🔍 Verificando permissões de ADMIN e SUPERVISOR...');
    
    const adminSupervisorPermissions = await pool.request().query(`
      SELECT rp.role, COUNT(*) as count
      FROM RolePermissions rp
      JOIN Permissions p ON rp.permissionId = p.id
      WHERE rp.role IN ('admin', 'supervisor') AND p.name = 'tasks.delete'
      GROUP BY rp.role
    `);
    
    console.log('✅ Permissões verificadas para ADMIN e SUPERVISOR');
    
    // 3. Verificar resultado final
    console.log('\n🔍 Verificando resultado final...');
    
    const finalResult = await pool.request().query(`
      SELECT p.name, rp.role, rp.granted
      FROM Permissions p
      JOIN RolePermissions rp ON p.id = rp.permissionId
      WHERE p.name = 'tasks.delete'
      ORDER BY rp.role
    `);
    
    console.log('\n📊 Quem pode deletar tarefas normais:');
    finalResult.recordset.forEach(perm => {
      const status = perm.granted ? '✅ PODE' : '❌ NÃO PODE';
      console.log(`   ${perm.role}: ${status} deletar tarefas normais`);
    });
    
    // 4. Verificar permissões de tarefas padrão
    console.log('\n📊 Quem pode deletar tarefas padrão:');
    const standardTasksResult = await pool.request().query(`
      SELECT p.name, rp.role, rp.granted
      FROM Permissions p
      JOIN RolePermissions rp ON p.id = rp.permissionId
      WHERE p.name = 'standard-tasks.delete'
      ORDER BY rp.role
    `);
    
    if (standardTasksResult.recordset.length === 0) {
      console.log('   ❌ Nenhuma permissão encontrada para standard-tasks.delete');
    } else {
      standardTasksResult.recordset.forEach(perm => {
        const status = perm.granted ? '✅ PODE' : '❌ NÃO PODE';
        console.log(`   ${perm.role}: ${status} deletar tarefas padrão`);
      });
    }
    
    console.log('\n✅ Correção concluída!');
    console.log('🛡️  Agora as permissões estão corretas:');
    console.log('   - ADMIN: Pode deletar tarefas normais e padrão');
    console.log('   - SUPERVISOR: Pode deletar apenas tarefas normais');
    console.log('   - ENGINEER: NÃO pode deletar tarefas');
    console.log('   - OPERATOR: NÃO pode deletar tarefas');
    console.log('   - VIEWER: NÃO pode deletar tarefas (apenas visualizar)');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir permissões:', error);
  } finally {
    process.exit(0);
  }
}

fixDeletePermissions();
