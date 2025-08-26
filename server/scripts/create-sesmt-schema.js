import { getConnection } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createSESMTSchema() {
  try {
    console.log('🔧 Criando schema SESMT...');
    const pool = await getConnection();
    const sqlPath = path.join(__dirname, 'sesmt-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Separar comandos por tipo
    const lines = sqlContent.split('\n');
    const createTableCommands = [];
    const indexCommands = [];
    const insertCommands = [];
    const otherCommands = [];
    
    let currentCommand = '';
    let inCreateTable = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Pular comentários e linhas vazias
      if (trimmedLine.startsWith('--') || trimmedLine === '' || trimmedLine.startsWith('PRINT')) {
        continue;
      }
      
      currentCommand += line + '\n';
      
      // Detectar início de CREATE TABLE
      if (trimmedLine.toUpperCase().startsWith('CREATE TABLE')) {
        inCreateTable = true;
      }
      
      // Detectar fim de comando (ponto e vírgula)
      if (trimmedLine.endsWith(';')) {
        const command = currentCommand.trim();
        currentCommand = '';
        
        if (inCreateTable) {
          createTableCommands.push(command);
          inCreateTable = false;
        } else if (command.toUpperCase().startsWith('CREATE INDEX')) {
          indexCommands.push(command);
        } else if (command.toUpperCase().startsWith('INSERT INTO')) {
          insertCommands.push(command);
        } else {
          otherCommands.push(command);
        }
      }
    }
    
    console.log(`📝 Executando ${createTableCommands.length} comandos CREATE TABLE...`);
    for (let i = 0; i < createTableCommands.length; i++) {
      const command = createTableCommands[i];
      try {
        await pool.request().query(command);
        console.log(`  ✅ Tabela ${i + 1} criada com sucesso`);
      } catch (error) {
        if (error.message.includes('There is already an object named')) {
          console.log(`  ⚠️  Tabela já existe, pulando`);
        } else {
          console.error(`  ❌ Erro ao criar tabela ${i + 1}:`, error.message);
        }
      }
    }
    
    console.log(`📝 Executando ${indexCommands.length} comandos CREATE INDEX...`);
    for (let i = 0; i < indexCommands.length; i++) {
      const command = indexCommands[i];
      try {
        await pool.request().query(command);
        console.log(`  ✅ Índice ${i + 1} criado com sucesso`);
      } catch (error) {
        if (error.message.includes('There is already an object named')) {
          console.log(`  ⚠️  Índice já existe, pulando`);
        } else {
          console.error(`  ❌ Erro ao criar índice ${i + 1}:`, error.message);
        }
      }
    }
    
    console.log(`📝 Executando ${insertCommands.length} comandos INSERT...`);
    for (let i = 0; i < insertCommands.length; i++) {
      const command = insertCommands[i];
      try {
        await pool.request().query(command);
        console.log(`  ✅ Dados ${i + 1} inseridos com sucesso`);
      } catch (error) {
        console.error(`  ❌ Erro ao inserir dados ${i + 1}:`, error.message);
      }
    }

    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    const tables = ['SESMTOccurrenceTypes', 'SESMTOccurrences', 'SESMTOccurrenceHistory', 'SESMTOccurrenceComments'];
    
    for (const table of tables) {
      try {
        const result = await pool.request().query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result.recordset[0].count;
        console.log(`  ✅ ${table}: ${count} registros`);
      } catch (error) {
        console.error(`  ❌ Erro ao verificar ${table}:`, error.message);
      }
    }

    console.log('\n✅ Schema SESMT criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar schema SESMT:', error);
  }
}

createSESMTSchema();
