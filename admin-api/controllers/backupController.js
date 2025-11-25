const logger = require('pino')();
const backupService = require('../services/backupService');
const { logWithCorrelationId } = require('../middleware/correlationId');
const auditLogService = require('../services/auditLogService');

// Create a backup of a server
const createBackup = async (req, res, next) => {
  const server = req.params.server;
  
  try {
    logWithCorrelationId(logger, req, 'info', `Creating backup for server: ${server}`);
    
    const result = await backupService.createBackup(server);
    
    // Audit log the action
    auditLogService.logServerAction('BACKUP_CREATE', req, server, { backupPath: result.backupPath });
    
    res.json(result);
  } catch (error) {
    logWithCorrelationId(logger, req, 'error', `Failed to create backup for ${server}`, { error: error.message });
    next(error);
  }
};

// List available backups for a server
const listBackups = async (req, res, next) => {
  const server = req.params.server;
  
  try {
    logWithCorrelationId(logger, req, 'info', `Listing backups for server: ${server}`);
    
    const backups = await backupService.listBackups(server);
    
    res.json({ server, backups });
  } catch (error) {
    logWithCorrelationId(logger, req, 'error', `Failed to list backups for ${server}`, { error: error.message });
    next(error);
  }
};

// Restore a backup to a server
const restoreBackup = async (req, res, next) => {
  const server = req.params.server;
  const { backupName } = req.body;
  
  if (!backupName) {
    const error = new Error('Missing backup name in request body');
    error.statusCode = 400;
    return next(error);
  }
  
  try {
    logWithCorrelationId(logger, req, 'info', `Restoring backup ${backupName} for server: ${server}`);
    
    const result = await backupService.restoreBackup(server, backupName);
    
    // Audit log the action
    auditLogService.logServerAction('BACKUP_RESTORE', req, server, { backupName });
    
    res.json(result);
  } catch (error) {
    logWithCorrelationId(logger, req, 'error', `Failed to restore backup ${backupName} for ${server}`, { error: error.message });
    next(error);
  }
};

// Delete a backup
const deleteBackup = async (req, res, next) => {
  const server = req.params.server;
  const { backupName } = req.body;
  
  if (!backupName) {
    const error = new Error('Missing backup name in request body');
    error.statusCode = 400;
    return next(error);
  }
  
  try {
    logWithCorrelationId(logger, req, 'info', `Deleting backup ${backupName} for server: ${server}`);
    
    const result = await backupService.deleteBackup(server, backupName);
    
    // Audit log the action
    auditLogService.logServerAction('BACKUP_DELETE', req, server, { backupName });
    
    res.json(result);
  } catch (error) {
    logWithCorrelationId(logger, req, 'error', `Failed to delete backup ${backupName} for ${server}`, { error: error.message });
    next(error);
  }
};

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup
};