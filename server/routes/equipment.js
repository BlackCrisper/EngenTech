import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Buscar todos os equipamentos
router.get('/', async (req, res) => {
  try {
    const { area, status } = req.query;
    const pool = await getConnection();

    let query = `
      SELECT 
        e.id,
        e.tag as equipmentTag,
        e.type as name,
        e.areaId,
        e.description,
        e.createdAt,
        e.isParent,
        e.hierarchyLevel,
        e.parentTag,
        a.name as areaName,
        CASE 
          WHEN e.isParent = 1 THEN (
            SELECT AVG(child_progress.averageProgress)
            FROM (
              SELECT 
                child.id,
                AVG(COALESCE(p.currentProgress, 0)) as averageProgress
              FROM Equipment child
              LEFT JOIN Progress p ON child.id = p.equipmentId
              WHERE child.parentTag = e.tag
              GROUP BY child.id
            ) child_progress
          )
          ELSE AVG(p.currentProgress)
        END as averageProgress,
        CASE 
          WHEN e.isParent = 1 THEN (
            SELECT COUNT(*)
            FROM Equipment child
            WHERE child.parentTag = e.tag
          )
          ELSE COUNT(p.id)
        END as progressCount
      FROM Equipment e
      JOIN Areas a ON e.areaId = a.id
      LEFT JOIN Progress p ON e.id = p.equipmentId
      WHERE 1=1
    `;

    const params = [];

    if (area) {
      query += ' AND a.name LIKE @area';
      params.push({ name: 'area', type: sql.NVarChar, value: `%${area}%` });
    }

    query += ' GROUP BY e.id, e.tag, e.type, e.areaId, e.description, e.createdAt, e.isParent, e.hierarchyLevel, e.parentTag, a.name ORDER BY e.hierarchyLevel, e.tag';

    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.query(query);

    // Organizar equipamentos em hierarquia
    const allEquipment = result.recordset.map(item => ({
      id: item.id,
      equipmentTag: item.equipmentTag,
      name: item.description, // Usar description como name
      areaId: item.areaId,
      areaName: item.areaName,
      description: item.description,
      status: 'active',
      isParent: item.isParent,
      hierarchyLevel: item.hierarchyLevel,
      parentTag: item.parentTag,
      averageProgress: Math.round(item.averageProgress || 0),
      progressCount: item.progressCount || 0,
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
      children: [] // Será preenchido abaixo
    }));

    // Organizar em hierarquia
    const equipmentMap = new Map();
    const rootEquipment = [];

    // Primeiro, criar mapa de todos os equipamentos
    allEquipment.forEach(equipment => {
      equipmentMap.set(equipment.equipmentTag, equipment);
    });

    // Depois, organizar hierarquia
    allEquipment.forEach(equipment => {
      if (equipment.hierarchyLevel === 0 || !equipment.parentTag) {
        // Equipamento pai
        rootEquipment.push(equipment);
      } else {
        // Equipamento filho
        const parent = equipmentMap.get(equipment.parentTag);
        if (parent) {
          parent.children.push(equipment);
        } else {
          // Se não encontrar o pai, adicionar como raiz
          rootEquipment.push(equipment);
        }
      }
    });

    res.json(rootEquipment);

  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar equipamento específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          e.id,
          e.tag as equipmentTag,
          e.type as name,
          e.areaId,
          e.description,
          e.createdAt,
          e.isParent,
          e.hierarchyLevel,
          e.parentTag,
          a.name as areaName,
          AVG(p.currentProgress) as averageProgress,
          COUNT(p.id) as progressCount
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        LEFT JOIN Progress p ON e.id = p.equipmentId
        WHERE e.id = @id
        GROUP BY e.id, e.tag, e.type, e.areaId, e.description, e.createdAt, e.isParent, e.hierarchyLevel, e.parentTag, a.name
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    const equipment = result.recordset[0];
    res.json({
      id: equipment.id,
      equipmentTag: equipment.equipmentTag,
      name: equipment.description, // Usar description como name
      areaId: equipment.areaId,
      areaName: equipment.areaName,
      description: equipment.description,
      status: 'active',
      isParent: equipment.isParent,
      hierarchyLevel: equipment.hierarchyLevel,
      parentTag: equipment.parentTag,
      averageProgress: Math.round(equipment.averageProgress || 0),
      progressCount: equipment.progressCount,
      createdAt: equipment.createdAt,
      updatedAt: equipment.createdAt
    });

  } catch (error) {
    console.error('Erro ao buscar equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar equipamentos pais
router.get('/parents/list', async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request()
      .query(`
        SELECT 
          e.id,
          e.tag as equipmentTag,
          e.type as name,
          e.areaId,
          e.description,
          e.createdAt,
          a.name as areaName
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        WHERE e.isParent = 1
        ORDER BY e.tag
      `);

    const parentEquipment = result.recordset.map(item => ({
      id: item.id,
      equipmentTag: item.equipmentTag,
      name: item.description, // Usar description como name
      areaId: item.areaId,
      areaName: item.areaName,
      description: item.description,
      createdAt: item.createdAt
    }));

    res.json(parentEquipment);

  } catch (error) {
    console.error('Erro ao buscar equipamentos pais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar filhos de um equipamento pai
router.get('/:parentTag/children', async (req, res) => {
  try {
    const { parentTag } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('parentTag', sql.NVarChar, parentTag)
      .query(`
        SELECT 
          e.id,
          e.tag as equipmentTag,
          e.type as name,
          e.areaId,
          e.description,
          e.createdAt,
          e.isParent,
          e.hierarchyLevel,
          e.parentTag,
          a.name as areaName,
          AVG(p.currentProgress) as averageProgress,
          COUNT(p.id) as progressCount
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        LEFT JOIN Progress p ON e.id = p.equipmentId
        WHERE e.parentTag = @parentTag
        GROUP BY e.id, e.tag, e.type, e.areaId, e.description, e.createdAt, e.isParent, e.hierarchyLevel, e.parentTag, a.name
        ORDER BY e.tag
      `);

    const children = result.recordset.map(item => ({
      id: item.id,
      equipmentTag: item.equipmentTag,
      name: item.description, // Usar description como name
      areaId: item.areaId,
      areaName: item.areaName,
      description: item.description,
      status: 'active',
      isParent: item.isParent,
      hierarchyLevel: item.hierarchyLevel,
      parentTag: item.parentTag,
      averageProgress: Math.round(item.averageProgress || 0),
      progressCount: item.progressCount,
      createdAt: item.createdAt,
      updatedAt: item.createdAt
    }));

    res.json(children);

  } catch (error) {
    console.error('Erro ao buscar filhos do equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo equipamento
router.post('/', async (req, res) => {
  try {
    const { equipmentTag, name, areaId, description, status = 'active', isParent = false, parentTag = null } = req.body;

    if (!equipmentTag || !name || !areaId) {
      return res.status(400).json({ error: 'Tag, nome e área são obrigatórios' });
    }

    const pool = await getConnection();

    // Verificar se equipamento já existe
    const existingEquipment = await pool.request()
      .input('equipmentTag', sql.NVarChar, equipmentTag)
      .query('SELECT id FROM Equipment WHERE tag = @equipmentTag');

    if (existingEquipment.recordset.length > 0) {
      return res.status(400).json({ error: 'Equipamento com esta tag já existe' });
    }

    // Verificar se área existe
    const areaExists = await pool.request()
      .input('areaId', sql.Int, areaId)
      .query('SELECT id FROM Areas WHERE id = @areaId');

    if (areaExists.recordset.length === 0) {
      return res.status(400).json({ error: 'Área não encontrada' });
    }

    // Se for equipamento filho, verificar se o pai existe
    let hierarchyLevel = 0;
    if (!isParent && parentTag) {
      const parentExists = await pool.request()
        .input('parentTag', sql.NVarChar, parentTag)
        .query('SELECT id, isParent FROM Equipment WHERE tag = @parentTag');

      if (parentExists.recordset.length === 0) {
        return res.status(400).json({ error: 'Equipamento pai não encontrado' });
      }

      const parent = parentExists.recordset[0];
      if (!parent.isParent) {
        return res.status(400).json({ error: 'O equipamento pai deve ser marcado como pai' });
      }

      hierarchyLevel = 1;
    }

    // Determinar o tipo baseado em isParent
    const equipmentType = isParent ? 'parent' : 'child';
    
    // Usar o nome como description e type como 'parent' ou 'child'
    const equipmentDescription = description || name;

    const result = await pool.request()
      .input('tag', sql.NVarChar, equipmentTag)
      .input('type', sql.NVarChar, equipmentType)
      .input('areaId', sql.Int, areaId)
      .input('description', sql.NVarChar, equipmentDescription)
      .input('isParent', sql.Bit, isParent)
      .input('hierarchyLevel', sql.Int, hierarchyLevel)
      .input('parentTag', sql.NVarChar, parentTag)
      .query(`
        INSERT INTO Equipment (tag, type, areaId, description, isParent, hierarchyLevel, parentTag)
        OUTPUT INSERTED.id, INSERTED.tag, INSERTED.type, INSERTED.areaId, INSERTED.description, INSERTED.isParent, INSERTED.hierarchyLevel, INSERTED.parentTag, INSERTED.createdAt
        VALUES (@tag, @type, @areaId, @description, @isParent, @hierarchyLevel, @parentTag)
      `);

    const newEquipment = result.recordset[0];

    res.status(201).json({
      message: 'Equipamento criado com sucesso',
      equipment: {
        id: newEquipment.id,
        equipmentTag: newEquipment.tag,
        name: newEquipment.description, // Usar description como name
        areaId: newEquipment.areaId,
        description: newEquipment.description,
        status: 'active',
        isParent: newEquipment.isParent,
        hierarchyLevel: newEquipment.hierarchyLevel,
        parentTag: newEquipment.parentTag,
        createdAt: newEquipment.createdAt
      }
    });

  } catch (error) {
    console.error('Erro ao criar equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar equipamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { equipmentTag, name, areaId, description, status, isParent, parentTag } = req.body;

    const pool = await getConnection();

    // Verificar se equipamento existe
    const existingEquipment = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM Equipment WHERE id = @id');

    if (existingEquipment.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    // Verificar se tag já existe (se foi alterada)
    if (equipmentTag) {
      const tagExists = await pool.request()
        .input('equipmentTag', sql.NVarChar, equipmentTag)
        .input('id', sql.Int, id)
        .query('SELECT id FROM Equipment WHERE tag = @equipmentTag AND id != @id');

      if (tagExists.recordset.length > 0) {
        return res.status(400).json({ error: 'Equipamento com esta tag já existe' });
      }
    }

    // Verificar se área existe (se foi alterada)
    if (areaId) {
      const areaExists = await pool.request()
        .input('areaId', sql.Int, areaId)
        .query('SELECT id FROM Areas WHERE id = @areaId');

      if (areaExists.recordset.length === 0) {
        return res.status(400).json({ error: 'Área não encontrada' });
      }
    }

    // Se for equipamento filho, verificar se o pai existe
    let hierarchyLevel = 0;
    if (parentTag && !isParent) {
      const parentExists = await pool.request()
        .input('parentTag', sql.NVarChar, parentTag)
        .query('SELECT id, isParent FROM Equipment WHERE tag = @parentTag');

      if (parentExists.recordset.length === 0) {
        return res.status(400).json({ error: 'Equipamento pai não encontrado' });
      }

      const parent = parentExists.recordset[0];
      if (!parent.isParent) {
        return res.status(400).json({ error: 'O equipamento pai deve ser marcado como pai' });
      }

      hierarchyLevel = 1;
    }

    // Construir query de atualização
    let updateQuery = 'UPDATE Equipment SET createdAt = GETDATE()';
    const params = [{ name: 'id', type: sql.Int, value: id }];

    if (equipmentTag) {
      updateQuery += ', tag = @equipmentTag';
      params.push({ name: 'equipmentTag', type: sql.NVarChar, value: equipmentTag });
    }

    if (name) {
      updateQuery += ', description = @name';
      params.push({ name: 'name', type: sql.NVarChar, value: name });
    }

    if (areaId) {
      updateQuery += ', areaId = @areaId';
      params.push({ name: 'areaId', type: sql.Int, value: areaId });
    }

    // Remover esta condição que duplica a coluna description
    // if (description !== undefined) {
    //   updateQuery += ', description = @description';
    //   params.push({ name: 'description', type: sql.NVarChar, value: description });
    // }

    if (isParent !== undefined) {
      updateQuery += ', isParent = @isParent';
      params.push({ name: 'isParent', type: sql.Bit, value: isParent });
      
      // Atualizar type baseado em isParent
      const equipmentType = isParent ? 'parent' : 'child';
      updateQuery += ', type = @equipmentType';
      params.push({ name: 'equipmentType', type: sql.NVarChar, value: equipmentType });
    }

    if (parentTag !== undefined) {
      updateQuery += ', parentTag = @parentTag';
      params.push({ name: 'parentTag', type: sql.NVarChar, value: parentTag });
    }

    if (hierarchyLevel !== undefined) {
      updateQuery += ', hierarchyLevel = @hierarchyLevel';
      params.push({ name: 'hierarchyLevel', type: sql.Int, value: hierarchyLevel });
    }

    updateQuery += ' WHERE id = @id';

    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    await request.query(updateQuery);

    res.json({ message: 'Equipamento atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar equipamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Verificar se equipamento existe
    const existingEquipment = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, tag FROM Equipment WHERE id = @id');

    if (existingEquipment.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    const equipment = existingEquipment.recordset[0];

    // Iniciar transação para garantir consistência
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Deletar tarefas da tabela Tasks
      await transaction.request()
        .input('equipmentId', sql.Int, id)
        .query('DELETE FROM Tasks WHERE equipmentId = @equipmentId');

      // 2. Deletar tarefas da tabela EquipmentTasks
      await transaction.request()
        .input('equipmentId', sql.Int, id)
        .query('DELETE FROM EquipmentTasks WHERE equipmentId = @equipmentId');

      // 3. Deletar progresso
      await transaction.request()
        .input('equipmentId', sql.Int, id)
        .query('DELETE FROM Progress WHERE equipmentId = @equipmentId');

      // 4. Atualizar filhos para remover referência ao pai (se for pai)
      await transaction.request()
        .input('parentTag', sql.NVarChar, equipment.tag)
        .query('UPDATE Equipment SET parentTag = NULL WHERE parentTag = @parentTag');

      // 5. Deletar o equipamento
      const deleteResult = await transaction.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Equipment WHERE id = @id');

      if (deleteResult.rowsAffected[0] === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Equipamento não encontrado' });
      }

      // Commit da transação
      await transaction.commit();

      res.json({ message: 'Equipamento e todas as suas tarefas foram deletados com sucesso' });

    } catch (error) {
      // Rollback em caso de erro
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Erro ao deletar equipamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
