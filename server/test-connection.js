import { getConnection } from './config/database.js';

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com SQL Server...');
    
    const pool = await getConnection();
    
    // Teste 1: Conexão básica
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Teste 2: Verificar tabelas
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📊 Tabelas encontradas:');
    tablesResult.recordset.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
    // Teste 3: Verificar dados de exemplo
    const usersCount = await pool.request().query('SELECT COUNT(*) as count FROM Users');
    const areasCount = await pool.request().query('SELECT COUNT(*) as count FROM Areas');
    const equipmentCount = await pool.request().query('SELECT COUNT(*) as count FROM Equipment');
    const progressCount = await pool.request().query('SELECT COUNT(*) as count FROM Progress');
    
    console.log('\n📈 Dados de exemplo:');
    console.log(`   - Usuários: ${usersCount.recordset[0].count}`);
    console.log(`   - Áreas: ${areasCount.recordset[0].count}`);
    console.log(`   - Equipamentos: ${equipmentCount.recordset[0].count}`);
    console.log(`   - Progresso: ${progressCount.recordset[0].count}`);
    
    // Teste 4: Verificar métricas do dashboard
    const metricsResult = await pool.request().query('SELECT * FROM DashboardMetrics');
    console.log('\n📊 Métricas do dashboard:');
    metricsResult.recordset.forEach(metric => {
      console.log(`   - ${metric.metricName}: ${metric.metricValue} ${metric.metricUnit || ''}`);
    });
    
    // Teste 5: Verificar progresso por área
    const progressByArea = await pool.request().query(`
      SELECT 
        a.name as areaName,
        AVG(p.currentProgress) as averageProgress,
        COUNT(e.id) as equipmentCount
      FROM Areas a
      LEFT JOIN Equipment e ON a.id = e.areaId
      LEFT JOIN Progress p ON e.id = p.equipmentId
      GROUP BY a.id, a.name
      ORDER BY averageProgress DESC
    `);
    
    console.log('\n🏗️ Progresso por área:');
    progressByArea.recordset.forEach(area => {
      console.log(`   - ${area.areaName}: ${Math.round(area.averageProgress || 0)}% (${area.equipmentCount} equip.)`);
    });
    
    console.log('\n🎉 Todos os testes passaram! O sistema está funcionando corretamente.');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    process.exit(1);
  }
}

// Executar teste
testConnection()
  .then(() => {
    console.log('\n✅ Teste de conexão concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no teste:', error);
    process.exit(1);
  });
