const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const basicAuth = require('express-basic-auth');
const app = express();
const port = process.env.PORT || 3000;

// Security: Use environment variables for credentials or default values
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// Middleware
app.use(express.json());

// Apply basic authentication to all routes except public endpoints
app.use((req, res, next) => {
    // Define public routes that don't require authentication
    const publicRoutes = [
        '/stats',
        '/debug/historical-data',
        '/api/public/status/mc-ilias',
        '/api/public/status/mc-niilo',
        '/api/public/status/all'
    ];

    if (publicRoutes.includes(req.path) || req.path.startsWith('/api/public/') || req.path.startsWith('/debug/')) {
        // Skip authentication for public routes
        next();
    } else {
        // Apply authentication for all other routes
        basicAuth({
            users: { [ADMIN_USER]: ADMIN_PASS },
            challenge: true,
            realm: 'Minecraft Admin Area'
        })(req, res, next);
    }
});

app.use(express.static('.'));

// API endpoints for server management
app.post('/api/start/:server', (req, res) => {
    const server = req.params.server;
    const command = `docker start ${server}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting ${server}:`, error);
            return res.status(500).json({ error: 'Failed to start server', details: error.message });
        }
        res.json({ success: true, message: `${server} started`, stdout: stdout });
    });
});

app.post('/api/stop/:server', (req, res) => {
    const server = req.params.server;
    const command = `docker stop ${server}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error stopping ${server}:`, error);
            return res.status(500).json({ error: 'Failed to stop server', details: error.message });
        }
        res.json({ success: true, message: `${server} stopped`, stdout: stdout });
    });
});

app.post('/api/restart/:server', (req, res) => {
    const server = req.params.server;
    const command = `docker restart ${server}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error restarting ${server}:`, error);
            return res.status(500).json({ error: 'Failed to restart server', details: error.message });
        }
        res.json({ success: true, message: `${server} restarted`, stdout: stdout });
    });
});

app.get('/api/status/:server', (req, res) => {
    const server = req.params.server;

    // Get container status
    const statusCommand = `docker inspect ${server} --format='{{.State.Status}}'`;

    exec(statusCommand, (error, stdout, stderr) => {
        if (error) {
            // If container doesn't exist, docker returns error
            if (stderr && stderr.includes("No such object")) {
                return res.json({
                    server: server,
                    status: 'Stopped',
                    rawStatus: 'container not found',
                    players: 0,
                    uptime: '0s',
                    cpu: '0%',
                    memory: '0MB',
                    version: '1.21.10',
                    world: 'N/A'
                });
            }
            console.error(`Error getting status for ${server}:`, error);
            return res.status(500).json({ error: 'Failed to get server status', details: error.message });
        }

        const status = stdout.trim();
        const isRunning = status === 'running';

        if (!isRunning) {
            // If not running, return basic stopped status
            return res.json({
                server: server,
                status: 'Stopped',
                rawStatus: status,
                players: 0,
                uptime: '0s',
                cpu: '0%',
                memory: '0MB',
                version: '1.21.10',
                world: 'N/A'
            });
        }

        // If running, get additional stats
        const statsCommand = `docker stats ${server} --no-stream --format='{{.CPUPerc}},{{.MemUsage}}' 2>/dev/null || echo "N/A,N/A"`;
        exec(statsCommand, (statsError, statsStdout) => {
            let cpu = 'N/A';
            let memory = 'N/A';

            if (!statsError) {
                const statsParts = statsStdout.trim().split(',');
                if (statsParts.length >= 2) {
                    cpu = statsParts[0] || 'N/A';
                    memory = statsParts[1] ? statsParts[1].split('/')[0].trim() : 'N/A';
                }
            }

            // For a more realistic player count, we could check the server logs or use RCON
            // For now, we'll try to get player data from logs
            exec(`docker exec ${server} timeout 3 bash -c 'ls -la /home/minecraft/server/logs/latest.log 2>/dev/null && tail -100 /home/minecraft/server/logs/latest.log | grep -i "joined" | wc -l'`, (logError, playerCountStdout) => {
                let players = 0;
                if (!logError && playerCountStdout) {
                    players = parseInt(playerCountStdout.trim()) || 0;
                }

                // Get container uptime
                exec(`docker inspect ${server} --format='{{.State.StartedAt}}'`, (timeError, timeStdout) => {
                    let uptime = 'N/A';
                    if (!timeError) {
                        try {
                            const startTime = new Date(timeStdout.trim());
                            const now = new Date();
                            const diffSeconds = Math.floor((now - startTime) / 1000);
                            uptime = formatUptime(diffSeconds);
                        } catch (e) {
                            uptime = 'N/A';
                        }
                    }

                    res.json({
                        server: server,
                        status: 'Running',
                        rawStatus: status,
                        players: players,
                        uptime: uptime,
                        cpu: cpu,
                        memory: memory,
                        version: '1.21.10', // Default version, could be retrieved from server if needed
                        world: 'Overworld' // Default world name, could be more dynamic
                    });
                });
            });
        });
    });
});

// API endpoint for adding admin to server
app.post('/api/admin/add/:server', (req, res) => {
    const server = req.params.server;
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Execute Minecraft command to add operator via rcon if available, or to ops.json
    const command = `docker exec ${server} /usr/bin/java -jar /home/minecraft/server/eula.txt && docker exec ${server} timeout 10 /home/minecraft/server/run.sh "op ${username}" || docker exec ${server} bash -c "echo '{\\\"uuid\\\":\\\"$(docker exec ${server} grep -m1 -o '\\w\\{8\\}-\\w\\{4\\}-\\w\\{4\\}-\\w\\{4\\}-\\w\\{12\\}' /home/minecraft/server/logs/latest.log | grep -o '\\w\\{8\\}-\\w\\{4\\}-\\w\\{4\\}-\\w\\{4\\}-\\w\\{12\\}' | head -1)\\\",\\\"name\\\":\\\"${username}\\\",\\\"level\\\":4,\\\"bypassesPlayerLimit\\\":false}' >> /home/minecraft/server/ops.json && chmod 644 /home/minecraft/server/ops.json"`;

    // A simpler approach: execute op command directly in the server
    const simpleCommand = `docker exec ${server} timeout 5 bash -c 'echo "op ${username}" > /home/minecraft/server/server-input.txt'`;

    exec(simpleCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error adding admin ${username} to ${server}:`, error);
            return res.status(500).json({ error: 'Failed to add admin to server', details: error.message });
        }
        res.json({ success: true, message: `Added ${username} as admin to ${server}`, stdout: stdout });
    });
});

// API endpoint for removing admin from server
app.post('/api/admin/remove/:server', (req, res) => {
    const server = req.params.server;
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Execute Minecraft command to remove operator
    const simpleCommand = `docker exec ${server} timeout 5 bash -c 'echo "deop ${username}" > /home/minecraft/server/server-input.txt'`;

    exec(simpleCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error removing admin ${username} from ${server}:`, error);
            return res.status(500).json({ error: 'Failed to remove admin from server', details: error.message });
        }
        res.json({ success: true, message: `Removed ${username} as admin from ${server}`, stdout: stdout });
    });
});

// API endpoint for downloading world
app.get('/api/download/world/:server', (req, res) => {
    const server = req.params.server;

    // First, stop the server temporarily to ensure data consistency
    exec(`docker stop ${server}`, (stopError) => {
        if (stopError) {
            console.warn(`Warning: Could not stop ${server} before backup:`, stopError.message);
            // Continue with backup even if stop fails, as the container might already be stopped
        }

        // Create a temporary directory for the world data
        const worldDir = `/tmp/${server}-world`;
        const zipPath = `/tmp/${server}-world.zip`;

        // Remove any existing temporary files
        exec(`rm -rf ${worldDir} ${zipPath}`, (cleanError) => {
            if (cleanError) {
                console.error('Error cleaning up temp files:', cleanError);
            }

            // Copy world data from container to temp directory
            const copyCommand = `docker cp ${server}:/home/minecraft/server/world ${worldDir}`;
            exec(copyCommand, (copyError) => {
                if (copyError) {
                    // If world directory doesn't exist, try common world names
                    const possibleWorldDirs = ['world', 'world_nether', 'world_the_end', 'DIM-1', 'DIM1'];
                    let attempt = 0;

                    function tryNextWorldDir() {
                        if (attempt >= possibleWorldDirs.length) {
                            // If all attempts failed, start the server again and return error
                            exec(`docker start ${server}`, (startError) => {
                                if (startError) {
                                    console.error(`Error starting ${server} after failed backup:`, startError);
                                }
                                res.status(500).json({ error: `Failed to copy world data from ${server}`, details: copyError.message });
                            });
                            return;
                        }

                        const worldDirName = possibleWorldDirs[attempt];
                        const copyCommand = `docker cp ${server}:/home/minecraft/server/${worldDirName} ${worldDir}/${worldDirName}`;

                        exec(copyCommand, (nextCopyError) => {
                            if (nextCopyError) {
                                console.log(`Attempted to copy ${worldDirName}:`, nextCopyError.message);
                                attempt++;
                                tryNextWorldDir();
                            } else {
                                // Successfully copied, now create the zip
                                createZip();
                            }
                        });
                    }

                    tryNextWorldDir();
                    return;
                }

                // World data copied successfully, now create the zip
                createZip();
            });

            function createZip() {
                const output = fs.createWriteStream(zipPath);
                const archive = archiver('zip', {
                    zlib: { level: 9 } // Maximum compression
                });

                output.on('close', () => {
                    // Stream the zip file back to client
                    res.setHeader('Content-Disposition', `attachment; filename="${server}-world.zip"`);
                    res.setHeader('Content-Type', 'application/zip');

                    // Stream the file
                    const fileStream = fs.createReadStream(zipPath);
                    fileStream.pipe(res);

                    // Clean up temporary files after download
                    fileStream.on('end', () => {
                        // Start the server again after download
                        exec(`docker start ${server}`, (startError) => {
                            if (startError) {
                                console.error(`Error starting ${server} after backup:`, startError);
                            }

                            // Clean up temp files
                            setTimeout(() => {
                                exec(`rm -rf ${worldDir} ${zipPath}`, (cleanError) => {
                                    if (cleanError) {
                                        console.error('Error cleaning up temp files:', cleanError);
                                    }
                                });
                            }, 2000); // Wait a moment before cleaning up
                        });
                    });
                });

                archive.on('error', (err) => {
                    console.error('Archive error:', err);
                    res.status(500).json({ error: 'Failed to create zip archive', details: err.message });

                    // Start the server again
                    exec(`docker start ${server}`, (startError) => {
                        if (startError) {
                            console.error(`Error starting ${server} after failed backup:`, startError);
                        }
                    });
                });

                archive.pipe(output);

                // Add the world directory to the archive
                archive.directory(worldDir, false);

                // Finalize the archive
                archive.finalize();
            }
        });
    });
});

// Public endpoint to get status of all servers
app.get('/api/public/status/all', (req, res) => {
    const servers = ['mc-ilias', 'mc-niilo'];
    const results = {};
    let completed = 0;

    const checkComplete = () => {
        completed++;
        if (completed === servers.length) {
            res.json(results);
        }
    };

    servers.forEach(server => {
        exec(`docker inspect ${server} --format='{{.State.Status}}'`, (statusError, statusStdout, statusStderr) => {
            if (statusError) {
                results[server] = {
                    server: server,
                    status: 'Stopped',
                    rawStatus: statusStderr && statusStderr.includes("No such object") ? 'container not found' : 'error',
                    players: [],
                    playerCount: 0,
                    memory: 'N/A',
                    cpu: 'N/A'
                };
                checkComplete();
            } else {
                const status = statusStdout.trim();

                if (status !== 'running') {
                    results[server] = {
                        server: server,
                        status: status === 'running' ? 'Running' : 'Stopped',
                        rawStatus: status,
                        players: [],
                        playerCount: 0,
                        memory: 'N/A',
                        cpu: 'N/A'
                    };
                    checkComplete();
                } else {
                    // Get memory and CPU usage with docker stats
                    exec(`docker stats ${server} --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}"`, (statsError, statsStdout) => {
                        let memory = 'N/A';
                        let cpu = 'N/A';

                        if (!statsError) {
                            // Parse the memory usage (format: "used / total")
                            const statsLines = statsStdout.trim().split('\n');
                            if (statsLines.length > 1) {
                                const stats = statsLines[1].split(/\s+/);
                                cpu = stats[0] || 'N/A';
                                memory = stats[1] || 'N/A';
                            }
                        }

                        // Check for active players
                        exec(`docker exec ${server} timeout 3 bash -c 'ls -la /home/minecraft/server/logs/latest.log 2>/dev/null && tail -100 /home/minecraft/server/logs/latest.log | grep -i "joined" | tail -5'`, (logError, logStdout) => {
                            let players = [];
                            if (!logError && logStdout) {
                                const lines = logStdout.split('\n');
                                lines.forEach(line => {
                                    const match = line.match(/(\w+) joined the game/);
                                    if (match && match[1]) {
                                        players.push(match[1]);
                                    }
                                });
                            }

                            players = [...new Set(players)];

                            results[server] = {
                                server: server,
                                status: status === 'running' ? 'Running' : 'Stopped',
                                rawStatus: status,
                                players: players,
                                playerCount: players.length,
                                memory: memory,
                                cpu: cpu
                            };

                            checkComplete();
                        });
                    });
                }
            }
        });
    });
});

// In-memory storage for historical data (would use database in production)
const historicalData = {};

// Initialize historical data storage for each server
const servers = ['mc-ilias', 'mc-niilo'];
servers.forEach(server => {
    historicalData[server] = [];
});

// Generate seed data for historical statistics (simulated data for the past hour)
function generateSeedData() {
    const now = Date.now();
    // Generate data points for the last hour (one per minute)
    for (let i = 0; i <= 60; i++) {
        const minutesAgo = 60 - i; // 60 minutes ago to 0 minutes ago
        const timestamp = now - (minutesAgo * 60 * 1000); // 1 minute intervals

        // Simulate realistic server metrics
        const playerCount = Math.floor(Math.random() * 10); // 0-9 players
        const cpu = Math.floor(Math.random() * 100); // 0-100%
        const memoryGb = (1.0 + Math.random() * 3.0).toFixed(2); // 1.00 - 4.00 GB

        const dataPoint = {
            timestamp: timestamp,
            cpu: cpu + '%',
            memory: memoryGb + 'GiB',
            playerCount: playerCount,
            status: 'running'
        };

        // Add to each server's historical data
        historicalData['mc-ilias'].push(dataPoint);
        historicalData['mc-niilo'].push({
            timestamp: timestamp,
            cpu: Math.floor(Math.random() * 100) + '%',
            memory: ((1.0 + Math.random() * 3.0)).toFixed(2) + 'GiB',
            playerCount: Math.floor(Math.random() * 10),
            status: 'running'
        });
    }
}

// Generate initial seed data
generateSeedData();

// Debug endpoint to check historical data state
app.get('/debug/historical-data', (req, res) => {
    res.json({
        'mc-ilias-count': historicalData['mc-ilias'] ? historicalData['mc-ilias'].length : 'undefined',
        'mc-niilo-count': historicalData['mc-niilo'] ? historicalData['mc-niilo'].length : 'undefined',
        'mc-ilias-sample': historicalData['mc-ilias'] && historicalData['mc-ilias'].length > 0 ? historicalData['mc-ilias'][0] : 'no data',
        'mc-niilo-sample': historicalData['mc-niilo'] && historicalData['mc-niilo'].length > 0 ? historicalData['mc-niilo'][0] : 'no data',
        timestamp: new Date().toISOString()
    });
});

// Store stats every minute
setInterval(() => {
    const timestamp = Date.now();
    servers.forEach(server => {
        exec(`docker inspect ${server} --format='{{.State.Status}}'`, (statusError, statusStdout) => {
            if (!statusError && statusStdout.trim() === 'running') {
                // Get memory and CPU usage
                exec(`docker stats ${server} --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}"`, (statsError, statsStdout) => {
                    let memory = 'N/A';
                    let cpu = 'N/A';

                    if (!statsError) {
                        const statsLines = statsStdout.trim().split('\n');
                        if (statsLines.length > 1) {
                            const stats = statsLines[1].split(/\s+/);
                            cpu = stats[0] || 'N/A';
                            memory = stats[1] || 'N/A';
                        }
                    }

                    // Get player count
                    exec(`docker exec ${server} timeout 3 bash -c 'ls -la /home/minecraft/server/logs/latest.log 2>/dev/null && tail -100 /home/minecraft/server/logs/latest.log | grep -i "joined" | tail -5'`, (logError, logStdout) => {
                        let playerCount = 0;
                        if (!logError && logStdout) {
                            const lines = logStdout.split('\n');
                            const players = new Set();
                            lines.forEach(line => {
                                const match = line.match(/(\w+) joined the game/);
                                if (match && match[1]) {
                                    players.add(match[1]);
                                }
                            });
                            playerCount = players.size;
                        }

                        // Add data point to historical data
                        const dataPoint = {
                            timestamp: timestamp,
                            cpu: cpu,
                            memory: memory,
                            playerCount: playerCount,
                            status: 'running'
                        };

                        // Add to historical data array for this server
                        historicalData[server].push(dataPoint);

                        // Keep only the last hour of data (3600000 ms = 1 hour)
                        const oneHourAgo = timestamp - 3600000;
                        historicalData[server] = historicalData[server].filter(dp => dp.timestamp > oneHourAgo);
                    });
                });
            } else {
                // Server is not running
                const dataPoint = {
                    timestamp: timestamp,
                    cpu: 'N/A',
                    memory: 'N/A',
                    playerCount: 0,
                    status: 'stopped'
                };

                historicalData[server].push(dataPoint);

                // Keep only the last hour of data
                const oneHourAgo = timestamp - 3600000;
                historicalData[server] = historicalData[server].filter(dp => dp.timestamp > oneHourAgo);
            }
        });
    });
}, 60000); // Store stats every minute

// Public endpoint to get historical data
app.get('/api/public/history/:server', (req, res) => {
    const server = req.params.server;
    if (historicalData[server]) {
        res.json(historicalData[server]);
    } else {
        res.status(404).json({ error: `Server ${server} not found` });
    }
});

// Public endpoint to get all historical data
app.get('/api/public/history', (req, res) => {
    res.json(historicalData);
});

// Public endpoint to get status of individual servers
app.get('/api/public/status/:server', (req, res) => {
    const server = req.params.server;

    // First, get the server status
    exec(`docker inspect ${server} --format='{{.State.Status}}'`, (statusError, statusStdout, statusStderr) => {
        if (statusError) {
            // If container doesn't exist, docker returns error
            if (statusStderr && statusStderr.includes("No such object")) {
                return res.json({
                    server: server,
                    status: 'Stopped',
                    rawStatus: 'container not found',
                    players: [],
                    playerCount: 0,
                    memory: 'N/A',
                    cpu: 'N/A'
                });
            }
            console.error(`Error getting status for ${server}:`, statusError);
            return res.status(500).json({ error: 'Failed to get server status', details: statusError.message });
        }

        const status = statusStdout.trim();

        // If server is not running, no players can be active
        if (status !== 'running') {
            return res.json({
                server: server,
                status: status === 'running' ? 'Running' : 'Stopped',
                rawStatus: status,
                players: [],
                playerCount: 0,
                memory: 'N/A',
                cpu: 'N/A'
            });
        }

        // Get memory and CPU usage
        exec(`docker stats ${server} --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}"`, (statsError, statsStdout) => {
            let memory = 'N/A';
            let cpu = 'N/A';

            if (!statsError) {
                const statsLines = statsStdout.trim().split('\n');
                if (statsLines.length > 1) {
                    const stats = statsLines[1].split(/\s+/);
                    cpu = stats[0] || 'N/A';
                    memory = stats[1] || 'N/A';
                }
            }

            // If server is running, try to get player data by checking server logs or querying the server
            // For now, we'll use a command that can get player info if the server supports RCON
            // Since we can't directly query Minecraft servers without RCON setup, we'll just report status
            // and assume a command to get players could be implemented later

            // For demonstration purposes, let's try to get players using a Minecraft command
            // This requires the server to have RCON enabled or to check logs
            exec(`docker exec ${server} timeout 3 bash -c 'ls -la /home/minecraft/server/logs/latest.log 2>/dev/null && tail -100 /home/minecraft/server/logs/latest.log | grep -i "joined" | tail -5'`, (logError, logStdout) => {
                let players = [];
                if (!logError && logStdout) {
                    // Extract player names from the log (simple parsing)
                    const lines = logStdout.split('\n');
                    lines.forEach(line => {
                        // Look for patterns like "PlayerName joined the game"
                        const match = line.match(/(\w+) joined the game/);
                        if (match && match[1]) {
                            players.push(match[1]);
                        }
                    });
                }

                // Remove duplicates
                players = [...new Set(players)];

                res.json({
                    server: server,
                    status: status === 'running' ? 'Running' : 'Stopped',
                    rawStatus: status,
                    players: players,
                    playerCount: players.length,
                    memory: memory,
                    cpu: cpu
                });
            });
        });
    });
});

// Serve the main admin page (with stats design style)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the public server stats page
// API endpoint to list installed datapacks for a server
app.get('/api/datapacks/:server', (req, res) => {
    const server = req.params.server;
    const serverPath = path.join(__dirname, '..', server, 'datapacks');

    fs.readdir(serverPath, (err, files) => {
        if (err) {
            console.error(`Error reading datapacks directory for ${server}:`, err);
            return res.status(500).json({ error: 'Failed to read datapacks directory', details: err.message });
        }

        // Filter out any non-directory items and format the names
        const datapacks = files.filter(file => {
            const filePath = path.join(serverPath, file);
            return fs.statSync(filePath).isDirectory();
        }).map(datapackDir => {
            // Extract name and version from directory name like "afk display v1.1.14 (MC 1.21-1.21.10)"
            const match = datapackDir.match(/^(.*?)\s+v([\d\.]+(?:\s*[-\w]*)*)\s+\((MC\s+[\d\.\-\w]+)\)/);
            if (match) {
                return {
                    name: match[1],
                    version: match[2],
                    gameVersion: match[3],
                    directory: datapackDir
                };
            } else {
                return {
                    name: datapackDir,
                    version: 'unknown',
                    gameVersion: 'unknown',
                    directory: datapackDir
                };
            }
        });

        res.json({ server: server, datapacks: datapacks });
    });
});

// API endpoint to search for new datapacks/mods
app.get('/api/search/datapacks', (req, res) => {
    const { query } = req.query;

    // This is a mock implementation - in a real system, this would connect to a mod repository API
    // For now, we'll return some example results based on the existing datapacks
    const allDatapacks = [
        { name: "afk display", version: "1.1.14", gameVersion: "MC 1.21-1.21.10", description: "Shows AFK status for players" },
        { name: "armor statues", version: "2.8.20", gameVersion: "MC 1.21-1.21.10", description: "Create armor stand statues" },
        { name: "cauldron concrete", version: "3.0.7", gameVersion: "MC 1.21-1.21.10", description: "New concrete crafting with cauldrons" },
        { name: "cauldron mud", version: "1.0.7", gameVersion: "MC 1.21-1.21.10", description: "Mud creation using cauldrons" },
        { name: "chunk loaders", version: "1.0.15", gameVersion: "MC 1.21-1.21.10", description: "Keep chunks loaded automatically" },
        { name: "custom nether portals", version: "2.3.17", gameVersion: "MC 1.21-1.21.10", description: "Custom nether portal shapes and sizes" },
        { name: "ender chest always drops", version: "1.0.6", gameVersion: "MC 1.21-1.21.10", description: "Ender chests always drop when broken" },
        { name: "fast leaf decay", version: "2.0.19", gameVersion: "MC 1.21-1.21.10", description: "Leaves decay faster when trees are cut" },
        { name: "graves", version: "4.0.4", gameVersion: "MC 1.21-1.21.10", description: "Player graves automatically created on death" },
        { name: "more effective tools", version: "1.0.8", gameVersion: "MC 1.21-1.21.10", description: "More effective tools with enhanced abilities" },
        { name: "name colors", version: "1.0.12", gameVersion: "MC 1.21-1.21.10", description: "Colorize player names in chat" },
        { name: "painting picker", version: "1.1.1", gameVersion: "MC 1.21-1.21.10", description: "Pick up paintings without destroying them" },
        { name: "silk touch budding amethyst", version: "1.0.6", gameVersion: "MC 1.21-1.21.10", description: "Silk touch can be used on budding amethyst" },
        { name: "storm channeling", version: "1.0.6", gameVersion: "MC 1.21-1.21.10", description: "Tridents gain channeling during storms" },
        { name: "track raw statistics", version: "1.7.10", gameVersion: "MC 1.21-1.21.10", description: "Track raw player statistics" },
        { name: "villager workstation highlights", version: "1.1.14", gameVersion: "MC 1.21-1.21.10", description: "Highlight villager workstation blocks" },
        { name: "wandering trader announcements", version: "1.0.7", gameVersion: "MC 1.21-1.21.10", description: "Announce wandering trader arrivals" }
    ];

    // Filter based on query if provided
    const results = query ? allDatapacks.filter(dp =>
        dp.name.toLowerCase().includes(query.toLowerCase())
    ) : allDatapacks;

    res.json({ datapacks: results, total: results.length });
});

// API endpoint to install a datapack (mock implementation)
app.post('/api/install/datapack/:server', (req, res) => {
    const server = req.params.server;
    const { datapackName, version } = req.body;

    // This is a mock implementation - in a real system, this would download and install the datapack
    // For now, we'll just return a success response
    console.log(`Mock installation of ${datapackName} v${version} to ${server}`);

    res.json({
        success: true,
        message: `Mock installation of ${datapackName} v${version} initiated for ${server}`,
        datapack: { name: datapackName, version: version, server: server }
    });
});

app.get('/stats', (req, res) => {
    res.sendFile(path.join(__dirname, 'stats.html'));
});

// Helper function to format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Admin UI server running at http://localhost:${port}`);
});