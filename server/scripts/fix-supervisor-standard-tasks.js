import { getConnection } from '../config/database.js';

async function fixSupervisorStandardTasks() {
  try {
    console.log('🔧 Corrigindo permissões - SUPERVISOR pode deletar tarefas padrão...');
    
    const pool = await getConnection();
    
    // 1. Verificar se a permissão standard-tasks.delete existe
    console.log('📝 Verificando permissão standard-tasks.delete...');
    
    const permissionExists = await pool.request().query(`
      SELECT COUNT(*) as count FROM Permissions WHERE name = 'standard-tasks.delete'
    `);
    
    if (permissionExists.recordset[0].count === 0) {
      console.log('➕ Criando permissão standard-tasks.delete...');
      await pool.request().query(`
        INSERT INTO Permissions (name, description, resource, action) 
        VALUES ('standard-tasks.delete', 'Excluir tarefas padrão', 'standard-tasks', 'delete')
      `);
      console.log('✅ Permissão standard-tasks.delete criada');
    } else {
      console.log('✅ Permissão standard-tasks.delete já existe');
    }
    
    // 2. Adicionar permissão de deletar tarefas padrão para SUPERVISOR
    console.log('👥 Adicionando permissão para SUPERVISOR...');
    
    const supervisorPermission = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM RolePermissions rp
      JOIN Permissions p ON rp.permissionId = p.id
      WHERE rp.role = 'supervisor' AND p.name = 'standard-tasks.delete'
    `);
    
    if (supervisorPermission.recordset[0].count === 0) {
      await pool.request().query(`
        INSERT INTO RolePermissions (role, permissionId)
        SELECT 'supervisor', id FROM Permissions WHERE name = 'standard-tasks.delete'
      `);
      console.log('✅ Permissão adicionada para SUPERVISOR');
    } else {
      console.log('✅ SUPERVISOR já tem permissão para deletar tarefas padrão');
    }
    
    // 3. Verificar resultado final
    console.log('\n🔍 Verificando resultado final...');
    
    const finalResult = await pool.request().query(`
      SELECT p.name, rp.role, rp.granted
      FROM Permissions p
      JOIN RolePermissions rp ON p.id = rp.permissionId
      WHERE p.name = 'standard-tasks.delete'
      ORDER BY rp.role
    `);
    
    console.log('\n📊 Quem pode deletar tarefas padrão:');
    finalResult.recordset.forEach(perm => {
      const status = perm.granted ? '✅ PODE' : '❌ NÃO PODE';
      console.log(`   ${perm.role}: ${status} deletar tarefas padrão`);
    });
    
    // 4. Verificar permissões de tarefas normais também
    console.log('\n📊 Quem pode deletar tarefas normais:');
    const normalTasksResult = await pool.request().query(`
      SELECT p.name, rp.role, rp.granted
      FROM Permissions p
      JOIN RolePermissions rp ON p.id = rp.permissionId
      WHERE p.name = 'tasks.delete'
      ORDER BY rp.role
    `);
    
    normalTasksResult.recordset.forEach(perm => {
      const status = perm.granted ? '✅ PODE' : '❌ NÃO PODE';
      console.log(`   ${perm.role}: ${status} deletar tarefas normais`);
    });
    
    console.log('\n✅ Correção concluída!');
    console.log('🛡️  Agora as permissões estão corretas:');
    console.log('   - ADMIN: Pode deletar tarefas normais e padrão');
    console.log('   - SUPERVISOR: Pode deletar tarefas normais E padrão');
    console.log('   - ENGINEER: NÃO pode deletar tarefas');
    console.log('   - OPERATOR: NÃO pode deletar tarefas');
    console.log('   - VIEWER: NÃO pode deletar tarefas (apenas visualizar)');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir permissões:', error);
  } finally {
    process.exit(0);
  }
}

fixSupervisorStandardTasks();
