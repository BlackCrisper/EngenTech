import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  server: process.env.DB_SERVER || 'SRV-ISO01\\SQLBC',
  database: process.env.DB_NAME || 'EngTech',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'BlackCrisper@2025',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000,
    connectTimeout: 30000,
    cancelTimeout: 5000,
    packetSize: 4096,
    useUTC: true,
    abortTransactionOnError: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
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
