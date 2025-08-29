import { getConnection } from '../config/database.js';

async function cleanupUnused() {
  try {
    console.log('🧹 Iniciando limpeza de dados desnecessários...');
    console.log('⚠️  Sistema SESMT será mantido intacto');
    
    const pool = await getConnection();
    
    // Lista de tabelas que podem ser removidas se não estiverem sendo usadas
    // NÃO incluir tabelas SESMT pois são necessárias
    const tablesToCheck = [
      'DashboardMetrics',
      'Permissions',
      'RolePermissions',
      'AuditLog',
      'StandardTasks',
      'EquipmentTasks',
      'TaskHistory'
    ];

    console.log('🔍 Verificando uso das tabelas...');
    
    for (const table of tablesToCheck) {
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

        // Verificar se há dados na tabela
        const dataCount = await pool.request().query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = dataCount.recordset[0].count;
        
        console.log(`📊 ${table}: ${count} registros`);
        
        // Perguntar se deve remover (simulação - você pode modificar a lógica)
        if (count > 0) {
          console.log(`❓ Deseja remover a tabela ${table} com ${count} registros? (s/n)`);
          // Por segurança, não removemos automaticamente
          // Você pode descomentar as linhas abaixo se quiser remover
          
          /*
          if (shouldRemove) {
            await pool.request().query(`DROP TABLE ${table}`);
            console.log(`✅ Tabela ${table} removida`);
          }
          */
        }
        
      } catch (error) {
        console.error(`❌ Erro ao verificar ${table}:`, error.message);
      }
    }

    // Verificar dados de exemplo que podem ser removidos
    console.log('\n🔍 Verificando dados de exemplo...');
    
    const sampleDataQueries = [
      { table: 'Users', condition: "username IN ('joao.silva', 'maria.santos')", description: 'Usuários de exemplo' },
      { table: 'Areas', condition: "name LIKE '%Produção%' OR name LIKE '%Estação%'", description: 'Áreas de exemplo' },
      { table: 'Equipment', condition: "equipmentTag LIKE 'MOINHO-%' OR equipmentTag LIKE 'ESTEIRA-%'", description: 'Equipamentos de exemplo' },
      { table: 'Progress', condition: "equipmentId IN (1,2,3,4,5)", description: 'Progresso de exemplo' }
    ];

    for (const query of sampleDataQueries) {
      try {
        const count = await pool.request().query(`SELECT COUNT(*) as count FROM ${query.table} WHERE ${query.condition}`);
        const recordCount = count.recordset[0].count;
        
        if (recordCount > 0) {
          console.log(`📊 ${query.description}: ${recordCount} registros`);
          console.log(`❓ Deseja remover ${query.description}? (s/n)`);
          // Por segurança, não removemos automaticamente
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar ${query.table}:`, error.message);
      }
    }

    // Verificar dados SESMT (apenas informativo)
    console.log('\n🔍 Verificando dados SESMT (serão mantidos)...');
    
    const sesmtTables = [
      'SESMTOccurrenceTypes',
      'SESMTOccurrences',
      'SESMTOccurrenceHistory',
      'SESMTOccurrenceComments'
    ];

    for (const table of sesmtTables) {
      try {
        const count = await pool.request().query(`SELECT COUNT(*) as count FROM ${table}`);
        const recordCount = count.recordset[0].count;
        console.log(`📊 ${table}: ${recordCount} registros (SESMT - mantido)`);
      } catch (error) {
        console.error(`❌ Erro ao verificar ${table}:`, error.message);
      }
    }

    console.log('\n✅ Verificação concluída!');
    console.log('💡 Para remover dados específicos, edite este script e descomente as linhas de remoção.');
    console.log('🛡️  Sistema SESMT será mantido intacto.');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    process.exit(0);
  }
}

cleanupUnused();
