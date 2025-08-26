import { getConnection, sql } from '../config/database.js';
import fs from 'fs';
import path from 'path';

async function applyUpdates() {
  try {
    const pool = await getConnection();
    console.log('✅ Conectado ao SQL Server');

    // Ler e executar o schema de permissões
    console.log('📋 Aplicando sistema de permissões...');
    const permissionsSchema = fs.readFileSync(
      path.join(process.cwd(), 'server/scripts/permissions-schema.sql'), 
      'utf8'
    );
    
    const permissionsCommands = permissionsSchema
      .split(/\bGO\b/i)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const command of permissionsCommands) {
      try {
        await pool.request().query(command);
        console.log('✅ Comando executado com sucesso');
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('⚠️  Comando já foi executado anteriormente');
        } else {
          console.error('❌ Erro ao executar comando:', error.message);
        }
      }
    }

    // Ler e executar o schema de hierarquia de equipamentos
    console.log('📋 Aplicando hierarquia de equipamentos...');
    const hierarchySchema = fs.readFileSync(
      path.join(process.cwd(), 'server/scripts/equipment-hierarchy.sql'), 
      'utf8'
    );
    
    const hierarchyCommands = hierarchySchema
      .split(/\bGO\b/i)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const command of hierarchyCommands) {
      try {
        await pool.request().query(command);
        console.log('✅ Comando executado com sucesso');
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('⚠️  Comando já foi executado anteriormente');
        } else {
          console.error('❌ Erro ao executar comando:', error.message);
        }
      }
    }

    console.log('🎉 Todas as atualizações foram aplicadas com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const tables = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME IN ('Permissions', 'RolePermissions', 'AuditLog', 'StandardTasks', 'EquipmentTasks', 'TaskHistory')
    `);
    
    console.log('📊 Tabelas criadas:', tables.recordset.map(t => t.TABLE_NAME));

  } catch (error) {
    console.error('❌ Erro ao aplicar atualizações:', error);
  } finally {
    process.exit(0);
  }
}

applyUpdates();
