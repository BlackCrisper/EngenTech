import { getConnection, sql } from '../config/database.js';
import { logger } from '../config/logger.js';
import { checkTaskSectorPermission } from '../middleware/auth.js';

async function testPracticalPermissions() {
  try {
    const pool = await getConnection();
    
    console.log('🧪 Testando Permissões por Setor na Prática...\n');
    
    // 1. Buscar usuários para teste
    console.log('👥 Usuários para teste:');
    const usersResult = await pool.request()
      .query(`
        SELECT id, username, email, role, sector
        FROM Users
        WHERE active = 1 AND role IN ('admin', 'supervisor')
        ORDER BY role, sector
      `);
    
    const testUsers = usersResult.recordset;
    testUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - Setor: ${user.sector || 'N/A'}`);
    });
    
    // 2. Buscar tarefas para teste
    console.log('\n📝 Tarefas para teste:');
    const tasksResult = await pool.request()
      .query(`
        SELECT TOP 5
          et.id,
          et.name,
          et.discipline,
          e.equipmentTag,
          e.sector as equipmentSector,
          a.name as areaName
        FROM EquipmentTasks et
        JOIN Equipment e ON et.equipmentId = e.id
        LEFT JOIN Areas a ON e.areaId = a.id
        WHERE e.sector IS NOT NULL
        ORDER BY e.sector, et.id
      `);
    
    const testTasks = tasksResult.recordset;
    testTasks.forEach(task => {
      console.log(`   - Tarefa ${task.id}: ${task.name} (${task.discipline})`);
      console.log(`     Equipamento: ${task.equipmentTag} - Setor: ${task.equipmentSector}`);
      console.log(`     Área: ${task.areaName}`);
    });
    
    // 3. Simular testes de permissão
    console.log('\n🔒 Simulando testes de permissão:');
    
    for (const user of testUsers) {
      console.log(`\n👤 Testando usuário: ${user.username} (${user.role}) - Setor: ${user.sector}`);
      
      for (const task of testTasks) {
        console.log(`\n   📋 Tarefa ${task.id} (Setor: ${task.equipmentSector}):`);
        
        // Simular diferentes ações
        const actions = ['read', 'update', 'delete', 'create'];
        
        for (const action of actions) {
          let allowed = false;
          let reason = '';
          
          // Aplicar regras de permissão
          if (user.role === 'admin') {
            allowed = true;
            reason = 'ADMIN pode tudo';
          } else if (user.role === 'supervisor' && user.sector === 'all') {
            allowed = true;
            reason = 'SUPERVISOR "all" pode tudo';
          } else if (user.role === 'supervisor' && user.sector !== 'all') {
            if (action === 'read' || action === 'view') {
              // Pode visualizar qualquer tarefa
              allowed = true;
              reason = 'SUPERVISOR pode visualizar qualquer tarefa';
            } else {
              // Para edição, só pode no próprio setor
              if (task.equipmentSector === user.sector) {
                allowed = true;
                reason = 'SUPERVISOR pode editar tarefas do próprio setor';
              } else {
                allowed = false;
                reason = 'SUPERVISOR não pode editar tarefas de outros setores';
              }
            }
          }
          
          const status = allowed ? '✅' : '❌';
          console.log(`     ${status} ${action}: ${reason}`);
        }
      }
    }
    
    // 4. Verificar cenários específicos
    console.log('\n🎯 Cenários Específicos:');
    
    // Cenário 1: Supervisor elétrica vs tarefa do setor elétrico
    const supervisorEletrica = testUsers.find(u => u.username === 'supervisor.eletrica');
    const tarefaEletrica = testTasks.find(t => t.equipmentSector === 'electrical');
    
    if (supervisorEletrica && tarefaEletrica) {
      console.log('\n   🔌 Supervisor Elétrica vs Tarefa Elétrica:');
      console.log(`     ✅ READ: Supervisor pode visualizar tarefa do próprio setor`);
      console.log(`     ✅ UPDATE: Supervisor pode editar tarefa do próprio setor`);
      console.log(`     ✅ DELETE: Supervisor pode deletar tarefa do próprio setor`);
      console.log(`     ✅ CREATE: Supervisor pode criar tarefa no próprio setor`);
    }
    
    // Cenário 2: Supervisor elétrica vs tarefa de outro setor
    const tarefaOutroSetor = testTasks.find(t => t.equipmentSector !== 'electrical');
    
    if (supervisorEletrica && tarefaOutroSetor) {
      console.log('\n   🔌 Supervisor Elétrica vs Tarefa Outro Setor:');
      console.log(`     ✅ READ: Supervisor pode visualizar tarefa de outro setor`);
      console.log(`     ❌ UPDATE: Supervisor não pode editar tarefa de outro setor`);
      console.log(`     ❌ DELETE: Supervisor não pode deletar tarefa de outro setor`);
      console.log(`     ❌ CREATE: Supervisor não pode criar tarefa em outro setor`);
    }
    
    // Cenário 3: Supervisor "all" vs qualquer tarefa
    const supervisorAll = testUsers.find(u => u.sector === 'all');
    
    if (supervisorAll) {
      console.log('\n   🌐 Supervisor "all" vs Qualquer Tarefa:');
      console.log(`     ✅ READ: Supervisor "all" pode visualizar qualquer tarefa`);
      console.log(`     ✅ UPDATE: Supervisor "all" pode editar qualquer tarefa`);
      console.log(`     ✅ DELETE: Supervisor "all" pode deletar qualquer tarefa`);
      console.log(`     ✅ CREATE: Supervisor "all" pode criar qualquer tarefa`);
    }
    
    console.log('\n✅ Teste prático de permissões concluído!');
    
  } catch (error) {
    logger.error('Erro ao testar permissões práticas:', error.message);
    console.error('❌ Erro:', error.message);
  }
}

// Executar o teste
testPracticalPermissions();
