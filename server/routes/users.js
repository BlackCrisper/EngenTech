import express from 'express';
import bcrypt from 'bcryptjs';
import { getConnection, sql } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Buscar todos os usuários
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT 
          id, name as username, email, name as fullName, role, sector, active as isActive, createdAt, createdAt as updatedAt
        FROM Users
        ORDER BY name
      `);

    const users = result.recordset.map(item => ({
      id: item.id,
      username: item.username,
      email: item.email,
      fullName: item.fullName,
      role: item.role,
      sector: item.sector || 'other',
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    res.json(users);

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar usuário específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          id, name as username, email, name as fullName, role, sector, active as isActive, createdAt, createdAt as updatedAt
        FROM Users
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = result.recordset[0];
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      sector: user.sector || 'other',
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo usuário
router.post('/', async (req, res) => {
  try {
    const { username, email, fullName, role = 'viewer', sector = 'other', isActive = true, password = 'password' } = req.body;

    if (!username || !email || !fullName) {
      return res.status(400).json({ error: 'Nome de usuário, email e nome completo são obrigatórios' });
    }

    const pool = await getConnection();

    // Verificar se usuário já existe
    const existingUser = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM Users WHERE name = @username OR email = @email');

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ error: 'Usuário ou email já existe' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir novo usuário
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('fullName', sql.NVarChar, fullName)
      .input('role', sql.NVarChar, role)
      .input('sector', sql.NVarChar, sector)
      .input('password', sql.NVarChar, hashedPassword)
      .input('isActive', sql.Bit, isActive)
      .query(`
        INSERT INTO Users (name, email, password, role, sector, active)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.sector, INSERTED.active
        VALUES (@username, @email, @password, @role, @sector, @isActive)
      `);

    const newUser = result.recordset[0];

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        username: newUser.name,
        email: newUser.email,
        fullName: newUser.name,
        role: newUser.role,
        sector: newUser.sector || 'other',
        isActive: newUser.active
      }
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, fullName, role, sector, isActive, password } = req.body;

    const pool = await getConnection();

    // Verificar se usuário existe
    const existingUser = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM Users WHERE id = @id');

    if (existingUser.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se username já existe (se foi alterado)
    if (username) {
      const usernameExists = await pool.request()
        .input('username', sql.NVarChar, username)
        .input('id', sql.Int, id)
        .query('SELECT id FROM Users WHERE name = @username AND id != @id');

      if (usernameExists.recordset.length > 0) {
        return res.status(400).json({ error: 'Usuário com este username já existe' });
      }
    }

    // Verificar se email já existe (se foi alterado)
    if (email) {
      const emailExists = await pool.request()
        .input('email', sql.NVarChar, email)
        .input('id', sql.Int, id)
        .query('SELECT id FROM Users WHERE email = @email AND id != @id');

      if (emailExists.recordset.length > 0) {
        return res.status(400).json({ error: 'Usuário com este email já existe' });
      }
    }

    // Construir query de atualização
    let updateQuery = 'UPDATE Users SET createdAt = GETDATE()';
    const params = [{ name: 'id', type: sql.Int, value: id }];

    if (username) {
      updateQuery += ', name = @username';
      params.push({ name: 'username', type: sql.NVarChar, value: username });
    }

    if (email) {
      updateQuery += ', email = @email';
      params.push({ name: 'email', type: sql.NVarChar, value: email });
    }

    if (role) {
      updateQuery += ', role = @role';
      params.push({ name: 'role', type: sql.NVarChar, value: role });
    }

    if (sector) {
      updateQuery += ', sector = @sector';
      params.push({ name: 'sector', type: sql.NVarChar, value: sector });
    }

    if (isActive !== undefined) {
      updateQuery += ', active = @isActive';
      params.push({ name: 'isActive', type: sql.Bit, value: isActive });
    }

    // Atualizar senha se fornecida
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = @password';
      params.push({ name: 'password', type: sql.NVarChar, value: hashedPassword });
    }

    updateQuery += ' WHERE id = @id';

    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    await request.query(updateQuery);

    res.json({ message: 'Usuário atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Desativar/ativar usuário
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Verificar se usuário existe
    const existingUser = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, active as isActive FROM Users WHERE id = @id');

    if (existingUser.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const currentStatus = existingUser.recordset[0].isActive;
    const newStatus = !currentStatus;

    await pool.request()
      .input('id', sql.Int, id)
      .input('isActive', sql.Bit, newStatus)
      .query('UPDATE Users SET active = @isActive, createdAt = GETDATE() WHERE id = @id');

    res.json({ 
      message: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
      isActive: newStatus
    });

  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar permissões do usuário
router.get('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Verificar se usuário existe
    const userResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, role FROM Users WHERE id = @id AND active = 1');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = userResult.recordset[0];

    // Buscar permissões do usuário
    const permissionsResult = await pool.request()
      .input('role', sql.NVarChar, user.role)
      .query(`
        SELECT p.name, p.resource, p.action
        FROM RolePermissions rp
        JOIN Permissions p ON rp.permissionId = p.id
        WHERE rp.role = @role AND rp.granted = 1
      `);

    // Formatar permissões como objeto
    const permissions = {};
    permissionsResult.recordset.forEach(perm => {
      const key = `${perm.resource}.${perm.action}`;
      permissions[key] = true;
    });

    res.json({ permissions });

  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar estatísticas de usuários
router.get('/stats/overview', async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request()
      .query(`
        SELECT 
          COUNT(*) as totalUsers,
          SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as activeUsers,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminUsers,
          SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as managerUsers,
          SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regularUsers
        FROM Users
      `);

    const stats = result.recordset[0];

    res.json({
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      inactiveUsers: stats.totalUsers - stats.activeUsers,
      adminUsers: stats.adminUsers,
      managerUsers: stats.managerUsers,
      regularUsers: stats.regularUsers
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Verificar se usuário existe
    const existingUser = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM Users WHERE id = @id');

    if (existingUser.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Deletar usuário
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Users WHERE id = @id');

    res.json({ message: 'Usuário deletado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
