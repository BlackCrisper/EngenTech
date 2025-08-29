import { getConnection } from '../config/database.js';

async function fixEngineerPermissions() {
  try {
    console.log('🔧 Corrigindo permissões do engenheiro...');
    
    const pool = await getConnection();
    
    // 1. Remover permissão de deletar tarefas do viewer (não deveria ter)
    console.log('🗑️  Removendo permissão de deletar tarefas do viewer...');
    
    await pool.request().query(`
      DELETE FROM RolePermissions 
      WHERE role = 'viewer' 
      AND permissionId IN (
        SELECT id FROM Permissions WHERE name = 'tasks.delete'
      )
    `);
    
    console.log('✅ Permissão removida do viewer');
    
    // 2. Verificar se engineer tem permissão para deletar tarefas
    console.log('🔍 Verificando permissão do engineer...');
    
    const engineerPermission = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM RolePermissions rp
      JOIN Permissions p ON rp.permissionId = p.id
      WHERE rp.role = 'engineer' AND p.name = 'tasks.delete'
    `);
    
    if (engineerPermission.recordset[0].count === 0) {
      console.log('➕ Adicionando permissão de deletar tarefas para engineer...');
      
      await pool.request().query(`
        INSERT INTO RolePermissions (role, permissionId)
        SELECT 'engineer', id FROM Permissions WHERE name = 'tasks.delete'
      `);
      
      console.log('✅ Permissão adicionada para engineer');
    } else {
      console.log('✅ Engineer já tem permissão para deletar tarefas');
    }
    
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
    
    console.log('\n✅ Correção concluída!');
    console.log('🛡️  Agora as permissões estão corretas:');
    console.log('   - ADMIN: Pode deletar tarefas normais e padrão');
    console.log('   - SUPERVISOR: Pode deletar apenas tarefas normais');
    console.log('   - ENGINEER: Pode deletar apenas tarefas normais');
    console.log('   - OPERATOR: Pode deletar apenas tarefas normais');
    console.log('   - VIEWER: NÃO pode deletar tarefas (apenas visualizar)');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir permissões:', error);
  } finally {
    process.exit(0);
  }
}

fixEngineerPermissions();
