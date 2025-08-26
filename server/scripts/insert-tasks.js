import { getConnection, sql } from '../config/database.js';

async function insertSampleTasks() {
  try {
    const pool = await getConnection();
    console.log('✅ Conectado ao banco de dados');

    // Tarefas para equipamentos existentes (usando os IDs corretos)
    const tasks = [
      // Equipamento 14 (SISTEMA-001 - Sistema principal de refrigeração)
      { equipmentId: 14, discipline: 'electrical', name: 'Instalação de Painel Elétrico', description: 'Instalação e montagem do painel elétrico principal do sistema', currentProgress: 75, targetProgress: 100, estimatedHours: 16.0, status: 'in-progress', priority: 'high' },
      { equipmentId: 14, discipline: 'mechanical', name: 'Montagem de Estrutura', description: 'Montagem da estrutura mecânica do sistema', currentProgress: 90, targetProgress: 100, estimatedHours: 20.0, status: 'in-progress', priority: 'high' },
      { equipmentId: 14, discipline: 'civil', name: 'Preparação de Fundação', description: 'Preparação e nivelamento da fundação', currentProgress: 100, targetProgress: 100, estimatedHours: 32.0, status: 'completed', priority: 'high' },

      // Equipamento 15 (COMP-001 - Compressor de alta pressão)
      { equipmentId: 15, discipline: 'electrical', name: 'Cabeamento de Potência', description: 'Instalação de cabos de potência e distribuição', currentProgress: 60, targetProgress: 100, estimatedHours: 24.0, status: 'in-progress', priority: 'high' },
      { equipmentId: 15, discipline: 'mechanical', name: 'Instalação de Motores', description: 'Instalação e alinhamento de motores', currentProgress: 45, targetProgress: 100, estimatedHours: 16.0, status: 'in-progress', priority: 'high' },
      { equipmentId: 15, discipline: 'civil', name: 'Instalação de Estrutura', description: 'Instalação da estrutura civil', currentProgress: 80, targetProgress: 100, estimatedHours: 24.0, status: 'in-progress', priority: 'high' },

      // Equipamento 18 (Z1M03 - MOINHO DE CRU)
      { equipmentId: 18, discipline: 'electrical', name: 'Instalação de Iluminação', description: 'Instalação de sistema de iluminação', currentProgress: 30, targetProgress: 100, estimatedHours: 12.0, status: 'in-progress', priority: 'normal' },
      { equipmentId: 18, discipline: 'mechanical', name: 'Instalação de Bombas', description: 'Instalação e teste de bombas', currentProgress: 20, targetProgress: 100, estimatedHours: 12.0, status: 'in-progress', priority: 'high' },
      { equipmentId: 18, discipline: 'civil', name: 'Alvenaria', description: 'Execução de alvenaria e vedação', currentProgress: 50, targetProgress: 100, estimatedHours: 20.0, status: 'in-progress', priority: 'normal' },

      // Equipamento 19 (Z1M03M! - Motor Moinho de Cru)
      { equipmentId: 19, discipline: 'electrical', name: 'Instalação de Tomadas', description: 'Instalação de tomadas e pontos de energia', currentProgress: 15, targetProgress: 100, estimatedHours: 8.0, status: 'pending', priority: 'normal' },
      { equipmentId: 19, discipline: 'mechanical', name: 'Instalação de Válvulas', description: 'Instalação e regulagem de válvulas', currentProgress: 0, targetProgress: 100, estimatedHours: 8.0, status: 'pending', priority: 'normal' },
      { equipmentId: 19, discipline: 'civil', name: 'Acabamento', description: 'Acabamento e pintura', currentProgress: 0, targetProgress: 100, estimatedHours: 16.0, status: 'pending', priority: 'low' }
    ];

    console.log(`📝 Inserindo ${tasks.length} tarefas...`);

    for (const task of tasks) {
      try {
        await pool.request()
          .input('equipmentId', sql.Int, task.equipmentId)
          .input('discipline', sql.NVarChar, task.discipline)
          .input('name', sql.NVarChar, task.name)
          .input('description', sql.NVarChar, task.description)
          .input('currentProgress', sql.Decimal(5,2), task.currentProgress)
          .input('targetProgress', sql.Decimal(5,2), task.targetProgress)
          .input('estimatedHours', sql.Decimal(5,2), task.estimatedHours)
          .input('status', sql.NVarChar, task.status)
          .input('priority', sql.NVarChar, task.priority)
          .query(`
            INSERT INTO EquipmentTasks (equipmentId, discipline, name, description, currentProgress, targetProgress, estimatedHours, status, priority)
            VALUES (@equipmentId, @discipline, @name, @description, @currentProgress, @targetProgress, @estimatedHours, @status, @priority)
          `);
        
        console.log(`✅ Tarefa inserida: ${task.name} (${task.discipline}) - ${task.currentProgress}%`);
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`⚠️ Tarefa já existe: ${task.name} (${task.discipline})`);
        } else {
          console.error(`❌ Erro ao inserir tarefa ${task.name}:`, error.message);
        }
      }
    }

    // Verificar tarefas inseridas
    const result = await pool.request()
      .query(`
        SELECT 
          e.tag,
          e.description as equipmentName,
          et.discipline,
          et.name as taskName,
          et.currentProgress,
          et.targetProgress,
          et.status,
          et.priority
        FROM Equipment e
        JOIN EquipmentTasks et ON e.id = et.equipmentId
        ORDER BY e.tag, et.discipline
      `);

    console.log('\n📊 Tarefas inseridas:');
    console.table(result.recordset);

    // Calcular progresso médio dos equipamentos
    const progressResult = await pool.request()
      .query(`
        SELECT 
          e.tag,
          e.description as equipmentName,
          AVG(et.currentProgress) as averageProgress,
          COUNT(et.id) as taskCount
        FROM Equipment e
        LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
        GROUP BY e.id, e.tag, e.description
        ORDER BY e.tag
      `);

    console.log('\n📈 Progresso médio dos equipamentos:');
    console.table(progressResult.recordset);

    console.log('✅ Script concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

insertSampleTasks();
