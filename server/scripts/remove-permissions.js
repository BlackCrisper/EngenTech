import { getConnection } from '../config/database.js';

async function removePermissions() {
  try {
    console.log('🗑️  Removendo sistema de permissões...');
    
    const pool = await getConnection();
    
    // Lista de tabelas de permissões em ordem de remoção
    const permissionTables = [
      'AuditLog',
      'RolePermissions',
      'Permissions'
    ];

    console.log('🔍 Verificando tabelas de permissões existentes...\n');
    
    for (const table of permissionTables) {
      try {
        // Verificar se a tabela existe
        const tableExists = await pool.request().query(`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = '${table}'
        `);
        
        if (tableExists.recordset[0].count === 0) {
          console.log(`⚠️  Tabela ${table} não existe, pulando...`);
          continue;
        }

        // Verificar quantos registros há na tabela
        const countQuery = await pool.request().query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countQuery.recordset[0].count;
        
        console.log(`📊 ${table}: ${count} registros encontrados`);
        
        if (count > 0) {
          console.log(`🗑️  Removendo dados da tabela ${table}...`);
          await pool.request().query(`DELETE FROM ${table}`);
          console.log(`✅ Dados da tabela ${table} removidos`);
        }
        
        // Remover a tabela
        console.log(`🗑️  Removendo tabela ${table}...`);
        await pool.request().query(`DROP TABLE ${table}`);
        console.log(`✅ Tabela ${table} removida com sucesso!`);
        
      } catch (error) {
        console.error(`❌ Erro ao remover ${table}:`, error.message);
      }
    }

    console.log('\n✅ Sistema de permissões removido completamente!');
    console.log('📊 Tabelas removidas:');
    permissionTables.forEach(table => console.log(`   - ${table}`));
    console.log('\n⚠️  ATENÇÃO: Sem o sistema de permissões, todos os usuários terão acesso total ao sistema.');
    
  } catch (error) {
    console.error('❌ Erro durante a remoção do sistema de permissões:', error);
  } finally {
    process.exit(0);
  }
}

removePermissions();
