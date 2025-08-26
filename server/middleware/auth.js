import jwt from 'jsonwebtoken';
import { getConnection, sql } from '../config/database.js';
import { config } from '../config/env.js';

// Middleware para verificar se o usuário está autenticado
export const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 Autenticando rota:', req.method, req.path);
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ Token não fornecido');
      return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    console.log('✅ Token fornecido, verificando...');
    const decoded = jwt.verify(token, config.JWT_SECRET);
    console.log('✅ Token válido, userId:', decoded.userId);
    
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .query('SELECT id, name, email, role, active FROM Users WHERE id = @userId AND active = 1');

    if (result.recordset.length === 0) {
      console.log('❌ Usuário não encontrado ou inativo');
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    req.user = result.recordset[0];
    console.log('✅ Usuário autenticado:', req.user.name, 'Role:', req.user.role);
    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar permissões específicas
export const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const pool = await getConnection();
      
      // Buscar permissão do usuário
      const result = await pool.request()
        .input('role', sql.NVarChar, req.user.role)
        .input('resource', sql.NVarChar, resource)
        .input('action', sql.NVarChar, action)
        .query(`
          SELECT COUNT(*) as hasPermission
          FROM RolePermissions rp
          JOIN Permissions p ON rp.permissionId = p.id
          WHERE rp.role = @role 
            AND p.resource = @resource 
            AND p.action = @action
            AND rp.granted = 1
        `);

      if (result.recordset[0].hasPermission === 0) {
        return res.status(403).json({ 
          error: 'Acesso negado',
          message: `Você não tem permissão para ${action} ${resource}`
        });
      }

      next();
    } catch (error) {
      console.error('Erro na verificação de permissão:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

// Middleware para registrar log de auditoria
export const auditLog = (action, resource) => {
  return async (req, res, next) => {
    try {
      const originalSend = res.send;
      res.send = function(data) {
        // Registrar log após a resposta ser enviada
        setTimeout(async () => {
          try {
            const pool = await getConnection();
            await pool.request()
              .input('userId', sql.Int, req.user.id)
              .input('action', sql.NVarChar, action)
              .input('resource', sql.NVarChar, resource)
              .input('resourceId', sql.Int, req.params.id || null)
              .input('details', sql.NVarChar, JSON.stringify({
                method: req.method,
                url: req.url,
                body: req.body,
                response: data
              }))
              .input('ipAddress', sql.NVarChar, req.ip || req.connection.remoteAddress)
              .input('userAgent', sql.NVarChar, req.headers['user-agent'])
              .query(`
                INSERT INTO AuditLog (userId, action, resource, resourceId, details, ipAddress, userAgent)
                VALUES (@userId, @action, @resource, @resourceId, @details, @ipAddress, @userAgent)
              `);
          } catch (error) {
            console.error('Erro ao registrar log de auditoria:', error);
          }
        }, 100);

        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Erro no middleware de auditoria:', error);
      next();
    }
  };
};

// Helper para verificar se o usuário tem uma permissão específica
export const hasPermission = async (userId, resource, action) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('resource', sql.NVarChar, resource)
      .input('action', sql.NVarChar, action)
      .query(`
        SELECT COUNT(*) as hasPermission
        FROM Users u
        JOIN RolePermissions rp ON u.role = rp.role
        JOIN Permissions p ON rp.permissionId = p.id
        WHERE u.id = @userId 
          AND p.resource = @resource 
          AND p.action = @action
          AND rp.granted = 1
          AND u.active = 1
      `);

    return result.recordset[0].hasPermission > 0;
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
};
