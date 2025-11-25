const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const logger = require('pino')();
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const { isValidServer } = require('./serversService');

// Directory to store backups
const BACKUP_DIR = process.env.BACKUP_DIR || '/backups';

// Create backup directory if it doesn't exist
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    logger.info(`Created backup directory: ${BACKUP_DIR}`);
  }
}

// Create a backup of a Minecraft server
async function createBackup(serverName) {
  if (!isValidServer(serverName)) {
    throw new Error(`Invalid server name: ${serverName}`);
  }

  await ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${serverName}_backup_${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, `${backupName}.tar`);

  try {
    // Stop the server temporarily for a consistent backup
    const container = docker.getContainer(serverName);
    const containerInfo = await container.inspect();
    
    if (containerInfo.State.Running) {
      logger.info(`Stopping ${serverName} for backup...`);
      await container.stop();
    }

    // Create the backup by copying the server's data directory
    // This is a simplified approach - in a real system, you'd need to handle this differently
    // based on how the Docker containers store their data
    const exec = await container.exec({
      Cmd: ['tar', '-czf', `/tmp/${backupName}.tar.gz`, '-C', '/data', '.'],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start();
    
    // Wait for the backup to complete
    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    // Copy the backup file from the container
    const backupStream = await container.getArchive({
      path: `/tmp/${backupName}.tar.gz`
    });

    // Write the backup to the backup directory
    const writeStream = fs.createWriteStream(backupPath);
    await new Promise((resolve, reject) => {
      backupStream.pipe(writeStream);
      backupStream.on('end', resolve);
      backupStream.on('error', reject);
    });

    // Clean up the temporary file in the container
    await container.exec({
      Cmd: ['rm', `/tmp/${backupName}.tar.gz`],
      AttachStdout: true,
      AttachStderr: true
    }).then(exec => exec.start());

    // Restart the server if it was running
    if (containerInfo.State.Running) {
      logger.info(`Restarting ${serverName} after backup...`);
      await container.start();
    }

    logger.info(`Backup completed: ${backupPath}`);
    return {
      success: true,
      backupPath,
      server: serverName,
      timestamp
    };
  } catch (error) {
    // Try to restart the server if it was running and something went wrong during backup
    try {
      const container = docker.getContainer(serverName);
      const containerInfo = await container.inspect();
      if (containerInfo.State.Status === 'exited') {
        await container.start();
      }
    } catch (restartError) {
      logger.error({ err: restartError }, `Failed to restart ${serverName} after backup error`);
    }

    logger.error({ err: error }, `Backup failed for ${serverName}`);
    throw error;
  }
}

// List available backups for a server
async function listBackups(serverName) {
  if (!isValidServer(serverName)) {
    throw new Error(`Invalid server name: ${serverName}`);
  }

  await ensureBackupDir();

  try {
    const files = await fs.readdir(BACKUP_DIR);
    const serverBackups = files
      .filter(file => file.startsWith(`${serverName}_backup_`) && file.endsWith('.tar'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        const timestamp = file.match(/_backup_([0-9T-]+)\.tar/)?.[1] || '';
        return {
          name: file,
          timestamp,
          size: stats.size,
          path: path.join(BACKUP_DIR, file)
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first

    return serverBackups;
  } catch (error) {
    logger.error({ err: error }, `Failed to list backups for ${serverName}`);
    throw error;
  }
}

// Restore a backup to a server
async function restoreBackup(serverName, backupName) {
  if (!isValidServer(serverName)) {
    throw new Error(`Invalid server name: ${serverName}`);
  }

  await ensureBackupDir();

  const backupPath = path.join(BACKUP_DIR, backupName);
  
  // Verify the backup file exists
  try {
    await fs.access(backupPath);
  } catch (error) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  try {
    // Stop the server before restoring
    const container = docker.getContainer(serverName);
    logger.info(`Stopping ${serverName} for restore...`);
    await container.stop();

    // Copy the backup file to the container
    const readStream = fs.createReadStream(backupPath);
    
    // Extract the backup to the server's data directory
    const exec = await container.exec({
      Cmd: ['tar', '-xzf', `/tmp/${backupName}`, '-C', '/data', '--strip-components=1'],
      AttachStdout: true,
      AttachStderr: true
    });

    // Write the backup file to the container
    await container.putArchive(readStream, {
      path: `/tmp/${backupName}`
    });

    const stream = await exec.start();
    
    // Wait for the restore to complete
    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    // Clean up the temporary file in the container
    await container.exec({
      Cmd: ['rm', `/tmp/${backupName}`],
      AttachStdout: true,
      AttachStderr: true
    }).then(exec => exec.start());

    // Restart the server
    logger.info(`Restarting ${serverName} after restore...`);
    await container.start();

    logger.info(`Restore completed: ${serverName} from ${backupName}`);
    return {
      success: true,
      server: serverName,
      backup: backupName
    };
  } catch (error) {
    logger.error({ err: error }, `Restore failed for ${serverName} from ${backupName}`);
    
    // Try to restart the server if restore failed
    try {
      const container = docker.getContainer(serverName);
      await container.start();
    } catch (restartError) {
      logger.error({ err: restartError }, `Failed to restart ${serverName} after restore error`);
    }
    
    throw error;
  }
}

// Delete a backup
async function deleteBackup(serverName, backupName) {
  if (!isValidServer(serverName)) {
    throw new Error(`Invalid server name: ${serverName}`);
  }

  const backupPath = path.join(BACKUP_DIR, backupName);
  
  // Verify the backup file exists and belongs to the server
  if (!backupName.startsWith(`${serverName}_backup_`)) {
    throw new Error(`Backup does not belong to server: ${serverName}`);
  }

  try {
    await fs.unlink(backupPath);
    logger.info(`Deleted backup: ${backupPath}`);
    return {
      success: true,
      server: serverName,
      backup: backupName
    };
  } catch (error) {
    logger.error({ err: error }, `Failed to delete backup: ${backupPath}`);
    throw error;
  }
}

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  BACKUP_DIR
};