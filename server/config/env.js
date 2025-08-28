// Configurações de ambiente
export const config = {
  // Configurações do SQL Server
  DB_SERVER: process.env.DB_SERVER || 'EngenTech.mssql.somee.com',
  DB_DATABASE: process.env.DB_DATABASE || 'EngenTech',
  DB_USER: process.env.DB_USER || 'EngenTech_SQLLogin_1',
  DB_PASSWORD: process.env.DB_PASSWORD || '2i44vzc9rl',
  DB_PORT: process.env.DB_PORT || 1433,

  // Configurações do JWT
  JWT_SECRET: process.env.JWT_SECRET || 'enginsync-super-secret-key-2024-mizu-cimentos',

  // Configurações do servidor
  PORT: process.env.PORT || 3010,
  NODE_ENV: process.env.NODE_ENV || 'development'
};
