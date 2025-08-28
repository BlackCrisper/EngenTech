import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// ========================================
// GET /api/projects - Listar todos os projetos
// ========================================
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    
    // Se for admin, pode ver todos os projetos
    // Se for supervisor, pode ver apenas os projetos que gerencia
    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.startDate,
        p.endDate,
        p.createdAt,
        p.updatedAt,
        u.username as createdBy,
        (SELECT COUNT(*) FROM Users WHERE projectId = p.id) as totalUsers,
        (SELECT COUNT(*) FROM Areas WHERE projectId = p.id) as totalAreas,
        (SELECT COUNT(*) FROM Equipment WHERE projectId = p.id) as totalEquipment
      FROM Projects p
      LEFT JOIN Users u ON p.createdBy = u.id
    `;

    if (req.user.role === 'admin') {
      // Admin vê todos os projetos
      query += ' ORDER BY p.createdAt DESC';
    } else {
      // Outros usuários veem apenas o projeto deles
      query += ' WHERE p.id = @projectId ORDER BY p.createdAt DESC';
    }

    const request = pool.request();
    
    if (req.user.role !== 'admin') {
      request.input('projectId', sql.Int, req.user.projectId);
    }

    const result = await request.query(query);

    res.json(result.recordset);

  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ========================================
// GET /api/projects/stats - Estatísticas dos projetos
// ========================================
router.get('/stats', async (req, res) => {
  try {
    // Apenas admin pode ver estatísticas
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: apenas administradores podem ver estatísticas'
      });
    }

    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as totalProjects,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeProjects,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedProjects,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingProjects,
        (SELECT COUNT(*) FROM Users WHERE projectId IS NOT NULL) as totalUsers,
        (SELECT COUNT(*) FROM Areas) as totalAreas,
        (SELECT COUNT(*) FROM Equipment) as totalEquipment
      FROM Projects
    `);

    const stats = result.recordset[0];

    res.json({
      totalProjects: stats.totalProjects,
      activeProjects: stats.activeProjects,
      completedProjects: stats.completedProjects,
      pendingProjects: stats.pendingProjects,
      totalUsers: stats.totalUsers,
      totalAreas: stats.totalAreas,
      totalEquipment: stats.totalEquipment
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ========================================
// GET /api/projects/:id - Obter projeto específico
// ========================================
router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const projectId = parseInt(req.params.id);

    // Verificar permissão
    if (req.user.role !== 'admin' && req.user.projectId !== projectId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: você não tem permissão para acessar este projeto'
      });
    }

    const result = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          p.id,
          p.name,
          p.description,
          p.status,
          p.startDate,
          p.endDate,
          p.createdAt,
          p.updatedAt,
          u.username as createdBy,
          (SELECT COUNT(*) FROM Users WHERE projectId = p.id) as totalUsers,
          (SELECT COUNT(*) FROM Areas WHERE projectId = p.id) as totalAreas,
          (SELECT COUNT(*) FROM Equipment WHERE projectId = p.id) as totalEquipment,
          (SELECT COUNT(*) FROM EquipmentTasks WHERE projectId = p.id) as totalTasks
        FROM Projects p
        LEFT JOIN Users u ON p.createdBy = u.id
        WHERE p.id = @projectId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
      message: 'Projeto encontrado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao obter projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ========================================
// POST /api/projects - Criar novo projeto
// ========================================
router.post('/', async (req, res) => {
  try {
    // Apenas admin pode criar projetos
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem criar projetos'
      });
    }

    const { name, description, startDate, endDate } = req.body;

    // Validações
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nome do projeto é obrigatório'
      });
    }

    const pool = await getConnection();

    // Verificar se já existe um projeto com este nome
    const existingProject = await pool.request()
      .input('name', sql.NVarChar, name.trim())
      .query('SELECT id FROM Projects WHERE name = @name');

    if (existingProject.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um projeto com este nome'
      });
    }

    // Criar projeto
    const result = await pool.request()
      .input('name', sql.NVarChar, name.trim())
      .input('description', sql.NVarChar, description || null)
      .input('startDate', sql.DateTime, startDate || null)
      .input('endDate', sql.DateTime, endDate || null)
      .input('createdBy', sql.Int, req.user.id)
      .query(`
        INSERT INTO Projects (name, description, startDate, endDate, createdBy)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.description, INSERTED.status, INSERTED.createdAt
        VALUES (@name, @description, @startDate, @endDate, @createdBy)
      `);

    const newProject = result.recordset[0];

    res.status(201).json({
      success: true,
      data: newProject,
      message: 'Projeto criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ========================================
// PUT /api/projects/:id - Atualizar projeto
// ========================================
router.put('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { name, description, status, startDate, endDate } = req.body;

    // Apenas admin pode editar projetos
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem editar projetos'
      });
    }

    // Validações
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nome do projeto é obrigatório'
      });
    }

    const pool = await getConnection();

    // Verificar se o projeto existe
    const existingProject = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query('SELECT id FROM Projects WHERE id = @projectId');

    if (existingProject.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    // Verificar se já existe outro projeto com este nome
    const duplicateName = await pool.request()
      .input('name', sql.NVarChar, name.trim())
      .input('projectId', sql.Int, projectId)
      .query('SELECT id FROM Projects WHERE name = @name AND id != @projectId');

    if (duplicateName.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe outro projeto com este nome'
      });
    }

    // Atualizar projeto
    const result = await pool.request()
      .input('projectId', sql.Int, projectId)
      .input('name', sql.NVarChar, name.trim())
      .input('description', sql.NVarChar, description || null)
      .input('status', sql.NVarChar, status || 'active')
      .input('startDate', sql.DateTime, startDate || null)
      .input('endDate', sql.DateTime, endDate || null)
      .query(`
        UPDATE Projects 
        SET name = @name, description = @description, status = @status, 
            startDate = @startDate, endDate = @endDate, updatedAt = GETDATE()
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.description, INSERTED.status, INSERTED.updatedAt
        WHERE id = @projectId
      `);

    const updatedProject = result.recordset[0];

    res.json({
      success: true,
      data: updatedProject,
      message: 'Projeto atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ========================================
// DELETE /api/projects/:id - Excluir projeto
// ========================================
router.delete('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    // Apenas admin pode excluir projetos
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem excluir projetos'
      });
    }

    const pool = await getConnection();

    // Verificar se o projeto existe
    const existingProject = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query('SELECT id, name FROM Projects WHERE id = @projectId');

    if (existingProject.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    // Verificar se há usuários no projeto
    const usersInProject = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query('SELECT COUNT(*) as count FROM Users WHERE projectId = @projectId');

    if (usersInProject.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir um projeto que possui usuários alocados'
      });
    }

    // Verificar se há dados no projeto
    const dataInProject = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM Areas WHERE projectId = @projectId) as areas,
          (SELECT COUNT(*) FROM Equipment WHERE projectId = @projectId) as equipment,
          (SELECT COUNT(*) FROM EquipmentTasks WHERE projectId = @projectId) as tasks
      `);

    const totalData = dataInProject.recordset[0].areas + 
                     dataInProject.recordset[0].equipment + 
                     dataInProject.recordset[0].tasks;

    if (totalData > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir um projeto que possui dados (áreas, equipamentos ou tarefas)'
      });
    }

    // Excluir projeto
    await pool.request()
      .input('projectId', sql.Int, projectId)
      .query('DELETE FROM Projects WHERE id = @projectId');

    res.json({
      success: true,
      message: 'Projeto excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ========================================
// POST /api/projects/:id/assign-supervisor - Atribuir supervisor ao projeto
// ========================================
router.post('/:id/assign-supervisor', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { userId } = req.body;

    // Apenas admin pode atribuir supervisores
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem atribuir supervisores'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário é obrigatório'
      });
    }

    const pool = await getConnection();

    // Verificar se o projeto existe
    const projectExists = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query('SELECT id, name FROM Projects WHERE id = @projectId');

    if (projectExists.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    // Verificar se o usuário existe e é supervisor
    const userExists = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT id, username, role FROM Users WHERE id = @userId AND role = "supervisor"');

    if (userExists.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado ou não é supervisor'
      });
    }

    // Atribuir supervisor ao projeto
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('projectId', sql.Int, projectId)
      .query('UPDATE Users SET projectId = @projectId WHERE id = @userId');

    res.json({
      success: true,
      message: 'Supervisor atribuído ao projeto com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atribuir supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ========================================
// GET /api/projects/:id/stats - Estatísticas do projeto específico
// ========================================
router.get('/:id/stats', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    // Verificar permissão
    if (req.user.role !== 'admin' && req.user.projectId !== projectId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: você não tem permissão para acessar este projeto'
      });
    }

    const pool = await getConnection();

    const result = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM Users WHERE projectId = @projectId) as totalUsers,
          (SELECT COUNT(*) FROM Areas WHERE projectId = @projectId) as totalAreas,
          (SELECT COUNT(*) FROM Equipment WHERE projectId = @projectId) as totalEquipment,
          (SELECT COUNT(*) FROM EquipmentTasks WHERE projectId = @projectId) as totalTasks
      `);

    res.json({
      success: true,
      data: result.recordset[0],
      message: 'Estatísticas do projeto obtidas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas do projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ========================================
// GET /api/projects/:id/users - Listar usuários do projeto
// ========================================
router.get('/:id/users', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    // Verificar permissão
    if (req.user.role !== 'admin' && req.user.projectId !== projectId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: você não tem permissão para acessar este projeto'
      });
    }

    const pool = await getConnection();

    const result = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
                 SELECT 
           u.id,
           u.username,
           u.email,
           u.name as fullName,
           u.role,
           u.active,
           u.projectId,
           u.createdAt
         FROM Users u
         WHERE u.projectId = @projectId
         ORDER BY u.role, u.username
      `);

    res.json({
      success: true,
      data: result.recordset,
      message: 'Usuários do projeto listados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao listar usuários do projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ========================================
// POST /api/projects/:id/users - Adicionar usuário ao projeto
// ========================================
router.post('/:id/users', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { userId } = req.body;

    // Apenas admin pode adicionar usuários ao projeto
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem adicionar usuários ao projeto'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário é obrigatório'
      });
    }

    const pool = await getConnection();

    // Verificar se o projeto existe
    const projectExists = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query('SELECT id, name FROM Projects WHERE id = @projectId');

    if (projectExists.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    // Verificar se o usuário existe
    const userExists = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT id, username, projectId FROM Users WHERE id = @userId');

    if (userExists.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se o usuário já está no projeto
    if (userExists.recordset[0].projectId === projectId) {
      return res.status(400).json({
        success: false,
        message: 'Usuário já está neste projeto'
      });
    }

    // Adicionar usuário ao projeto
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('projectId', sql.Int, projectId)
      .query('UPDATE Users SET projectId = @projectId WHERE id = @userId');

    res.json({
      success: true,
      message: 'Usuário adicionado ao projeto com sucesso'
    });

  } catch (error) {
    console.error('Erro ao adicionar usuário ao projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ========================================
// DELETE /api/projects/:id/users/:userId - Remover usuário do projeto
// ========================================
router.delete('/:id/users/:userId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    // Apenas admin pode remover usuários do projeto
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem remover usuários do projeto'
      });
    }

    const pool = await getConnection();

    // Verificar se o projeto existe
    const projectExists = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query('SELECT id, name FROM Projects WHERE id = @projectId');

    if (projectExists.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    // Verificar se o usuário existe e está no projeto
    const userExists = await pool.request()
      .input('userId', sql.Int, userId)
      .input('projectId', sql.Int, projectId)
      .query('SELECT id, username, projectId FROM Users WHERE id = @userId AND projectId = @projectId');

    if (userExists.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado ou não está neste projeto'
      });
    }

    // Remover usuário do projeto (definir projectId como NULL)
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('UPDATE Users SET projectId = NULL WHERE id = @userId');

    res.json({
      success: true,
      message: 'Usuário removido do projeto com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover usuário do projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
