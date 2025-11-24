# Post-Deployment Verification Steps

## Immediate Verification Checks

### 1. Check if all containers are running
```bash
docker ps
```
Expected containers should be running:
- mc-admin-ui (on port 3000)
- mc-ilias server
- ilias-admin-ui (on port 3001)
- mc-niilo server
- niilo-admin-ui (on port 3002)
- school-server
- school-admin-ui (on port 3003)
- general-server
- general-admin-ui (on port 3004)

### 2. Verify container health status
```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
```
All containers should show "Up" with healthy status for Minecraft servers.

### 3. Check port accessibility
Test that the admin UIs are accessible:
- Main Admin UI: `curl -I http://localhost:3000`
- mc-ilias Admin UI: `curl -I http://localhost:3001`
- mc-niilo Admin UI: `curl -I http://localhost:3002`
- School Server Admin UI: `curl -I http://localhost:3003`
- General Server Admin UI: `curl -I http://localhost:3004`

### 4. Check service logs for errors
```bash
# Check main admin UI logs
docker logs mc-admin-ui

# Check each server's logs
docker logs mc-ilias
docker logs mc-niilo
docker logs school-server
docker logs general-server
```
Look for any error messages or startup issues.

## Functional Verification Tests

### 1. Test Minecraft server connectivity
Try connecting to the Minecraft servers if port forwarding is configured:
- mc-ilias server at port 25565 (if configured)
- mc-niilo server at port 25565 (if configured)
- School server at port 25565 (if configured)
- General server at port 25565 (if configured)

### 2. Test admin UI functionality
Access each admin UI and verify:
- Web interface loads properly
- Server status information is displayed
- Basic server controls (start/stop/restart) are responsive (if applicable)

### 3. Verify resource allocation
```bash
# Check if servers are using the correct memory allocation
docker stats mc-ilias mc-niilo school-server general-server
```
Each server should be configured with 5G initial memory and able to scale up to 100G.

## Health Monitoring

### 1. Set up monitoring
- Configure monitoring for disk space (Minecraft worlds can grow significantly)
- Set up memory and CPU usage alerts
- Monitor network connectivity if servers are internet-facing

### 2. Performance benchmarks
- Baseline performance metrics for each server
- Expected startup times
- Normal memory usage patterns

### 3. Backup verification
- Verify that server data is being persisted to volumes
- Test backup procedures for game worlds and configurations
- Validate that datapacks are properly installed

## Emergency Procedures

### 1. Service recovery
If a service goes down:
```bash
# Check specific container logs
docker logs [container-name]

# Restart a specific service
docker-compose -f [compose-file] restart [service-name]
```

### 2. Rollback procedure
To rollback to a previous state:
```bash
# Stop current deployment
./stop-production.sh

# If needed, reload previous images
docker-compose -f [compose-file] up -d --force-recreate
```

### 3. Contact information
- System administrator contact
- Emergency escalation contacts
- Support team for Minecraft server issues

## Documentation Updates

### 1. Update system documentation
- Record deployment date and version
- Update system architecture diagrams
- Document any deviations from the planned deployment

### 2. Access information
- Document server IP addresses
- Port mappings
- Admin UI credentials (securely stored)
- Backup schedules and locations

## Scheduled Maintenance

### 1. Weekly checks
- Disk space monitoring
- Log file rotation verification
- Backup completion verification
- Security scan logs

### 2. Monthly tasks
- Update Minecraft server versions if available
- Security patches for Docker images
- Performance review
- Resource utilization analysis

## Success Criteria

The deployment is considered successful when:
- [ ] All 9 containers are running and healthy
- [ ] All admin UIs are accessible via their designated ports
- [ ] Each Minecraft server is using the configured memory (5G min, 100G max)
- [ ] Servers respond to administrative commands through UIs
- [ ] No critical errors in the logs
- [ ] System resource usage is within acceptable limits
- [ ] Backup and monitoring systems are operational