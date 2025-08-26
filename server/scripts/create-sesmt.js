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
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'sesmt-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('PRINT'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          await pool.request().query(command);
          console.log(`  ✅ Comando ${i + 1} executado com sucesso`);
        } catch (error) {
          // Se a tabela já existe, continuar
          if (error.message.includes('There is already an object named')) {
            console.log(`  ⚠️  Tabela já existe, pulando comando ${i + 1}`);
          } else {
            console.error(`  ❌ Erro no comando ${i + 1}:`, error.message);
          }
        }
      }
    }
    
    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    
    const tables = [
      'SESMTOccurrenceTypes',
      'SESMTOccurrences', 
      'SESMTOccurrenceHistory',
      'SESMTOccurrenceComments',
      'SESMTInvestigations',
      'SESMTActions'
    ];
    
    for (const table of tables) {
      try {
        const result = await pool.request().query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ✅ Tabela ${table}: ${result.recordset[0].count} registros`);
      } catch (error) {
        console.log(`  ❌ Tabela ${table}: Não encontrada`);
      }
    }
    
    console.log('\n✅ Schema SESMT criado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar schema SESMT:', error);
  }
}

createSESMTSchema();
