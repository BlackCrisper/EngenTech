import { getConnection } from './config/database.js';
import fs from 'fs';
import path from 'path';

async function createMissingTables() {
  try {
    console.log('🔧 Criando tabelas que estão faltando...');
    
    const pool = await getConnection();
    
    // Lista de scripts SQL para executar
    const scripts = [
      'permissions-schema.sql',
      'sesmt-schema.sql', 
      'equipment-hierarchy.sql',
      'system-logs.sql'
    ];
    
    for (const script of scripts) {
      console.log(`\n📝 Executando script: ${script}`);
      
      try {
        const sqlPath = path.join(process.cwd(), 'server', 'scripts', script);
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Dividir o script em comandos individuais
        const commands = sqlContent
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('PRINT'));
        
        console.log(`   Executando ${commands.length} comandos...`);
        
        for (let i = 0; i < commands.length; i++) {
          const command = commands[i];
          if (command.trim()) {
            try {
              await pool.request().query(command);
              console.log(`   ✅ Comando ${i + 1} executado`);
            } catch (error) {
              if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                console.log(`   ⚠️  Comando ${i + 1} já foi executado`);
              } else {
                console.log(`   ❌ Erro no comando ${i + 1}: ${error.message}`);
              }
            }
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao ler script ${script}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Processo concluído!');
    
    // Verificar todas as tabelas criadas
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📊 Todas as tabelas no sistema:');
    tablesResult.recordset.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
    // Verificar tabelas específicas que devem existir
    const expectedTables = [
      'Users', 'Areas', 'Equipment', 'Progress', 'ProgressHistory', 'Documents', 'DashboardMetrics',
      'Permissions', 'RolePermissions', 'AuditLog',
      'SESMTOccurrenceTypes', 'SESMTOccurrences', 'SESMTOccurrenceHistory', 'SESMTOccurrenceComments',
      'SESMTInvestigations', 'SESMTActions',
      'StandardTasks', 'EquipmentTasks', 'TaskHistory',
      'SystemLogs', 'Activities', 'Notifications', 'Reports'
    ];
    
    console.log('\n🔍 Verificando tabelas esperadas:');
    for (const table of expectedTables) {
      const exists = tablesResult.recordset.some(t => t.TABLE_NAME === table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

createMissingTables()
  .then(() => {
    console.log('\n✅ Processo concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no processo:', error);
    process.exit(1);
  });
