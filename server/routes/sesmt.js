import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Helper para gerar URLs completas de imagens
const generateImageUrl = (filename) => {
  return `http://localhost:3001/uploads/${filename}`;
};

// Middleware para verificar se o usuário tem role SESMT
const checkSESMTRole = (req, res, next) => {
  const allowedRoles = ['sesmt', 'supervisor', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Você não tem permissão para acessar o módulo SESMT'
    });
  }
  next();
};

// =====================================================
// ROTAS PARA TIPOS DE OCORRÊNCIAS
// =====================================================

// Buscar todos os tipos de ocorrências
router.get('/occurrence-types', checkSESMTRole, async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .query(`
        SELECT id, name, description, severity, isActive, createdAt
        FROM SESMTOccurrenceTypes
        WHERE isActive = 1
        ORDER BY severity DESC, name
      `);
    
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Erro ao buscar tipos de ocorrências:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS PARA OCORRÊNCIAS SESMT
// =====================================================

// Buscar todas as ocorrências
router.get('/occurrences', checkSESMTRole, async (req, res) => {
  try {
    const { area, status, severity, type, startDate, endDate } = req.query;
    const pool = await getConnection();
    
    let query = `
      SELECT 
        o.id,
        o.areaId,
        o.occurrenceTypeId,
        o.title,
        o.description,
        o.severity,
        o.status,
        o.reportedBy,
        o.involvedPersons,
        o.dateTimeOccurrence,
        o.dateTimeReport,
        o.location,
        o.weatherConditions,
        o.equipmentInvolved,
        o.immediateActions,
        o.recommendations,
        o.photos,
        o.documents,
        o.isConfidential,
        o.createdAt,
        o.updatedAt,
        a.name as areaName,
        ot.name as occurrenceTypeName,
        ot.severity as typeSeverity,
        u.name as reporterName
      FROM SESMTOccurrences o
      JOIN Areas a ON o.areaId = a.id
      JOIN SESMTOccurrenceTypes ot ON o.occurrenceTypeId = ot.id
      JOIN Users u ON o.reportedBy = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (area) {
      query += ' AND o.areaId = @areaId';
      params.push({ name: 'areaId', type: sql.Int, value: parseInt(area) });
    }
    
    if (status) {
      query += ' AND o.status = @status';
      params.push({ name: 'status', type: sql.NVarChar, value: status });
    }
    
    if (severity) {
      query += ' AND o.severity = @severity';
      params.push({ name: 'severity', type: sql.NVarChar, value: severity });
    }
    
    if (type) {
      query += ' AND o.occurrenceTypeId = @typeId';
      params.push({ name: 'typeId', type: sql.Int, value: parseInt(type) });
    }
    
    if (startDate) {
      query += ' AND o.dateTimeOccurrence >= @startDate';
      params.push({ name: 'startDate', type: sql.DateTime, value: new Date(startDate) });
    }
    
    if (endDate) {
      query += ' AND o.dateTimeOccurrence <= @endDate';
      params.push({ name: 'endDate', type: sql.DateTime, value: new Date(endDate) });
    }
    
    query += ' ORDER BY o.dateTimeOccurrence DESC';
    
    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    
    // Processar fotos e documentos (JSON strings)
    const occurrences = result.recordset.map(item => ({
      ...item,
      photos: item.photos ? JSON.parse(item.photos) : [],
      documents: item.documents ? JSON.parse(item.documents) : []
    }));
    
    res.json(occurrences);
    
  } catch (error) {
    console.error('Erro ao buscar ocorrências:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar ocorrência específica
router.get('/occurrences/:id', checkSESMTRole, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          o.*,
          a.name as areaName,
          ot.name as occurrenceTypeName,
          ot.severity as typeSeverity,
          u.name as reporterName
        FROM SESMTOccurrences o
        JOIN Areas a ON o.areaId = a.id
        JOIN SESMTOccurrenceTypes ot ON o.occurrenceTypeId = ot.id
        JOIN Users u ON o.reportedBy = u.id
        WHERE o.id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Ocorrência não encontrada' });
    }
    
    const occurrence = result.recordset[0];
    
    // Processar fotos e documentos
    occurrence.photos = occurrence.photos ? JSON.parse(occurrence.photos) : [];
    occurrence.documents = occurrence.documents ? JSON.parse(occurrence.documents) : [];
    
    res.json(occurrence);
    
  } catch (error) {
    console.error('Erro ao buscar ocorrência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova ocorrência
router.post('/occurrences', checkSESMTRole, upload.array('photos', 10), async (req, res) => {
  try {
    const {
      areaId,
      occurrenceTypeId,
      title,
      description,
      severity,
      involvedPersons,
      dateTimeOccurrence,
      location,
      weatherConditions,
      equipmentInvolved,
      immediateActions,
      recommendations,
      isConfidential
    } = req.body;
    
    if (!areaId || !occurrenceTypeId || !title || !dateTimeOccurrence) {
      const missingFields = [];
      if (!areaId) missingFields.push('areaId');
      if (!occurrenceTypeId) missingFields.push('occurrenceTypeId');
      if (!title) missingFields.push('title');
      if (!dateTimeOccurrence) missingFields.push('dateTimeOccurrence');
      
      return res.status(400).json({ 
        error: 'Campos obrigatórios faltando',
        missingFields: missingFields,
        receivedData: {
          areaId,
          occurrenceTypeId,
          title,
          dateTimeOccurrence
        }
      });
    }
    
    const pool = await getConnection();
    
    // Processar fotos enviadas
    const photoUrls = req.files ? req.files.map(file => generateImageUrl(file.filename)) : [];
    
    const result = await pool.request()
      .input('areaId', sql.Int, areaId)
      .input('occurrenceTypeId', sql.Int, occurrenceTypeId)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('severity', sql.NVarChar, severity)
      .input('reportedBy', sql.Int, req.user.id)
      .input('involvedPersons', sql.NVarChar, involvedPersons)
      .input('dateTimeOccurrence', sql.DateTime, new Date(dateTimeOccurrence))
      .input('location', sql.NVarChar, location)
      .input('weatherConditions', sql.NVarChar, weatherConditions)
      .input('equipmentInvolved', sql.NVarChar, equipmentInvolved)
      .input('immediateActions', sql.NVarChar, immediateActions)
      .input('recommendations', sql.NVarChar, recommendations)
      .input('photos', sql.NVarChar, photoUrls.length > 0 ? JSON.stringify(photoUrls) : null)
      .input('isConfidential', sql.Bit, isConfidential === 'true' ? 1 : 0)
      .query(`
        INSERT INTO SESMTOccurrences (
          areaId, occurrenceTypeId, title, description, severity, reportedBy,
          involvedPersons, dateTimeOccurrence, location, weatherConditions,
          equipmentInvolved, immediateActions, recommendations, photos, isConfidential
        )
        OUTPUT INSERTED.id, INSERTED.title, INSERTED.severity, INSERTED.status
        VALUES (
          @areaId, @occurrenceTypeId, @title, @description, @severity, @reportedBy,
          @involvedPersons, @dateTimeOccurrence, @location, @weatherConditions,
          @equipmentInvolved, @immediateActions, @recommendations, @photos, @isConfidential
        )
      `);
    
    const newOccurrence = result.recordset[0];
    
    // Registrar no histórico
    await pool.request()
      .input('occurrenceId', sql.Int, newOccurrence.id)
      .input('userId', sql.Int, req.user.id)
      .input('action', sql.NVarChar, 'created')
      .input('newStatus', sql.NVarChar, 'open')
      .input('comments', sql.NVarChar, 'Ocorrência registrada')
      .query(`
        INSERT INTO SESMTOccurrenceHistory (
          occurrenceId, userId, action, newStatus, comments
        )
        VALUES (@occurrenceId, @userId, @action, @newStatus, @comments)
      `);
    
    res.status(201).json({
      message: 'Ocorrência registrada com sucesso',
      occurrence: newOccurrence
    });
    
  } catch (error) {
    console.error('Erro ao criar ocorrência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar ocorrência
router.put('/occurrences/:id', checkSESMTRole, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      severity,
      status,
      involvedPersons,
      location,
      weatherConditions,
      equipmentInvolved,
      immediateActions,
      recommendations,
      isConfidential
    } = req.body;
    
    const pool = await getConnection();
    
    // Buscar ocorrência atual
    const currentOccurrence = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT status, severity FROM SESMTOccurrences WHERE id = @id');
    
    if (currentOccurrence.recordset.length === 0) {
      return res.status(404).json({ error: 'Ocorrência não encontrada' });
    }
    
    const previousStatus = currentOccurrence.recordset[0].status;
    const previousSeverity = currentOccurrence.recordset[0].severity;
    
    // Construir query de atualização
    let updateQuery = 'UPDATE SESMTOccurrences SET updatedAt = GETDATE()';
    const params = [{ name: 'id', type: sql.Int, value: id }];
    
    if (title) {
      updateQuery += ', title = @title';
      params.push({ name: 'title', type: sql.NVarChar, value: title });
    }
    
    if (description !== undefined) {
      updateQuery += ', description = @description';
      params.push({ name: 'description', type: sql.NVarChar, value: description });
    }
    
    if (severity) {
      updateQuery += ', severity = @severity';
      params.push({ name: 'severity', type: sql.NVarChar, value: severity });
    }
    
    if (status) {
      updateQuery += ', status = @status';
      params.push({ name: 'status', type: sql.NVarChar, value: status });
    }
    
    if (involvedPersons !== undefined) {
      updateQuery += ', involvedPersons = @involvedPersons';
      params.push({ name: 'involvedPersons', type: sql.NVarChar, value: involvedPersons });
    }
    
    if (location !== undefined) {
      updateQuery += ', location = @location';
      params.push({ name: 'location', type: sql.NVarChar, value: location });
    }
    
    if (weatherConditions !== undefined) {
      updateQuery += ', weatherConditions = @weatherConditions';
      params.push({ name: 'weatherConditions', type: sql.NVarChar, value: weatherConditions });
    }
    
    if (equipmentInvolved !== undefined) {
      updateQuery += ', equipmentInvolved = @equipmentInvolved';
      params.push({ name: 'equipmentInvolved', type: sql.NVarChar, value: equipmentInvolved });
    }
    
    if (immediateActions !== undefined) {
      updateQuery += ', immediateActions = @immediateActions';
      params.push({ name: 'immediateActions', type: sql.NVarChar, value: immediateActions });
    }
    
    if (recommendations !== undefined) {
      updateQuery += ', recommendations = @recommendations';
      params.push({ name: 'recommendations', type: sql.NVarChar, value: recommendations });
    }
    
    if (isConfidential !== undefined) {
      updateQuery += ', isConfidential = @isConfidential';
      params.push({ name: 'isConfidential', type: sql.Bit, value: isConfidential === 'true' ? 1 : 0 });
    }
    
    updateQuery += ' WHERE id = @id';
    
    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    await request.query(updateQuery);
    
    // Registrar mudanças no histórico
    if (status && status !== previousStatus) {
      await pool.request()
        .input('occurrenceId', sql.Int, id)
        .input('userId', sql.Int, req.user.id)
        .input('action', sql.NVarChar, 'status_changed')
        .input('previousStatus', sql.NVarChar, previousStatus)
        .input('newStatus', sql.NVarChar, status)
        .input('comments', sql.NVarChar, `Status alterado de ${previousStatus} para ${status}`)
        .query(`
          INSERT INTO SESMTOccurrenceHistory (
            occurrenceId, userId, action, previousStatus, newStatus, comments
          )
          VALUES (@occurrenceId, @userId, @action, @previousStatus, @newStatus, @comments)
        `);
    }
    
    if (severity && severity !== previousSeverity) {
      await pool.request()
        .input('occurrenceId', sql.Int, id)
        .input('userId', sql.Int, req.user.id)
        .input('action', sql.NVarChar, 'updated')
        .input('previousSeverity', sql.NVarChar, previousSeverity)
        .input('newSeverity', sql.NVarChar, severity)
        .input('comments', sql.NVarChar, `Severidade alterada de ${previousSeverity} para ${severity}`)
        .query(`
          INSERT INTO SESMTOccurrenceHistory (
            occurrenceId, userId, action, previousSeverity, newSeverity, comments
          )
          VALUES (@occurrenceId, @userId, @action, @previousSeverity, @newSeverity, @comments)
        `);
    }
    
    res.json({ message: 'Ocorrência atualizada com sucesso' });
    
  } catch (error) {
    console.error('Erro ao atualizar ocorrência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS PARA COMENTÁRIOS
// =====================================================

// Buscar comentários de uma ocorrência
router.get('/occurrences/:id/comments', checkSESMTRole, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          c.id,
          c.occurrenceId,
          c.userId,
          c.comment,
          c.photos,
          c.documents,
          c.isInternal,
          c.createdAt,
          u.name as userName
        FROM SESMTOccurrenceComments c
        JOIN Users u ON c.userId = u.id
        WHERE c.occurrenceId = @id
        ORDER BY c.createdAt DESC
      `);
    
    // Processar fotos e documentos
    const comments = result.recordset.map(item => ({
      ...item,
      photos: item.photos ? JSON.parse(item.photos) : [],
      documents: item.documents ? JSON.parse(item.documents) : []
    }));
    
    res.json(comments);
    
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar comentário
router.post('/occurrences/:id/comments', checkSESMTRole, upload.array('photos', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isInternal } = req.body;
    
    if (!comment) {
      return res.status(400).json({ error: 'Comentário é obrigatório' });
    }
    
    const pool = await getConnection();
    
    // Processar fotos enviadas
    const photoUrls = req.files ? req.files.map(file => generateImageUrl(file.filename)) : [];
    
    const result = await pool.request()
      .input('occurrenceId', sql.Int, id)
      .input('userId', sql.Int, req.user.id)
      .input('comment', sql.NVarChar, comment)
      .input('photos', sql.NVarChar, photoUrls.length > 0 ? JSON.stringify(photoUrls) : null)
      .input('isInternal', sql.Bit, isInternal === 'true' ? 1 : 0)
      .query(`
        INSERT INTO SESMTOccurrenceComments (
          occurrenceId, userId, comment, photos, isInternal
        )
        OUTPUT INSERTED.id, INSERTED.comment, INSERTED.createdAt
        VALUES (@occurrenceId, @userId, @comment, @photos, @isInternal)
      `);
    
    // Registrar no histórico
    await pool.request()
      .input('occurrenceId', sql.Int, id)
      .input('userId', sql.Int, req.user.id)
      .input('action', sql.NVarChar, 'commented')
      .input('comments', sql.NVarChar, 'Comentário adicionado')
      .query(`
        INSERT INTO SESMTOccurrenceHistory (
          occurrenceId, userId, action, comments
        )
        VALUES (@occurrenceId, @userId, @action, @comments)
      `);
    
    res.status(201).json({
      message: 'Comentário adicionado com sucesso',
      comment: result.recordset[0]
    });
    
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS PARA HISTÓRICO
// =====================================================

// Buscar histórico de uma ocorrência
router.get('/occurrences/:id/history', checkSESMTRole, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          h.id,
          h.occurrenceId,
          h.userId,
          h.action,
          h.previousStatus,
          h.newStatus,
          h.previousSeverity,
          h.newSeverity,
          h.comments,
          h.photos,
          h.documents,
          h.createdAt,
          u.name as userName
        FROM SESMTOccurrenceHistory h
        JOIN Users u ON h.userId = u.id
        WHERE h.occurrenceId = @id
        ORDER BY h.createdAt DESC
      `);
    
    // Processar fotos e documentos
    const history = result.recordset.map(item => ({
      ...item,
      photos: item.photos ? JSON.parse(item.photos) : [],
      documents: item.documents ? JSON.parse(item.documents) : []
    }));
    
    res.json(history);
    
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS PARA ESTATÍSTICAS
// =====================================================

// Buscar estatísticas SESMT para dashboard
router.get('/stats', checkSESMTRole, async (req, res) => {
  try {
    const pool = await getConnection();
    
    // Total de ocorrências por status
    const statusStats = await pool.request()
      .query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM SESMTOccurrences
        GROUP BY status
      `);
    
    // Total de ocorrências por severidade
    const severityStats = await pool.request()
      .query(`
        SELECT 
          severity,
          COUNT(*) as count
        FROM SESMTOccurrences
        GROUP BY severity
      `);
    
    // Total de ocorrências por tipo
    const typeStats = await pool.request()
      .query(`
        SELECT 
          ot.name as typeName,
          COUNT(*) as count
        FROM SESMTOccurrences o
        JOIN SESMTOccurrenceTypes ot ON o.occurrenceTypeId = ot.id
        GROUP BY ot.name
        ORDER BY count DESC
      `);
    
    // Ocorrências por área
    const areaStats = await pool.request()
      .query(`
        SELECT 
          a.name as areaName,
          COUNT(*) as count
        FROM SESMTOccurrences o
        JOIN Areas a ON o.areaId = a.id
        GROUP BY a.name
        ORDER BY count DESC
      `);
    
    // Ocorrências dos últimos 30 dias
    const recentStats = await pool.request()
      .query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as critical,
          COUNT(CASE WHEN occurrenceTypeId IN (1, 2) THEN 1 END) as accidents_incidents
        FROM SESMTOccurrences
        WHERE dateTimeOccurrence >= DATEADD(day, -30, GETDATE())
      `);
    
    res.json({
      statusStats: statusStats.recordset,
      severityStats: severityStats.recordset,
      typeStats: typeStats.recordset,
      areaStats: areaStats.recordset,
      recentStats: recentStats.recordset[0]
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
