import { getConnection, sql } from '../config/database.js';
import { logger } from '../config/logger.js';

async function addSectorColumns() {
  try {
    const pool = await getConnection();
    
    console.log('🔧 Adicionando colunas de setor...\n');
    
    // 1. Verificar se a coluna sector existe na tabela Areas
    console.log('📋 Verificando tabela Areas...');
    const areasColumnsResult = await pool.request()
      .query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Areas' AND COLUMN_NAME = 'sector'
      `);
    
    if (areasColumnsResult.recordset.length === 0) {
      console.log('   - Adicionando coluna sector na tabela Areas...');
      await pool.request()
        .query(`
          ALTER TABLE Areas 
          ADD sector NVARCHAR(50) NULL
        `);
      console.log('   ✅ Coluna sector adicionada na tabela Areas');
    } else {
      console.log('   ✅ Coluna sector já existe na tabela Areas');
    }
    
    // 2. Verificar se a coluna sector existe na tabela Equipment
    console.log('\n📋 Verificando tabela Equipment...');
    const equipmentColumnsResult = await pool.request()
      .query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Equipment' AND COLUMN_NAME = 'sector'
      `);
    
    if (equipmentColumnsResult.recordset.length === 0) {
      console.log('   - Adicionando coluna sector na tabela Equipment...');
      await pool.request()
        .query(`
          ALTER TABLE Equipment 
          ADD sector NVARCHAR(50) NULL
        `);
      console.log('   ✅ Coluna sector adicionada na tabela Equipment');
    } else {
      console.log('   ✅ Coluna sector já existe na tabela Equipment');
    }
    
    // 3. Atualizar setores baseados nas áreas existentes
    console.log('\n🔄 Atualizando setores...');
    
    // Mapear áreas para setores (você pode ajustar conforme necessário)
    const areaSectorMapping = {
      'MOAGEM': 'mechanical',
      'ENSACADEIRA': 'mechanical',
      'ELÉTRICA': 'electrical',
      'INSTRUMENTAÇÃO': 'instrumentation',
      'CIVIL': 'civil',
      'SEGURANÇA': 'safety'
    };
    
    // Atualizar setores nas áreas
    for (const [areaName, sector] of Object.entries(areaSectorMapping)) {
      const updateResult = await pool.request()
        .input('areaName', sql.NVarChar, areaName)
        .input('sector', sql.NVarChar, sector)
        .query(`
          UPDATE Areas 
          SET sector = @sector 
          WHERE name LIKE '%' + @areaName + '%'
        `);
      
      if (updateResult.rowsAffected[0] > 0) {
        console.log(`   - Área "${areaName}" -> Setor: ${sector}`);
      }
    }
    
    // 4. Atualizar setores nos equipamentos baseado na área
    console.log('\n🔧 Atualizando setores nos equipamentos...');
    const equipmentUpdateResult = await pool.request()
      .query(`
        UPDATE Equipment 
        SET sector = a.sector
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        WHERE a.sector IS NOT NULL
      `);
    
    console.log(`   ✅ ${equipmentUpdateResult.rowsAffected[0]} equipamentos atualizados`);
    
    // 5. Verificar resultados
    console.log('\n📊 Verificação final:');
    
    const areasResult = await pool.request()
      .query('SELECT name, sector FROM Areas WHERE sector IS NOT NULL');
    
    console.log('   - Áreas com setor:');
    areasResult.recordset.forEach(area => {
      console.log(`     * ${area.name}: ${area.sector}`);
    });
    
    const equipmentResult = await pool.request()
      .query('SELECT TOP 10 equipmentTag, sector FROM Equipment WHERE sector IS NOT NULL');
    
    console.log('\n   - Equipamentos com setor (primeiros 10):');
    equipmentResult.recordset.forEach(eq => {
      console.log(`     * ${eq.equipmentTag}: ${eq.sector}`);
    });
    
    console.log('\n✅ Colunas de setor configuradas com sucesso!');
    
  } catch (error) {
    logger.error('Erro ao adicionar colunas de setor:', error.message);
    console.error('❌ Erro:', error.message);
  }
}

// Executar o script
addSectorColumns();
