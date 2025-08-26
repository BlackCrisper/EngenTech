import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getConnection, sql } from '../config/database.js';
import { config } from '../config/env.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM Users WHERE name = @username AND active = 1');

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.name, 
        role: user.role 
      },
      config.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        fullName: user.name,
        role: user.role,
        sector: user.sector || 'all',
        isActive: user.active
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Registrar novo usuário
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, role = 'user' } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
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
      .input('password', sql.NVarChar, hashedPassword)
      .input('fullName', sql.NVarChar, fullName)
      .input('role', sql.NVarChar, role)
      .query(`
        INSERT INTO Users (name, email, password, role, active)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.active
        VALUES (@username, @email, @password, @role, 1)
      `);

    const newUser = result.recordset[0];

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

  // Verificar token
  router.get('/verify', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .query('SELECT id, username, email, fullName, role FROM Users WHERE id = @userId AND isActive = 1');

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    res.json({ 
      valid: true, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Alterar senha
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .query('SELECT password FROM Users WHERE id = @userId');

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .input('newPassword', sql.NVarChar, hashedNewPassword)
      .query('UPDATE Users SET password = @newPassword WHERE id = @userId');

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
