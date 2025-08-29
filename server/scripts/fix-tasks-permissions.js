import { getConnection } from '../config/database.js';
import fs from 'fs';
import path from 'path';

async function fixTasksPermissions() {
  try {
    console.log('🔧 Corrigindo permissões de tarefas...');
    
    const pool = await getConnection();
    
    // Ler o script SQL
    const sqlPath = path.join(process.cwd(), 'server/scripts/fix-tasks-permissions.sql');
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
        console.error(`❌ Erro no comando ${i + 1}/${commands.length}:`, error.message);
      }
    }

    // Verificar se as permissões foram aplicadas corretamente
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
    if (deleteStandardTasksCheck.recordset.length === 0) {
      console.log('   ❌ Nenhuma permissão encontrada para deletar tarefas padrão');
    } else {
      deleteStandardTasksCheck.recordset.forEach(perm => {
        const status = perm.granted ? '✅ PODE' : '❌ NÃO PODE';
        console.log(`   ${perm.role}: ${status} deletar tarefas padrão`);
      });
    }

    // Verificar permissões de deletar tarefas normais
    console.log('\n🔍 Verificando permissões de deletar tarefas normais...');
    
    const deleteTasksCheck = await pool.request().query(`
      SELECT 
        p.name,
        rp.role,
        rp.granted
      FROM Permissions p
      JOIN RolePermissions rp ON p.id = rp.permissionId
      WHERE p.name = 'tasks.delete'
      ORDER BY rp.role
    `);

    console.log('\n📊 Quem pode deletar tarefas normais:');
    if (deleteTasksCheck.recordset.length === 0) {
      console.log('   ❌ Nenhuma permissão encontrada para deletar tarefas');
    } else {
      deleteTasksCheck.recordset.forEach(perm => {
        const status = perm.granted ? '✅ PODE' : '❌ NÃO PODE';
        console.log(`   ${perm.role}: ${status} deletar tarefas`);
      });
    }

    console.log('\n✅ Permissões de tarefas corrigidas com sucesso!');
    console.log('🛡️  Agora o sistema de permissões está funcionando corretamente.');
    console.log('\n📋 Resumo do comportamento:');
    console.log('   - Tarefas padrão: Apenas ADMIN pode deletar');
    console.log('   - Tarefas normais: ADMIN, SUPERVISOR, ENGINEER podem deletar');
    console.log('   - Tarefas com progresso: Ninguém pode deletar');
    console.log('   - Tarefas com histórico: Ninguém pode deletar');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir permissões de tarefas:', error);
  } finally {
    process.exit(0);
  }
}

fixTasksPermissions();
