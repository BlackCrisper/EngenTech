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
                AVG(COALESCE(et.currentProgress, 0)) as averageProgress
              FROM Equipment child
              LEFT JOIN EquipmentTasks et ON child.id = et.equipmentId
              WHERE child.parentTag = e.tag
              GROUP BY child.id
            ) child_progress
          )
          ELSE AVG(et.currentProgress)
        END as averageProgress,
        CASE 
          WHEN e.isParent = 1 THEN (
            SELECT COUNT(*)
            FROM Equipment child
            WHERE child.parentTag = e.tag
          )
          ELSE COUNT(et.id)
        END as progressCount,
        -- Determinar disciplina principal baseada na maioria das tarefas
        CASE 
          WHEN e.isParent = 0 THEN (
            SELECT TOP 1 et2.discipline
            FROM EquipmentTasks et2
            WHERE et2.equipmentId = e.id
            GROUP BY et2.discipline
            ORDER BY COUNT(*) DESC
          )
          ELSE NULL
        END as primaryDiscipline
      FROM Equipment e
      JOIN Areas a ON e.areaId = a.id
      LEFT JOIN EquipmentTasks et ON e.id = et.equipmentId
      WHERE 1=1
    `;

    const params = [];

    if (area) {
      // Verificar se é um ID numérico ou nome
      if (!isNaN(area)) {
        query += ' AND a.id = @areaId';
        params.push({ name: 'areaId', type: sql.Int, value: parseInt(area) });
      } else {
        query += ' AND a.name LIKE @area';
        params.push({ name: 'area', type: sql.NVarChar, value: `%${area}%` });
      }
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
      primaryDiscipline: item.primaryDiscipline, // Nova propriedade
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
      children: [] // Será preenchido abaixo
    }));

    // Retornar todos os equipamentos sem organização hierárquica
    // O frontend fará a organização
    res.json(allEquipment);

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

    // Verificar se equipamento existe e obter informações completas
    const existingEquipment = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          e.id, 
          e.tag, 
          e.isParent,
          e.parentTag,
          a.name as areaName
        FROM Equipment e
        JOIN Areas a ON e.areaId = a.id
        WHERE e.id = @id
      `);

    if (existingEquipment.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    const equipment = existingEquipment.recordset[0];

    console.log(`🔍 Iniciando validação para equipamento: ${equipment.tag}`);
    console.log(`  - ID: ${equipment.id}`);
    console.log(`  - isParent: ${equipment.isParent}`);
    console.log(`  - parentTag: ${equipment.parentTag}`);

    // VALIDAÇÕES DE REGRAS DE NEGÓCIO

    // 1. Se é equipamento PAI: verificar se não tem filhos
    if (equipment.isParent) {
      console.log(`🔍 Validando equipamento pai: ${equipment.tag}`);
      
      // Validação mais robusta - verificar filhos de múltiplas formas
      const childrenCount1 = await pool.request()
        .input('parentTag', sql.NVarChar, equipment.tag)
        .query('SELECT COUNT(*) as count FROM Equipment WHERE parentTag = @parentTag AND isParent = 0');

      const childrenCount2 = await pool.request()
        .input('parentTag', sql.NVarChar, equipment.tag)
        .query('SELECT COUNT(*) as count FROM Equipment WHERE parentTag = @parentTag');

      const count1 = childrenCount1.recordset[0].count;
      const count2 = childrenCount2.recordset[0].count;
      
      console.log(`  👶 Encontrados ${count1} equipamento(s) filho(s) (isParent = 0)`);
      console.log(`  👶 Encontrados ${count2} equipamento(s) com parentTag (todos)`);

      // Usar a validação mais restritiva
      const finalCount = Math.max(count1, count2);
      
      if (finalCount > 0) {
        console.log(`  ❌ VALIDAÇÃO BLOQUEADA: Equipamento pai ${equipment.tag} tem ${finalCount} filho(s)`);
        
        // Buscar detalhes dos filhos para debug
        const childrenDetails = await pool.request()
          .input('parentTag', sql.NVarChar, equipment.tag)
          .query('SELECT id, tag, isParent, parentTag FROM Equipment WHERE parentTag = @parentTag');
        
        console.log(`  📋 Detalhes dos filhos:`);
        for (const child of childrenDetails.recordset) {
          console.log(`    - ID: ${child.id}, Tag: ${child.tag}, isParent: ${child.isParent}, parentTag: ${child.parentTag}`);
        }
        
        return res.status(400).json({ 
          error: 'Não é possível deletar um equipamento pai que possui equipamentos filhos',
          details: `O equipamento ${equipment.tag} possui ${finalCount} equipamento(s) filho(s). Remova todos os filhos primeiro.`
        });
      } else {
        console.log(`  ✅ VALIDAÇÃO APROVADA: Equipamento pai ${equipment.tag} não tem filhos`);
      }
    }

    // 2. Se é equipamento FILHO: verificar se não tem tarefas
    if (!equipment.isParent) {
      const tasksCount = await pool.request()
        .input('equipmentId', sql.Int, id)
        .query('SELECT COUNT(*) as count FROM EquipmentTasks WHERE equipmentId = @equipmentId');

      if (tasksCount.recordset[0].count > 0) {
        return res.status(400).json({ 
          error: 'Não é possível deletar um equipamento filho que possui tarefas',
          details: `O equipamento ${equipment.tag} possui ${tasksCount.recordset[0].count} tarefa(s). Remova todas as tarefas primeiro.`
        });
      }
    }

    // 3. Verificar se há histórico de tarefas (TaskHistory)
    const historyCount = await pool.request()
      .input('equipmentId', sql.Int, id)
      .query(`
        SELECT COUNT(*) as count 
        FROM TaskHistory th
        JOIN EquipmentTasks et ON th.taskId = et.id
        WHERE et.equipmentId = @equipmentId
      `);

    if (historyCount.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar um equipamento que possui histórico de tarefas',
        details: `O equipamento ${equipment.tag} possui ${historyCount.recordset[0].count} registro(s) de histórico. O histórico é mantido para auditoria.`
      });
    }

    // 4. Verificar se há fotos/documentos anexados
    const photosCount = await pool.request()
      .input('equipmentId', sql.Int, id)
      .query(`
        SELECT COUNT(*) as count 
        FROM TaskHistory th
        JOIN EquipmentTasks et ON th.taskId = et.id
        WHERE et.equipmentId = @equipmentId AND th.photos IS NOT NULL AND th.photos != ''
      `);

    if (photosCount.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar um equipamento que possui fotos/documentos anexados',
        details: `O equipamento ${equipment.tag} possui ${photosCount.recordset[0].count} registro(s) com fotos/documentos. Remova os anexos primeiro.`
      });
    }

    // VALIDAÇÃO FINAL ANTES DE DELETAR
    console.log(`\n🔍 VALIDAÇÃO FINAL antes de deletar...`);
    
    // Verificar novamente se o equipamento ainda é pai e tem filhos (dupla verificação)
    if (equipment.isParent) {
      const finalCheck = await pool.request()
        .input('parentTag', sql.NVarChar, equipment.tag)
        .query('SELECT COUNT(*) as count FROM Equipment WHERE parentTag = @parentTag');
      
      const finalCount = finalCheck.recordset[0].count;
      console.log(`  🔍 Verificação final: ${finalCount} filho(s) encontrado(s)`);
      
      if (finalCount > 0) {
        console.log(`  ❌ VALIDAÇÃO FINAL FALHOU: Equipamento ainda tem filhos!`);
        return res.status(400).json({ 
          error: 'Validação final falhou: equipamento pai ainda possui filhos',
          details: `O equipamento ${equipment.tag} ainda possui ${finalCount} filho(s). A operação foi cancelada por segurança.`
        });
      }
    }
    
    // SE PASSAR POR TODAS AS VALIDAÇÕES, PROSSEGUIR COM A DELEÇÃO
    console.log(`✅ Todas as validações passaram. Iniciando deleção do equipamento ${equipment.tag}`);

    // Iniciar transação para garantir consistência
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    console.log(`  🔄 Transação iniciada`);

    try {
      // VALIDAÇÃO DENTRO DA TRANSAÇÃO (última verificação)
      if (equipment.isParent) {
        console.log(`  🔍 Validação dentro da transação...`);
        const transactionCheck = await transaction.request()
          .input('parentTag', sql.NVarChar, equipment.tag)
          .query('SELECT COUNT(*) as count FROM Equipment WHERE parentTag = @parentTag');
        
        const transactionCount = transactionCheck.recordset[0].count;
        console.log(`  🔍 Verificação na transação: ${transactionCount} filho(s) encontrado(s)`);
        
        if (transactionCount > 0) {
          console.log(`  ❌ VALIDAÇÃO NA TRANSAÇÃO FALHOU: Cancelando operação!`);
          await transaction.rollback();
          return res.status(400).json({ 
            error: 'Validação na transação falhou: equipamento pai ainda possui filhos',
            details: `O equipamento ${equipment.tag} ainda possui ${transactionCount} filho(s). A operação foi cancelada.`
          });
        }
      }

      // 1. Deletar histórico de tarefas (se houver)
      await transaction.request()
        .input('equipmentId', sql.Int, id)
        .query(`
          DELETE th
          FROM TaskHistory th
          JOIN EquipmentTasks et ON th.taskId = et.id
          WHERE et.equipmentId = @equipmentId
        `);

      // 2. Deletar tarefas da tabela EquipmentTasks
      await transaction.request()
        .input('equipmentId', sql.Int, id)
        .query('DELETE FROM EquipmentTasks WHERE equipmentId = @equipmentId');

      // 3. Deletar tarefas da tabela Tasks (se existir)
      await transaction.request()
        .input('equipmentId', sql.Int, id)
        .query('DELETE FROM Tasks WHERE equipmentId = @equipmentId');

      // 4. Deletar progresso (se existir)
      await transaction.request()
        .input('equipmentId', sql.Int, id)
        .query('DELETE FROM Progress WHERE equipmentId = @equipmentId');

      // 5. Se for equipamento pai, atualizar filhos para remover referência
      if (equipment.isParent) {
        await transaction.request()
          .input('parentTag', sql.NVarChar, equipment.tag)
          .query('UPDATE Equipment SET parentTag = NULL WHERE parentTag = @parentTag');
      }

      // 6. Deletar o equipamento
      const deleteResult = await transaction.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Equipment WHERE id = @id');

      if (deleteResult.rowsAffected[0] === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Equipamento não encontrado' });
      }

      // Commit da transação
      await transaction.commit();

      res.json({ 
        message: 'Equipamento deletado com sucesso',
        details: equipment.isParent 
          ? `Equipamento pai ${equipment.tag} da área ${equipment.areaName} foi removido`
          : `Equipamento filho ${equipment.tag} da área ${equipment.areaName} foi removido`
      });

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
