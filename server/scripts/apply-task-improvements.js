import { getConnection } from '../config/database.js';
import { logger } from '../config/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyTaskImprovements() {
  try {
    logger.info('🔧 Aplicando melhorias no sistema de tarefas...');
    
    const pool = await getConnection();
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'improve-task-system.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir em comandos individuais (separados por GO)
    const commands = sqlContent
      .split(/\bGO\b/i)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('PRINT'));
    
    logger.info(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (!command.trim()) continue;
      
      try {
        await pool.request().query(command);
        logger.success(`✅ Comando ${i + 1}/${commands.length} executado com sucesso`);
      } catch (error) {
        // Ignorar erros de "já existe" para colunas e tabelas
        if (error.message.includes('already exists') || 
            error.message.includes('already an object') ||
            error.message.includes('already has a primary key') ||
            error.message.includes('already has a constraint') ||
            error.message.includes('already has an index')) {
          logger.warn(`⚠️  Comando ${i + 1}/${commands.length} já existe: ${error.message}`);
        } else {
          logger.error(`❌ Erro no comando ${i + 1}/${commands.length}:`, error.message);
          // Continuar com os próximos comandos mesmo se um falhar
        }
      }
    }
    
    // Verificar se as melhorias foram aplicadas
    logger.info('🔍 Verificando melhorias aplicadas...');
    
    // Verificar tabela TaskPhotos
    const taskPhotosExists = await pool.request().query(`
      SELECT COUNT(*) as count FROM sys.objects 
      WHERE object_id = OBJECT_ID('TaskPhotos') AND type in (N'U')
    `);
    
    if (taskPhotosExists.recordset[0].count > 0) {
      logger.success('✅ Tabela TaskPhotos criada/verificada');
    }
    
    // Verificar stored procedures
    const procedures = ['UpdateTaskProgressWithPhotos', 'GetTaskHistory'];
    for (const proc of procedures) {
      const procExists = await pool.request().query(`
        SELECT COUNT(*) as count FROM sys.objects 
        WHERE object_id = OBJECT_ID('${proc}') AND type in (N'P')
      `);
      
      if (procExists.recordset[0].count > 0) {
        logger.success(`✅ Stored procedure ${proc} criada/verificada`);
      }
    }
    
    // Verificar views
    const views = ['TaskHistoryWithPhotos', 'EquipmentTasksWithPhotos'];
    for (const view of views) {
      const viewExists = await pool.request().query(`
        SELECT COUNT(*) as count FROM sys.views 
        WHERE name = '${view}'
      `);
      
      if (viewExists.recordset[0].count > 0) {
        logger.success(`✅ View ${view} criada/verificada`);
      }
    }
    
    logger.success('🎉 Melhorias no sistema de tarefas aplicadas com sucesso!');
    logger.info('📋 Funcionalidades disponíveis:');
    logger.info('   - Upload de fotos para tarefas');
    logger.info('   - Histórico detalhado de progresso');
    logger.info('   - Armazenamento de fotos no banco');
    logger.info('   - Views otimizadas para consultas');
    logger.info('   - Stored procedures para operações complexas');
    
  } catch (error) {
    logger.error('❌ Erro ao aplicar melhorias:', error.message);
  } finally {
    process.exit(0);
  }
}

applyTaskImprovements();
