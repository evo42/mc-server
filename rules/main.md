# Minecraft SaaS Platform - AI Rules and Guidelines

This document outlines the rules and guidelines for AI systems managing and interacting with the Minecraft SaaS Platform.

## Platform Overview

The Minecraft SaaS Platform is a production-ready multi-server system supporting Minecraft 1.21.10 with:
- Universal Minecraft base image with dynamic PaperMC download
- Secure admin API with Dockerode integration
- Vue.js SPA admin panel
- BungeeCord proxy for server switching
- Centralized configuration via docker-compose and .env

## AI System Rules

### 1. Configuration Management Rules
- **Version Consistency**: Always maintain version compatibility across all servers
- **Security First**: Prioritize security over convenience in all decisions
- **Resource Limitation**: Never exceed available system resources
- **Backup Protocol**: Always backup configurations before making changes

### 2. Security Rules
- **Validation Required**: All server names must be validated against ALLOWED_SERVERS list
- **No Shell Injection**: Never use unvalidated user input in system commands
- **Authentication Enforced**: All API endpoints require valid authentication
- **Path Traversal Prevention**: Validate all file paths to prevent directory traversal

### 3. Operational Rules
- **Downtime Minimization**: Schedule maintenance during low-usage periods
- **Rolling Updates**: Update services in sequence to maintain availability
- **Monitoring Required**: Monitor all services and alert on failures
- **Logging Standards**: Maintain consistent logging across all services

### 4. Configuration Modification Rules
- **Environment Variables**: Use .env file for all configurable values
- **Backward Compatibility**: Ensure new configurations don't break existing functionality
- **Documentation Required**: Document all new configuration options
- **Testing Required**: Test all configuration changes in staging environment

### 5. Server Management Rules
- **Version Support**: Support only Minecraft versions compatible with PaperMC (1.12.2+)
- **Resource Allocation**: Assign resources based on server usage patterns
- **Player Limits**: Set realistic maximums based on available resources
- **Performance Tuning**: Optimize settings for each server's intended use case

### 6. Data Management Rules
- **Data Persistence**: All important data must be stored in Docker volumes
- **Backup Strategy**: Implement automated backup procedures
- **Data Security**: Encrypt sensitive information where appropriate
- **Retention Policy**: Implement data retention policies for logs and backups

### 7. Deployment Rules
- **CI/CD Pipeline**: All deployments must go through automated pipeline
- **Rollback Strategy**: Maintain ability to rollback to previous stable version
- **Health Checks**: Verify service health after each deployment
- **Staging Validation**: Test in staging before production deployment

### 8. API Interaction Rules
- **Rate Limiting**: Implement appropriate rate limiting on API endpoints
- **Error Handling**: Provide clear error messages without exposing internals
- **Authentication**: Enforce authentication on all write operations
- **Validation**: Validate all input parameters before processing

### 9. Performance Rules
- **Resource Monitoring**: Monitor CPU, memory, and disk usage
- **Optimization**: Optimize configurations for performance
- **Scaling**: Plan for horizontal and vertical scaling
- **Load Balancing**: Distribute load appropriately across services

### 10. Communication Rules
- **Documentation**: Maintain up-to-date documentation for all changes
- **Change Management**: Follow proper change management procedures
- **Stakeholder Communication**: Communicate changes and impacts appropriately
- **Incident Response**: Follow incident response procedures for critical issues

## AI Decision-Making Hierarchy

When making decisions about the platform, follow this hierarchy:

1. **Security**: Security considerations always take top priority
2. **Stability**: Maintain system stability and availability
3. **Performance**: Optimize for performance and efficiency
4. **Usability**: Ensure ease of use and management
5. **Flexibility**: Maintain system flexibility and extensibility

## Version Compatibility Guidelines

### 1. PaperMC Support
- **Supported Versions**: PaperMC supports Minecraft 1.12.2 and newer versions
- **Current Target**: Minecraft 1.21.10 (latest stable supported version)
- **Version Selection**: Use latest stable PaperMC build for each Minecraft version
- **Validation**: Verify PaperMC availability before implementing new Minecraft versions

### 2. Java Runtime Requirements
- **Minecraft 1.21.x**: Requires Java 21 (eclipse-temurin:21-jdk)
- **Backward Compatibility**: Newer Java versions support older Minecraft versions
- **Performance**: Java 21 provides optimal performance for Minecraft 1.21.x

### 3. Version Updates
- **Testing Required**: Test new Minecraft versions in staging before production
- **Plugin Compatibility**: Verify plugin compatibility with new versions
- **Player Transition**: Plan for smooth player transitions between versions
- **Backup Strategy**: Create backups before version upgrades

## Compliance Requirements

### 1. Mojang EULA Compliance
- Always set `EULA=TRUE` in accordance with Mojang's EULA
- Do not modify or circumvent EULA requirements
- Ensure all server operators understand EULA obligations

### 2. Data Privacy
- Protect user data stored on the platform
- Implement appropriate access controls
- Maintain data privacy in accordance with applicable laws

### 3. Terms of Service
- Ensure platform usage complies with all applicable terms of service
- Implement appropriate monitoring for misuse
- Address violations promptly and appropriately

## Emergency Procedures

### 1. Security Breach Response
- Isolate affected systems immediately
- Notify relevant stakeholders
- Implement temporary security measures
- Document incident and implement permanent fixes

### 2. Service Outage Response
- Identify root cause immediately
- Implement temporary fixes if possible
- Communicate with users about status
- Restore full service as quickly as possible

### 3. Data Loss Recovery
- Activate backup systems immediately
- Verify data integrity
- Restore service with minimal data loss
- Implement additional safeguards to prevent recurrence

## Continuous Improvement

- Regular security audits and updates
- Performance monitoring and optimization
- User feedback integration
- Technology stack updates
- Documentation maintenance

This document should be reviewed and updated quarterly to ensure continued relevance and accuracy.