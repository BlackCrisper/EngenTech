import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const commonPorts = [1433, 1434, 1435, 1436, 1437, 1438, 1439, 1440];

async function testPort(port) {
  const dbConfig = {
    server: 'SRV-ISO01',
    database: 'EngTech',
    user: 'sa',
    password: 'BlackCrisper@2025',
    port: port,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
      requestTimeout: 10000,
      connectionTimeout: 10000,
      connectTimeout: 10000,
      packetSize: 8192,
      useUTC: true,
      abortTransactionOnError: true,
    },
    pool: {
      max: 1,
      min: 0,
      idleTimeoutMillis: 10000
    }
  };

  try {
    console.log(`🔍 Testando porta ${port}...`);
    const pool = await sql.connect(dbConfig);
    console.log(`✅ CONEXÃO BEM-SUCEDIDA na porta ${port}!`);
    
    // Teste básico
    const result = await pool.request().query('SELECT @@SERVERNAME as ServerName, @@VERSION as Version');
    console.log(`📊 Servidor: ${result.recordset[0].ServerName}`);
    console.log(`📊 Versão: ${result.recordset[0].Version.substring(0, 100)}...`);
    
    await pool.close();
    return port;
  } catch (error) {
    console.log(`❌ Porta ${port}: ${error.message}`);
    return null;
  }
}

async function testAllPorts() {
  console.log('🚀 Testando múltiplas portas do SQL Server...\n');
  
  for (const port of commonPorts) {
    const workingPort = await testPort(port);
    if (workingPort) {
      console.log(`\n🎉 PORTA FUNCIONAL ENCONTRADA: ${workingPort}`);
      return workingPort;
    }
  }
  
  console.log('\n❌ Nenhuma porta funcionou. Verifique se o SQL Server está rodando.');
  return null;
}

testAllPorts()
  .then((port) => {
    if (port) {
      console.log(`\n✅ Use a porta ${port} na configuração do banco de dados.`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro:', error);
    process.exit(1);
  });
