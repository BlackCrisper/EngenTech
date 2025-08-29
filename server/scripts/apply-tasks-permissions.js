import { getConnection } from '../config/database.js';
import fs from 'fs';
import path from 'path';

async function applyTasksPermissions() {
  try {
    console.log('🔐 Aplicando permissões de tarefas...');
    
    const pool = await getConnection();
    
    // Ler o script SQL
    const sqlPath = path.join(process.cwd(), 'server/scripts/add-tasks-permissions.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir o script em comandos
    const commands = sqlContent
      .split(/\bGO\b/i)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('PRINT'));

    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      try {
        console.log(`🔧 Executando comando ${i + 1}/${commands.length}...`);
        await pool.request().query(command);
        console.log(`✅ Comando ${i + 1}/${commands.length} executado com sucesso`);
      } catch (error) {
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
          console.log(`⚠️  Comando ${i + 1}/${commands.length} já foi executado anteriormente`);
        } else {
          console.error(`❌ Erro no comando ${i + 1}/${commands.length}:`, error.message);
        }
      }
    }

    // Verificar se as permissões foram aplicadas
    console.log('\n🔍 Verificando permissões aplicadas...');
    
    const permissionsCheck = await pool.request().query(`
      SELECT 
        p.name,
        p.resource,
        p.action,
        rp.role,
        rp.granted
      FROM Permissions p
      JOIN RolePermissions rp ON p.id = rp.permissionId
      WHERE p.resource IN ('tasks', 'standard-tasks')
      ORDER BY p.resource, p.action, rp.role
    `);

    console.log('\n📊 Permissões de tarefas configuradas:');
    permissionsCheck.recordset.forEach(perm => {
      console.log(`   ${perm.role}: ${perm.resource}.${perm.action} (${perm.granted ? 'permitido' : 'negado'})`);
    });

    // Verificar especificamente as permissões de deletar tarefas padrão
    console.log('\n🔍 Verificando permissões de deletar tarefas padrão...');
    
    const deleteStandardTasksCheck = await pool.request().query(`
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
    deleteStandardTasksCheck.recordset.forEach(perm => {
      const status = perm.granted ? '✅ PODE' : '❌ NÃO PODE';
      console.log(`   ${perm.role}: ${status} deletar tarefas padrão`);
    });

    console.log('\n✅ Permissões de tarefas aplicadas com sucesso!');
    console.log('🛡️  Agora o sistema de permissões está funcionando corretamente para tarefas.');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar permissões de tarefas:', error);
  } finally {
    process.exit(0);
  }
}

applyTasksPermissions();
