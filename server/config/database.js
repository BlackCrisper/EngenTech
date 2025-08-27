import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  server: process.env.DB_SERVER || 'EngenTech.mssql.somee.com',
  database: process.env.DB_NAME || 'EngenTech',
  user: process.env.DB_USER || 'EngenTech_SQLLogin_1',
  password: process.env.DB_PASSWORD || '2i44vzc9rl',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 15000,
    connectionTimeout: 15000,
    connectTimeout: 15000,
    cancelTimeout: 5000,
    packetSize: 4096,
    useUTC: true,
    abortTransactionOnError: true,
    serverName: 'EngenTech.mssql.somee.com',
    instanceName: '',
    fallbackToDefaultDb: true,
  },
  pool: {
    max: 1,
    min: 0,
    idleTimeoutMillis: 15000
  }
};

let pool;

async function getConnection() {
  try {
    if (!pool) {
      pool = await sql.connect(dbConfig);
      console.log('✅ Conectado ao SQL Server com sucesso!');
    }
    return pool;
  } catch (error) {
    console.error('❌ Erro ao conectar ao SQL Server:', error);
    throw error;
  }
}

async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('🔌 Conexão com SQL Server fechada');
    }
  } catch (error) {
    console.error('❌ Erro ao fechar conexão:', error);
  }
}

export {
  getConnection,
  closeConnection,
  sql
};
