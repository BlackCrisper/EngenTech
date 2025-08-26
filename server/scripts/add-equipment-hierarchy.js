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
    requestTimeout: 30000,
    connectionTimeout: 30000,
  }
};

async function addEquipmentHierarchy() {
  let pool;
  
  try {
    console.log('🔐 Conectando ao banco de dados...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Conectado com sucesso!');

    // 1. Verificar se os campos já existem
    console.log('\n🔍 Verificando campos de hierarquia...');
    const checkColumns = await pool.request()
      .query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Equipment' AND COLUMN_NAME IN ('parentTag', 'isParent', 'hierarchyLevel')
      `);

    const existingColumns = checkColumns.recordset.map(col => col.COLUMN_NAME);
    console.log('Campos existentes:', existingColumns);

    // 2. Adicionar campos se não existirem
    if (!existingColumns.includes('parentTag')) {
      console.log('\n🔧 Adicionando campo parentTag...');
      await pool.request()
        .query(`
          ALTER TABLE Equipment 
          ADD parentTag NVARCHAR(100) NULL
        `);
      console.log('✅ Campo parentTag adicionado!');
    }

    if (!existingColumns.includes('isParent')) {
      console.log('\n🔧 Adicionando campo isParent...');
      await pool.request()
        .query(`
          ALTER TABLE Equipment 
          ADD isParent BIT DEFAULT 0
        `);
      console.log('✅ Campo isParent adicionado!');
    }

    if (!existingColumns.includes('hierarchyLevel')) {
      console.log('\n🔧 Adicionando campo hierarchyLevel...');
      await pool.request()
        .query(`
          ALTER TABLE Equipment 
          ADD hierarchyLevel INT DEFAULT 0
        `);
      console.log('✅ Campo hierarchyLevel adicionado!');
    }

    // 3. Atualizar equipamentos existentes
    console.log('\n🔄 Atualizando equipamentos existentes...');
    
    // Marcar todos os equipamentos existentes como pais (nível 0)
    await pool.request()
      .query(`
        UPDATE Equipment 
        SET isParent = 1, hierarchyLevel = 0, parentTag = NULL
        WHERE isParent IS NULL OR isParent = 0
      `);
    console.log('✅ Equipamentos existentes marcados como pais');

    // 4. Verificar estrutura da tabela
    console.log('\n📋 Estrutura atual da tabela Equipment:');
    const structure = await pool.request()
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Equipment'
        ORDER BY ORDINAL_POSITION
      `);
    
    console.table(structure.recordset);

    // 5. Verificar equipamentos atualizados
    console.log('\n🏭 Equipamentos após atualização:');
    const equipment = await pool.request()
      .query(`
        SELECT id, tag, type, areaId, isParent, hierarchyLevel, parentTag
        FROM Equipment
        ORDER BY tag
      `);
    
    console.table(equipment.recordset);

    console.log('\n🎉 Migração de hierarquia concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

addEquipmentHierarchy();
