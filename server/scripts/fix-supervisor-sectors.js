import { getConnection, sql } from '../config/database.js';
import { logger } from '../config/logger.js';

async function fixSupervisorSectors() {
  try {
    const pool = await getConnection();
    
    console.log('🔧 Corrigindo setores dos supervisores...\n');
    
    // 1. Verificar supervisores atuais
    console.log('📋 Supervisores atuais:');
    const supervisorsResult = await pool.request()
      .query(`
        SELECT id, username, email, role, sector
        FROM Users
        WHERE role = 'supervisor' AND active = 1
        ORDER BY username
      `);
    
    supervisorsResult.recordset.forEach(sup => {
      console.log(`   - ${sup.username}: ${sup.sector || 'N/A'}`);
    });
    
    // 2. Corrigir setores baseado no nome do usuário
    console.log('\n🔄 Corrigindo setores...');
    
    const sectorMappings = [
      { username: 'supervisor.eletrica', sector: 'electrical' },
      { username: 'supervisor.mecanica', sector: 'mechanical' },
      { username: 'supervisor.instrumentacao', sector: 'instrumentation' },
      { username: 'supervisor.civil', sector: 'civil' },
      { username: 'supervisor.seguranca', sector: 'safety' }
    ];
    
    for (const mapping of sectorMappings) {
      const updateResult = await pool.request()
        .input('username', sql.NVarChar, mapping.username)
        .input('sector', sql.NVarChar, mapping.sector)
        .query(`
          UPDATE Users 
          SET sector = @sector 
          WHERE username = @username AND role = 'supervisor'
        `);
      
      if (updateResult.rowsAffected[0] > 0) {
        console.log(`   ✅ ${mapping.username} -> Setor: ${mapping.sector}`);
      } else {
        console.log(`   ⚠️ ${mapping.username} não encontrado`);
      }
    }
    
    // 3. Manter supervisor "all" para supervisores gerais
    const generalSupervisors = ['supervisor', 'supervisor.geral', 'supervisor.all'];
    
    for (const username of generalSupervisors) {
      const updateResult = await pool.request()
        .input('username', sql.NVarChar, username)
        .query(`
          UPDATE Users 
          SET sector = 'all' 
          WHERE username = @username AND role = 'supervisor'
        `);
      
      if (updateResult.rowsAffected[0] > 0) {
        console.log(`   ✅ ${username} -> Setor: all (supervisor geral)`);
      }
    }
    
    // 4. Verificar resultado final
    console.log('\n📊 Supervisores após correção:');
    const finalResult = await pool.request()
      .query(`
        SELECT id, username, email, role, sector
        FROM Users
        WHERE role = 'supervisor' AND active = 1
        ORDER BY sector, username
      `);
    
    finalResult.recordset.forEach(sup => {
      console.log(`   - ${sup.username}: ${sup.sector || 'N/A'}`);
    });
    
    // 5. Resumo por setor
    console.log('\n📈 Resumo por setor:');
    const sectorSummary = {};
    finalResult.recordset.forEach(sup => {
      const sector = sup.sector || 'N/A';
      if (!sectorSummary[sector]) {
        sectorSummary[sector] = [];
      }
      sectorSummary[sector].push(sup.username);
    });
    
    Object.entries(sectorSummary).forEach(([sector, users]) => {
      console.log(`   - ${sector}: ${users.join(', ')}`);
    });
    
    console.log('\n✅ Setores dos supervisores corrigidos!');
    
  } catch (error) {
    logger.error('Erro ao corrigir setores dos supervisores:', error.message);
    console.error('❌ Erro:', error.message);
  }
}

// Executar o script
fixSupervisorSectors();
