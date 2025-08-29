import { getConnection, sql } from '../config/database.js';
import { logger } from '../config/logger.js';

async function testSectorPermissions() {
  try {
    const pool = await getConnection();
    
    console.log('🧪 Testando Permissões por Setor...\n');
    
    // 1. Verificar usuários e seus setores
    console.log('📋 Usuários e Setores:');
    const usersResult = await pool.request()
      .query(`
        SELECT id, username, email, role, sector, active
        FROM Users
        WHERE active = 1
        ORDER BY role, sector
      `);
    
    usersResult.recordset.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - Setor: ${user.sector || 'N/A'}`);
    });
    
    console.log('\n📊 Resumo por Setor:');
    const sectorSummary = {};
    usersResult.recordset.forEach(user => {
      const sector = user.sector || 'N/A';
      if (!sectorSummary[sector]) {
        sectorSummary[sector] = { total: 0, roles: {} };
      }
      sectorSummary[sector].total++;
      if (!sectorSummary[sector].roles[user.role]) {
        sectorSummary[sector].roles[user.role] = 0;
      }
      sectorSummary[sector].roles[user.role]++;
    });
    
    Object.entries(sectorSummary).forEach(([sector, data]) => {
      console.log(`   - ${sector}: ${data.total} usuários`);
      Object.entries(data.roles).forEach(([role, count]) => {
        console.log(`     * ${role}: ${count}`);
      });
    });
    
    // 2. Verificar equipamentos por setor
    console.log('\n🔧 Equipamentos por Setor:');
    const equipmentResult = await pool.request()
      .query(`
        SELECT sector, COUNT(*) as count
        FROM Equipment
        GROUP BY sector
        ORDER BY sector
      `);
    
    equipmentResult.recordset.forEach(eq => {
      console.log(`   - ${eq.sector || 'N/A'}: ${eq.count} equipamentos`);
    });
    
    // 3. Verificar tarefas por setor
    console.log('\n📝 Tarefas por Setor:');
    const tasksResult = await pool.request()
      .query(`
        SELECT e.sector, COUNT(*) as count
        FROM EquipmentTasks et
        JOIN Equipment e ON et.equipmentId = e.id
        GROUP BY e.sector
        ORDER BY e.sector
      `);
    
    tasksResult.recordset.forEach(task => {
      console.log(`   - ${task.sector || 'N/A'}: ${task.count} tarefas`);
    });
    
    // 4. Testar regras de permissão
    console.log('\n🔒 Regras de Permissão Implementadas:');
    console.log('   ✅ ADMIN: Pode tudo');
    console.log('   ✅ SUPERVISOR "all": Pode tudo (limitado ao projeto)');
    console.log('   ❌ SUPERVISOR setor específico: NÃO pode editar próprio setor');
    console.log('   ✅ SUPERVISOR setor específico: Pode visualizar outros setores');
    console.log('   ❌ SUPERVISOR setor específico: NÃO pode editar outros setores');
    
    // 5. Verificar permissões configuradas
    console.log('\n⚙️ Permissões Configuradas:');
    const permissionsResult = await pool.request()
      .query(`
        SELECT p.resource, p.action, rp.role, rp.granted
        FROM Permissions p
        JOIN RolePermissions rp ON p.id = rp.permissionId
        WHERE p.resource IN ('tasks', 'standard-tasks', 'task-history')
        ORDER BY p.resource, p.action, rp.role
      `);
    
    const permissionsByResource = {};
    permissionsResult.recordset.forEach(perm => {
      if (!permissionsByResource[perm.resource]) {
        permissionsByResource[perm.resource] = {};
      }
      if (!permissionsByResource[perm.resource][perm.action]) {
        permissionsByResource[perm.resource][perm.action] = [];
      }
      permissionsByResource[perm.resource][perm.action].push({
        role: perm.role,
        granted: perm.granted
      });
    });
    
    Object.entries(permissionsByResource).forEach(([resource, actions]) => {
      console.log(`   - ${resource}:`);
      Object.entries(actions).forEach(([action, roles]) => {
        const grantedRoles = roles.filter(r => r.granted).map(r => r.role);
        const deniedRoles = roles.filter(r => !r.granted).map(r => r.role);
        console.log(`     * ${action}: ${grantedRoles.join(', ')} ${deniedRoles.length > 0 ? `(negado: ${deniedRoles.join(', ')})` : ''}`);
      });
    });
    
    console.log('\n✅ Teste de permissões por setor concluído!');
    
  } catch (error) {
    logger.error('Erro ao testar permissões por setor:', error.message);
    console.error('❌ Erro:', error.message);
  }
}

// Executar o teste
testSectorPermissions();
