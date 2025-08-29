import { getConnection } from '../config/database.js';

async function fixPermissionsSimple() {
  try {
    console.log('🔧 Corrigindo permissões de tarefas padrão...');
    
    const pool = await getConnection();
    
    // 1. Inserir permissão de deletar tarefas padrão se não existir
    console.log('📝 Verificando permissão standard-tasks.delete...');
    
    const permissionExists = await pool.request().query(`
      SELECT COUNT(*) as count FROM Permissions WHERE name = 'standard-tasks.delete'
    `);
    
    if (permissionExists.recordset[0].count === 0) {
      console.log('➕ Inserindo permissão standard-tasks.delete...');
      await pool.request().query(`
        INSERT INTO Permissions (name, description, resource, action) 
        VALUES ('standard-tasks.delete', 'Excluir tarefas padrão', 'standard-tasks', 'delete')
      `);
      console.log('✅ Permissão standard-tasks.delete inserida');
    } else {
      console.log('✅ Permissão standard-tasks.delete já existe');
    }
    
    // 2. Remover permissão de deletar tarefas padrão de todos os roles
    console.log('🗑️  Removendo permissão de deletar tarefas padrão de todos os roles...');
    
    await pool.request().query(`
      DELETE FROM RolePermissions 
      WHERE permissionId IN (
        SELECT id FROM Permissions WHERE name = 'standard-tasks.delete'
      )
    `);
    
    console.log('✅ Permissões removidas de todos os roles');
    
    // 3. Adicionar permissão apenas para admin
    console.log('👑 Adicionando permissão apenas para admin...');
    
    await pool.request().query(`
      INSERT INTO RolePermissions (role, permissionId)
      SELECT 'admin', id FROM Permissions WHERE name = 'standard-tasks.delete'
    `);
    
    console.log('✅ Permissão adicionada apenas para admin');
    
    // 4. Verificar resultado
    console.log('\n🔍 Verificando resultado...');
    
    const result = await pool.request().query(`
      SELECT 
        p.name,
        rp.role,
        rp.granted
      FROM Permissions p
      JOIN RolePermissions rp ON p.id = rp.permissionId
      WHERE p.name = 'standard-tasks.delete'
      ORDER BY rp.role
    `);
    
    console.log('\n📊 Quem pode deletar tarefas padrão:');
    if (result.recordset.length === 0) {
      console.log('   ❌ Nenhuma permissão encontrada');
    } else {
      result.recordset.forEach(perm => {
        const status = perm.granted ? '✅ PODE' : '❌ NÃO PODE';
        console.log(`   ${perm.role}: ${status} deletar tarefas padrão`);
      });
    }
    
    console.log('\n✅ Correção concluída!');
    console.log('🛡️  Agora apenas ADMIN pode deletar tarefas padrão.');
    console.log('📋 Comportamento do sistema:');
    console.log('   - Tarefas padrão: Apenas ADMIN pode deletar');
    console.log('   - Tarefas normais: ADMIN, SUPERVISOR, ENGINEER podem deletar');
    console.log('   - Tarefas com progresso: Ninguém pode deletar');
    console.log('   - Tarefas com histórico: Ninguém pode deletar');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir permissões:', error);
  } finally {
    process.exit(0);
  }
}

fixPermissionsSimple();
