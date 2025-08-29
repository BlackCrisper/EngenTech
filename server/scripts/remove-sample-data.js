import { getConnection } from '../config/database.js';

async function removeSampleData() {
  try {
    console.log('🧹 Removendo dados de exemplo do banco...');
    console.log('⚠️  Sistema SESMT será mantido intacto');
    
    const pool = await getConnection();
    
    // Lista de remoções em ordem (respeitando foreign keys)
    // NÃO incluir tabelas SESMT pois são necessárias
    const removals = [
      {
        table: 'TaskHistory',
        condition: '1=1', // Remove todos os históricos de exemplo
        description: 'Histórico de tarefas de exemplo'
      },
      {
        table: 'EquipmentTasks', 
        condition: '1=1', // Remove todas as tarefas de exemplo
        description: 'Tarefas de equipamentos de exemplo'
      },
      {
        table: 'StandardTasks',
        condition: '1=1', // Remove todas as tarefas padrão de exemplo
        description: 'Tarefas padrão de exemplo'
      },
      {
        table: 'ProgressHistory',
        condition: '1=1', // Remove todo o histórico de progresso de exemplo
        description: 'Histórico de progresso de exemplo'
      },
      {
        table: 'Progress',
        condition: 'equipmentId IN (1,2,3,4,5)', // Remove progresso dos equipamentos de exemplo
        description: 'Progresso de equipamentos de exemplo'
      },
      {
        table: 'Equipment',
        condition: "equipmentTag IN ('MOINHO-01', 'MOINHO-02', 'ESTEIRA-01', 'ESTEIRA-02', 'BOMBA-HIDR-01', 'BOMBA-HIDR-02', 'BOMBA-HIDR-03', 'COMPRESSOR-01', 'COMPRESSOR-02', 'TRANSFORMADOR-01', 'SILO-01', 'SILO-02', 'FORNO-01')",
        description: 'Equipamentos de exemplo'
      },
      {
        table: 'Areas',
        condition: "name IN ('Área de Produção A', 'Área de Produção B', 'Estação de Ensacamento', 'Laboratório de Qualidade', 'Área de Armazenamento', 'Subestação Elétrica', 'Sistema de Água', 'Sistema de Ar Comprimido')",
        description: 'Áreas de exemplo'
      },
      {
        table: 'Users',
        condition: "username IN ('joao.silva', 'maria.santos')",
        description: 'Usuários de exemplo (exceto admin)'
      },
      {
        table: 'DashboardMetrics',
        condition: '1=1', // Remove todas as métricas de exemplo
        description: 'Métricas do dashboard de exemplo'
      }
    ];

    console.log('🗑️  Iniciando remoção de dados de exemplo...\n');
    
    for (const removal of removals) {
      try {
        // Verificar se há dados para remover
        const countQuery = await pool.request().query(`SELECT COUNT(*) as count FROM ${removal.table} WHERE ${removal.condition}`);
        const count = countQuery.recordset[0].count;
        
        if (count === 0) {
          console.log(`⚠️  ${removal.description}: Nenhum registro encontrado`);
          continue;
        }
        
        console.log(`🗑️  Removendo ${removal.description}... (${count} registros)`);
        
        // Executar a remoção
        await pool.request().query(`DELETE FROM ${removal.table} WHERE ${removal.condition}`);
        
        console.log(`✅ ${removal.description} removido com sucesso!`);
        
      } catch (error) {
        console.error(`❌ Erro ao remover ${removal.description}:`, error.message);
      }
    }

    // Verificar dados SESMT (apenas informativo, não remove)
    console.log('\n🔍 Verificando dados SESMT (serão mantidos)...');
    
    const sesmtTables = [
      'SESMTOccurrenceTypes',
      'SESMTOccurrences',
      'SESMTOccurrenceHistory',
      'SESMTOccurrenceComments'
    ];

    for (const table of sesmtTables) {
      try {
        const countQuery = await pool.request().query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countQuery.recordset[0].count;
        console.log(`📊 ${table}: ${count} registros (mantidos)`);
      } catch (error) {
        console.error(`❌ Erro ao verificar ${table}:`, error.message);
      }
    }

    // Remover colunas de hierarquia se não estiverem sendo usadas
    console.log('\n🔧 Verificando colunas de hierarquia...');
    
    try {
      // Verificar se há equipamentos com hierarquia
      const hierarchyCount = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM Equipment 
        WHERE parentId IS NOT NULL OR equipmentType != 'child'
      `);
      
      if (hierarchyCount.recordset[0].count === 0) {
        console.log('⚠️  Nenhum equipamento com hierarquia encontrado');
        console.log('💡 Você pode remover as colunas de hierarquia se não precisar delas');
        console.log('   - parentId');
        console.log('   - equipmentType'); 
        console.log('   - hierarchyLevel');
      } else {
        console.log(`📊 ${hierarchyCount.recordset[0].count} equipamentos com hierarquia encontrados`);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar hierarquia:', error.message);
    }

    console.log('\n✅ Limpeza de dados de exemplo concluída!');
    console.log('📊 Banco de dados limpo e pronto para uso.');
    console.log('🛡️  Sistema SESMT mantido intacto.');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    process.exit(0);
  }
}

removeSampleData();
