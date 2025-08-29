import { getConnection } from '../config/database.js';

async function removeSESMT() {
  try {
    console.log('🗑️  Removendo sistema SESMT completo...');
    
    const pool = await getConnection();
    
    // Lista de tabelas SESMT em ordem de remoção (respeitando foreign keys)
    const sesmtTables = [
      'SESMTActions',
      'SESMTInvestigations', 
      'SESMTOccurrenceComments',
      'SESMTOccurrenceHistory',
      'SESMTOccurrences',
      'SESMTOccurrenceTypes'
    ];

    console.log('🔍 Verificando tabelas SESMT existentes...\n');
    
    for (const table of sesmtTables) {
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

    // Remover índices relacionados ao SESMT
    console.log('\n🔧 Removendo índices SESMT...');
    
    const sesmtIndexes = [
      'IX_SESMTOccurrences_AreaId',
      'IX_SESMTOccurrences_TypeId', 
      'IX_SESMTOccurrences_Status',
      'IX_SESMTOccurrences_Severity',
      'IX_SESMTOccurrences_DateTime',
      'IX_SESMTOccurrences_ReportedBy',
      'IX_SESMTOccurrenceHistory_OccurrenceId',
      'IX_SESMTOccurrenceHistory_UserId',
      'IX_SESMTOccurrenceHistory_CreatedAt',
      'IX_SESMTOccurrenceComments_OccurrenceId',
      'IX_SESMTOccurrenceComments_UserId',
      'IX_SESMTInvestigations_OccurrenceId',
      'IX_SESMTInvestigations_InvestigatorId',
      'IX_SESMTActions_OccurrenceId',
      'IX_SESMTActions_Status',
      'IX_SESMTActions_Deadline'
    ];

    for (const index of sesmtIndexes) {
      try {
        await pool.request().query(`DROP INDEX ${index} ON ${index.split('_')[1]}`);
        console.log(`✅ Índice ${index} removido`);
      } catch (error) {
        // Ignorar erros de índices que não existem
        if (!error.message.includes('does not exist')) {
          console.error(`❌ Erro ao remover índice ${index}:`, error.message);
        }
      }
    }

    console.log('\n✅ Sistema SESMT removido completamente!');
    console.log('📊 Tabelas removidas:');
    sesmtTables.forEach(table => console.log(`   - ${table}`));
    
  } catch (error) {
    console.error('❌ Erro durante a remoção do SESMT:', error);
  } finally {
    process.exit(0);
  }
}

removeSESMT();
