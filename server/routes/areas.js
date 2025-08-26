import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Buscar todas as áreas
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT 
          a.id,
          a.name,
          a.description,
          a.code,
          a.active,
          a.createdAt,
          COUNT(DISTINCT CASE WHEN e.isParent = 0 THEN e.id END) as equipmentCount,
          AVG(et.currentProgress) as averageProgress
        FROM Areas a
        LEFT JOIN Equipment e ON a.id = e.areaId AND e.isParent = 0
        LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
        GROUP BY a.id, a.name, a.description, a.code, a.active, a.createdAt
        ORDER BY a.name
      `);

    const areas = result.recordset.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      status: item.active ? 'active' : 'inactive',
      equipmentCount: item.equipmentCount,
      averageProgress: Math.round(item.averageProgress || 0),
      createdAt: item.createdAt,
      updatedAt: item.createdAt
    }));

    res.json(areas);

  } catch (error) {
    console.error('Erro ao buscar áreas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar área específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          a.*,
          COUNT(DISTINCT CASE WHEN e.isParent = 0 THEN e.id END) as equipmentCount,
          AVG(et.currentProgress) as averageProgress
        FROM Areas a
        LEFT JOIN Equipment e ON a.id = e.areaId AND e.isParent = 0
        LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
        WHERE a.id = @id
        GROUP BY a.id, a.name, a.description, a.code, a.active, a.createdAt
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Área não encontrada' });
    }

    const area = result.recordset[0];
    res.json({
      id: area.id,
      name: area.name,
      description: area.description,
      status: area.active ? 'active' : 'inactive',
      equipmentCount: area.equipmentCount,
      averageProgress: Math.round(area.averageProgress || 0),
      createdAt: area.createdAt,
      updatedAt: area.createdAt
    });

  } catch (error) {
    console.error('Erro ao buscar área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova área
router.post('/', async (req, res) => {
  try {
    const { name, description, status = 'active' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da área é obrigatório' });
    }

    const pool = await getConnection();

    // Verificar se área já existe
    const existingArea = await pool.request()
      .input('name', sql.NVarChar, name)
      .query('SELECT id FROM Areas WHERE name = @name');

    if (existingArea.recordset.length > 0) {
      return res.status(400).json({ error: 'Área com este nome já existe' });
    }

    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('code', sql.NVarChar, name.toUpperCase().replace(/\s+/g, '_'))
      .input('active', sql.Bit, status === 'active' ? 1 : 0)
      .query(`
        INSERT INTO Areas (name, description, code, active)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.description, INSERTED.code, INSERTED.active, INSERTED.createdAt
        VALUES (@name, @description, @code, @active)
      `);

    const newArea = result.recordset[0];

    res.status(201).json({
      message: 'Área criada com sucesso',
      area: {
        id: newArea.id,
        name: newArea.name,
        description: newArea.description,
        status: newArea.active ? 'active' : 'inactive',
        createdAt: newArea.createdAt
      }
    });

  } catch (error) {
    console.error('Erro ao criar área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar área
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const pool = await getConnection();

    // Verificar se área existe
    const existingArea = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM Areas WHERE id = @id');

    if (existingArea.recordset.length === 0) {
      return res.status(404).json({ error: 'Área não encontrada' });
    }

    // Verificar se nome já existe (se foi alterado)
    if (name) {
      const nameExists = await pool.request()
        .input('name', sql.NVarChar, name)
        .input('id', sql.Int, id)
        .query('SELECT id FROM Areas WHERE name = @name AND id != @id');

      if (nameExists.recordset.length > 0) {
        return res.status(400).json({ error: 'Área com este nome já existe' });
      }
    }

    // Construir query de atualização
    let updateQuery = 'UPDATE Areas SET createdAt = GETDATE()';
    const params = [{ name: 'id', type: sql.Int, value: id }];

    if (name) {
      updateQuery += ', name = @name';
      params.push({ name: 'name', type: sql.NVarChar, value: name });
    }

    if (description !== undefined) {
      updateQuery += ', description = @description';
      params.push({ name: 'description', type: sql.NVarChar, value: description });
    }

    if (status) {
      updateQuery += ', active = @active';
      params.push({ name: 'active', type: sql.Bit, value: status === 'active' ? 1 : 0 });
    }

    updateQuery += ' WHERE id = @id';

    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    await request.query(updateQuery);

    res.json({ message: 'Área atualizada com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar área
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Verificar se área existe e obter informações
    const areaInfo = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, name, active FROM Areas WHERE id = @id');

    if (areaInfo.recordset.length === 0) {
      return res.status(404).json({ error: 'Área não encontrada' });
    }

    const area = areaInfo.recordset[0];

    // VALIDAÇÕES DE REGRAS DE NEGÓCIO PARA DELETAR ÁREAS

    // 1. Verificar se área tem equipamentos
    const equipmentCount = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as count FROM Equipment WHERE areaId = @id');

    if (equipmentCount.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar uma área que possui equipamentos cadastrados',
        details: `A área "${area.name}" possui ${equipmentCount.recordset[0].count} equipamento(s). Remova todos os equipamentos primeiro.`
      });
    }

    // 2. Verificar se área tem tarefas (caso existam tarefas órfãs)
    const tasksCount = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT COUNT(*) as count 
        FROM EquipmentTasks et
        JOIN Equipment e ON et.equipmentId = e.id
        WHERE e.areaId = @id
      `);

    if (tasksCount.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar uma área que possui tarefas cadastradas',
        details: `A área "${area.name}" possui ${tasksCount.recordset[0].count} tarefa(s). Remova todas as tarefas primeiro.`
      });
    }

    // 3. Verificar se área tem histórico de tarefas
    const historyCount = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT COUNT(*) as count 
        FROM TaskHistory th
        JOIN EquipmentTasks et ON th.taskId = et.id
        JOIN Equipment e ON et.equipmentId = e.id
        WHERE e.areaId = @id
      `);

    if (historyCount.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar uma área que possui histórico de tarefas',
        details: `A área "${area.name}" possui ${historyCount.recordset[0].count} registro(s) de histórico. O histórico é mantido para auditoria.`
      });
    }

    // 4. Verificar se área está ativa (opcional - pode ser uma regra de negócio)
    if (area.active) {
      return res.status(400).json({ 
        error: 'Não é possível deletar uma área ativa',
        details: `A área "${area.name}" está ativa. Desative a área antes de deletá-la.`
      });
    }

    // SE PASSAR POR TODAS AS VALIDAÇÕES, PROSSEGUIR COM A DELEÇÃO

    // Iniciar transação para garantir consistência
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Deletar histórico de tarefas (se houver)
      await transaction.request()
        .input('id', sql.Int, id)
        .query(`
          DELETE th
          FROM TaskHistory th
          JOIN EquipmentTasks et ON th.taskId = et.id
          JOIN Equipment e ON et.equipmentId = e.id
          WHERE e.areaId = @id
        `);

      // 2. Deletar tarefas (se houver)
      await transaction.request()
        .input('id', sql.Int, id)
        .query(`
          DELETE et
          FROM EquipmentTasks et
          JOIN Equipment e ON et.equipmentId = e.id
          WHERE e.areaId = @id
        `);

      // 3. Deletar equipamentos (se houver)
      await transaction.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Equipment WHERE areaId = @id');

      // 4. Deletar a área
      const deleteResult = await transaction.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Areas WHERE id = @id');

      if (deleteResult.rowsAffected[0] === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Área não encontrada' });
      }

      // Commit da transação
      await transaction.commit();

      res.json({ 
        message: 'Área deletada com sucesso',
        details: `Área "${area.name}" foi removida completamente do sistema`
      });

    } catch (error) {
      // Rollback em caso de erro
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Erro ao deletar área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
