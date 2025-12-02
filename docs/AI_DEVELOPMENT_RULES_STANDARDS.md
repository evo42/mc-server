# AI Development Rules & Standards - DevOps Team Guidelines

## Dokumentversion: 1.0
**Erstellt am:** 2025-12-01
**Gültig für:** Minecraft Server Platform Development Team
**Review-Zyklus:** Quartalsweise

---

## 1. Code Quality Standards

### 1.1 TypeScript/JavaScript Standards

#### Mandatory Type Safety
```typescript
// ✅ GOOD: Complete TypeScript interface
interface ServerStatus {
  server: string;
  status: 'running' | 'stopped' | 'error';
  cpu: string;
  memory: string;
  playerCount: number;
  lastUpdated: Date;
}

// ❌ BAD: Missing type definitions
const getServerStatus = (server) => {
  // No type safety
};
```

#### Error Handling Patterns
```typescript
// ✅ GOOD: Comprehensive error handling
class ServerOperationError extends Error {
  constructor(
    public operation: 'start' | 'stop' | 'restart',
    public server: string,
    public originalError: Error
  ) {
    super(`${operation} failed for ${server}: ${originalError.message}`);
  }
}

// Usage with proper error handling
try {
  await serversService.startServer(serverName);
} catch (error) {
  if (error instanceof ServerOperationError) {
    logger.error('Server operation failed', { error });
    throw new ServiceUnavailableError('Server temporarily unavailable');
  }
  throw error;
}
```

### 1.2 Vue.js Composition API Standards

#### Component Structure
```vue
<!-- ✅ GOOD: Proper Composition API structure -->
<template>
  <div class="server-control">
    <ServerStatus :server="server" />
    <ServerActions
      :server="server"
      :disabled="loading"
      @action="handleServerAction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useServerStore } from '@/stores/serverStore';
import type { Server, ServerAction } from '@/types';

const serverStore = useServerStore();
const loading = ref(false);

const server = computed(() => serverStore.getServerById(props.serverId));

const handleServerAction = async (action: ServerAction) => {
  loading.value = true;
  try {
    await serverStore.executeAction(props.serverId, action);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  serverStore.loadServerStatus();
});
</script>
```

#### Pinia Store Standards
```typescript
// ✅ GOOD: Well-typed Pinia store
export const useServerStore = defineStore('server', {
  state: () => ({
    servers: {} as Record<string, Server>,
    loading: false,
    error: null as string | null
  }),

  getters: {
    runningServers: (state) =>
      Object.values(state.servers).filter(s => s.status === 'running'),

    serverById: (state) => (id: string) => state.servers[id]
  },

  actions: {
    async loadServerStatus(): Promise<void> {
      this.loading = true;
      try {
        const response = await api.getServerStatus();
        this.servers = response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
```

### 1.3 Node.js Backend Standards

#### Service Layer Architecture
```javascript
// ✅ GOOD: Proper service abstraction
class ServersService {
  constructor(
    private dockerService: DockerService,
    private cacheService: CacheService,
    private logger: Logger
  ) {}

  async startServer(serverName: string): Promise<void> {
    this.logger.info(`Starting server: ${serverName}`);

    // Validation
    this.validateServerName(serverName);

    // Cache invalidation
    this.cacheService.clearServerCache(serverName);

    // Operation
    await this.dockerService.startContainer(serverName);

    // Audit log
    this.auditService.logServerAction('START', serverName);
  }

  private validateServerName(serverName: string): void {
    if (!/^[a-z0-9-]+$/.test(serverName)) {
      throw new ValidationError(`Invalid server name: ${serverName}`);
    }
  }
}
```

#### Middleware Standards
```javascript
// ✅ GOOD: Composable middleware
const validationMiddleware = (schema) => [
  body(schema).trim().escape(),
  handleValidationErrors,
  asyncHandler(async (req, res, next) => {
    // Additional business logic validation
    if (!req.user.permissions.includes('server:manage')) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  })
];
```

---

## 2. Security Standards

### 2.1 Input Validation Framework

#### Validation Chain Pattern
```javascript
// ✅ GOOD: Comprehensive validation chain
const validateServerOperation = [
  // 1. Parameter validation
  param('server').trim().escape().matches(/^[a-z0-9-]+$/),

  // 2. Business logic validation
  custom(async (value) => {
    if (!ALLOWED_SERVERS.includes(value)) {
      throw new Error(`Server not found: ${value}`);
    }
    return true;
  }),

  // 3. Security validation
  custom(async (value) => {
    if (value.includes('..') || value.includes('/')) {
      throw new Error('Path traversal detected');
    }
    return true;
  })
];
```

#### Path Traversal Protection
```javascript
// ✅ GOOD: Defensive path handling
const sanitizeDatapackPath = (path: string): string => {
  // Remove dangerous patterns
  const sanitized = path
    .replace(/\\/g, '/')        // Normalize separators
    .replace(/\.\./g, '')       // Remove parent directory references
    .replace(/[^\w\-]/g, '')    // Remove non-alphanumeric chars

  if (sanitized.includes('.') || sanitized.includes('/')) {
    throw new SecurityError('Invalid path: path traversal detected');
  }

  return sanitized;
};
```

### 2.2 Authentication & Authorization

#### JWT Implementation Standards
```javascript
// ✅ GOOD: Secure JWT handling
class AuthService {
  generateTokens(user: User): { access: string; refresh: string } {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        permissions: user.permissions,
        exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
      },
      process.env.JWT_SECRET,
      { algorithm: 'HS256' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      },
      process.env.JWT_REFRESH_SECRET,
      { algorithm: 'HS256' }
    );

    return { access: accessToken, refresh: refreshToken };
  }
}
```

#### Role-Based Access Control
```javascript
// ✅ GOOD: Permission-based authorization
const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.permissions?.includes(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${permission}' required`
      });
    }
    next();
  };
};

// Usage
router.post('/servers/:server/start',
  authMiddleware,
  requirePermission('server:manage'),
  serversController.startServer
);
```

### 2.3 Container Security

#### Dockerfile Security Standards
```dockerfile
# ✅ GOOD: Security-hardened Dockerfile
FROM node:22-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Install only necessary packages
RUN apk add --no-cache \
    curl \
    dumb-init

# Set ownership and permissions
COPY --chown=nextjs:nodejs . /app
WORKDIR /app

# Switch to non-root user
USER nextjs

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

EXPOSE 3000
CMD ["node", "server.js"]
```

#### Docker Compose Security
```yaml
# ✅ GOOD: Security-conscious compose configuration
services:
  admin-api:
    build: ./admin-api
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
    networks:
      - internal
    environment:
      - NODE_ENV=production
```

---

## 3. Testing Standards

### 3.1 Testing Pyramid

#### Unit Testing Standards
```javascript
// ✅ GOOD: Comprehensive unit test
describe('ServersService', () => {
  let serversService: ServersService;
  let mockDockerService: jest.Mocked<DockerService>;
  let mockCacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    mockDockerService = createMockDockerService();
    mockCacheService = createMockCacheService();

    serversService = new ServersService(
      mockDockerService,
      mockCacheService,
      createMockLogger()
    );
  });

  describe('startServer', () => {
    it('should start valid server successfully', async () => {
      // Arrange
      const serverName = 'mc-ilias';
      mockDockerService.startContainer.mockResolvedValue(undefined);
      mockCacheService.clearServerCache.mockResolvedValue(undefined);

      // Act
      await serversService.startServer(serverName);

      // Assert
      expect(mockDockerService.startContainer).toHaveBeenCalledWith(serverName);
      expect(mockCacheService.clearServerCache).toHaveBeenCalledWith(serverName);
    });

    it('should reject invalid server names', async () => {
      // Arrange
      const invalidServerName = '../etc/passwd';

      // Act & Assert
      await expect(serversService.startServer(invalidServerName))
        .rejects
        .toThrow('Invalid server name');
    });

    it('should handle Docker service failures gracefully', async () => {
      // Arrange
      const serverName = 'mc-ilias';
      const dockerError = new Error('Docker daemon not available');
      mockDockerService.startContainer.mockRejectedValue(dockerError);

      // Act & Assert
      await expect(serversService.startServer(serverName))
        .rejects
        .toThrow('Failed to start server');
    });
  });
});
```

#### Integration Testing Standards
```javascript
// ✅ GOOD: API integration test
describe('Servers API Integration', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  describe('POST /api/servers/:server/start', () => {
    it('should start server and return success', async () => {
      // Arrange
      const serverName = 'mc-test';
      const authToken = await getAuthToken('admin');

      // Act
      const response = await request(app)
        .post(`/api/servers/${serverName}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: `${serverName} started`
      });

      // Verify server is actually running
      const statusResponse = await request(app)
        .get(`/api/servers/${serverName}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.body.status).toBe('running');
    });
  });
});
```

#### E2E Testing Standards
```javascript
// ✅ GOOD: Playwright E2E test
import { test, expect } from '@playwright/test';

test.describe('Server Management E2E', () => {
  test('should manage server lifecycle', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('[data-testid=username]', 'admin');
    await page.fill('[data-testid=password]', 'admin123');
    await page.click('[data-testid=login-button]');

    // Navigate to servers
    await page.click('[data-testid=nav-servers]');
    await expect(page).toHaveURL('/admin/servers');

    // Start server
    await page.click('[data-testid=server-mc-ilias] [data-testid=start-button]');
    await expect(page.locator('[data-testid=status]')).toContainText('running');

    // Stop server
    await page.click('[data-testid=server-mc-ilias] [data-testid=stop-button]');
    await expect(page.locator('[data-testid=status]')).toContainText('stopped');
  });
});
```

### 3.2 Testing Metrics

#### Coverage Requirements
- **Unit Tests:** ≥95% line coverage
- **Integration Tests:** ≥80% endpoint coverage
- **E2E Tests:** ≥70% critical user journey coverage
- **Security Tests:** 100% authentication/authorization paths

#### Test Quality Gates
```yaml
# GitHub Actions test gate
- name: Run Tests with Coverage
  run: |
    npm run test:unit -- --coverage
    npm run test:integration
    npm run test:e2e

- name: Quality Gate
  run: |
    # Fail if coverage is below threshold
    node scripts/coverage-check.js --min-coverage 90

    # Fail if tests take too long
    node scripts/performance-check.js --max-duration 300
```

---

## 4. Performance Standards

### 4.1 Caching Strategy

#### Multi-Level Caching
```javascript
// ✅ GOOD: Sophisticated caching strategy
class CacheService {
  private readonly config = {
    serverStatus: { ttl: 120, prefix: 'server_status' },
    allServers: { ttl: 60, prefix: 'all_servers' },
    datapacks: { ttl: 300, prefix: 'datapacks' },
    searchResults: { ttl: 600, prefix: 'search' }
  };

  async getServerStatus(serverName: string): Promise<ServerStatus | null> {
    const cacheKey = this.generateKey('server_status', serverName);

    // L1: Memory cache
    let cached = this.memoryCache.get(cacheKey);
    if (cached) return cached;

    // L2: Redis cache
    const redisData = await this.redis.get(cacheKey);
    if (redisData) {
      cached = JSON.parse(redisData);
      this.memoryCache.set(cacheKey, cached);
      return cached;
    }

    return null;
  }
}
```

### 4.2 Database Optimization

#### Query Optimization Standards
```sql
-- ✅ GOOD: Optimized database queries
-- Index for frequent server status queries
CREATE INDEX idx_server_status_timestamp
ON server_metrics (server_id, timestamp DESC);

-- Optimized aggregate queries
SELECT
  server_id,
  AVG(cpu_usage) as avg_cpu,
  AVG(memory_usage) as avg_memory,
  MAX(timestamp) as last_update
FROM server_metrics
WHERE timestamp >= NOW() - INTERVAL '1 HOUR'
GROUP BY server_id
ORDER BY last_update DESC;
```

### 4.3 API Performance Standards

#### Response Time Targets
```typescript
// ✅ GOOD: Performance monitoring
interface PerformanceThresholds {
  apiResponseTime: {
    p50: number;    // 50ms
    p95: number;    // 100ms
    p99: number;    // 200ms
  };
  websocketLatency: {
    p95: number;    // 50ms
    p99: number;    // 100ms
  };
  databaseQuery: {
    p95: number;    // 25ms
  };
}

// Middleware for performance monitoring
const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    if (duration > 100) { // p95 threshold
      logger.warn('Slow response detected', {
        method: req.method,
        url: req.url,
        duration,
        userAgent: req.get('User-Agent')
      });
    }

    // Send to monitoring service
    metrics.histogram('api_response_time', duration, {
      method: req.method,
      route: req.route?.path
    });
  });

  next();
};
```

---

## 5. DevOps Workflow Standards

### 5.1 CI/CD Pipeline Standards

#### GitHub Actions Workflow
```yaml
# ✅ GOOD: Comprehensive CI/CD pipeline
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Security Scan
        uses: github/codeql-action/init@v2
        with:
          languages: javascript,typescript

      - name: Dependency Audit
        run: npm audit --audit-level moderate

      - name: Container Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ghcr.io/${{ github.repository }}/${{ matrix.service }}'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Security Scan Results
        uses: github/codeql-action/upload-sarif@v2
        if: always()

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Performance tests
        run: npm run test:performance

  build-and-deploy:
    needs: [security-scan, test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Build and push Docker images
        uses: docker/build-push-action@v4
        with:
          context: ./${{ matrix.service }}
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/${{ matrix.service }}:latest
            ghcr.io/${{ github.repository }}/${{ matrix.service }}:${{ github.sha }}

      - name: Deploy to staging
        run: |
          # Deploy to staging environment
          ./scripts/deploy.sh staging

          # Run smoke tests
          npm run test:smoke

      - name: Deploy to production
        if: success()
        run: |
          # Blue-green deployment
          ./scripts/deploy.sh production-blue

          # Health checks
          ./scripts/health-check.sh

          # Switch traffic
          ./scripts/switch-traffic.sh blue green
```

### 5.2 Infrastructure as Code

#### Terraform Standards
```hcl
# ✅ GOOD: Secure Terraform configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 2.0"
    }
  }
}

resource "docker_image" "admin_api" {
  name          = "${docker_registry_image.admin_api.name}:${var.version}"
  keep_locally = false
}

resource "docker_container" "admin_api" {
  name  = "mc-admin-api"
  image = docker_image.admin_api.latest

  # Security configurations
  read_only = true
  security_opt = ["no-new-privileges:true"]

  # Resource limits
  memory      = 512
  memory_swap = 512
  cpu_shares  = 512

  # Network configuration
  networks_advanced {
    name = "internal"
  }

  # Environment variables
  env = [
    "NODE_ENV=production",
    "DATABASE_URL=${var.database_url}"
  ]
}
```

### 5.3 Monitoring & Observability

#### Prometheus Metrics
```javascript
// ✅ GOOD: Comprehensive metrics collection
const prometheus = require('prom-client');

// Create custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const serverOperations = new prometheus.Counter({
  name: 'server_operations_total',
  help: 'Total number of server operations',
  labelNames: ['operation', 'server', 'status']
});

const cacheHitRate = new prometheus.Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage',
  labelNames: ['cache_type']
});

// Middleware for metrics collection
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestDuration
      .labels(req.method, req.route?.path, res.statusCode)
      .observe(duration);
  });

  next();
};
```

#### Structured Logging
```javascript
// ✅ GOOD: Structured logging with correlation IDs
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  redact: {
    paths: ['req.headers.authorization', '*.password', '*.token'],
    remove: true
  }
});

// Add correlation ID to all logs
const logWithCorrelationId = (logger, req, level, message, extra = {}) => {
  logger[level]({
    correlationId: req.correlationId,
    userId: req.user?.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    ...extra
  }, message);
};
```

---

## 6. AI-Assisted Development Standards

### 6.1 Automated Code Review

#### SonarQube Configuration
```yaml
# ✅ GOOD: AI-powered code quality gates
# sonar-project.properties
sonar.projectKey=minecraft-server-platform
sonar.sources=admin-api,admin-ui-spa
sonar.tests=admin-api/tests,admin-ui-spa/tests
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.test.inclusions=**/*.test.js,**/*.test.ts,**/*.spec.js,**/*.spec.ts
sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**

# Quality gates
sonar.qualitygate.wait=true
sonar.newCode.referenceBranch=main

# AI-powered security analysis
sonar.security.hotspots.minScore=0.8
sonar.vulnerabilities.threshold=high
```

#### Custom AI Rules
```javascript
// ✅ GOOD: AI-powered security rules
const securityRules = [
  {
    id: 'SEC-001',
    name: 'SQL Injection Prevention',
    description: 'Detect potential SQL injection vulnerabilities',
    severity: 'HIGH',
    pattern: /query\s*\.\s*raw\s*\(\s*[\'"][^\'"]*\$|%/i,
    suggestion: 'Use parameterized queries or ORM methods instead of raw SQL'
  },
  {
    id: 'SEC-002',
    name: 'Path Traversal Detection',
    description: 'Detect potential path traversal vulnerabilities',
    severity: 'HIGH',
    pattern: /fs\.read(Dir|File)?\s*\(\s*.*\.\./i,
    suggestion: 'Validate and sanitize file paths before filesystem operations'
  },
  {
    id: 'PERF-001',
    name: 'N+1 Query Detection',
    description: 'Detect N+1 query patterns in database operations',
    severity: 'MEDIUM',
    pattern: /for\s*\(.*\)\s*\{.*db\./i,
    suggestion: 'Use eager loading or batch queries to avoid N+1 pattern'
  }
];
```

### 6.2 AI-Generated Documentation

#### OpenAPI Schema Generation
```typescript
// ✅ GOOD: AI-generated API documentation
/**
 * @swagger
 * /api/servers/{server}/start:
 *   post:
 *     summary: Start a Minecraft server
 *     description: Initiates the startup process for a specified Minecraft server
 *     parameters:
 *       - in: path
 *         name: server
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-z0-9-]+$'
 *         description: Server identifier (e.g., 'mc-ilias')
 *         example: 'mc-ilias'
 *     responses:
 *       200:
 *         description: Server started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'mc-ilias started'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
```

### 6.3 Performance Optimization AI

#### Automated Performance Analysis
```javascript
// ✅ GOOD: AI-powered performance monitoring
class PerformanceAnalyzer {
  analyzeSlowQueries(queries: QueryLog[]): PerformanceInsight[] {
    const insights = [];

    // Group queries by type and identify slow patterns
    const slowQueries = queries.filter(q => q.duration > 100); // >100ms
    const groupedByType = this.groupBy(slowQueries, 'type');

    for (const [type, queries] of Object.entries(groupedByType)) {
      const avgDuration = this.average(queries.map(q => q.duration));
      const queryCount = queries.length;

      if (avgDuration > 50) {
        insights.push({
          type: 'SLOW_QUERY',
          severity: queryCount > 100 ? 'HIGH' : 'MEDIUM',
          message: `${type} queries averaging ${avgDuration}ms`,
          suggestions: this.generateQueryOptimizationSuggestions(type),
          affectedQueries: queryCount
        });
      }
    }

    return insights;
  }

  generateQueryOptimizationSuggestions(queryType: string): string[] {
    const suggestions = {
      'SELECT': [
        'Add appropriate indexes',
        'Use LIMIT for large result sets',
        'Select only required columns'
      ],
      'JOIN': [
        'Ensure join columns are indexed',
        'Consider denormalization for complex joins',
        'Use EXISTS instead of IN for better performance'
      ]
    };

    return suggestions[queryType] || ['Analyze query execution plan'];
  }
}
```

---

## 7. Compliance & Governance

### 7.1 Code Review Checklist

#### Mandatory Review Points
```markdown
## Code Review Checklist

### Security ✅
- [ ] Input validation implemented and tested
- [ ] No hardcoded credentials or secrets
- [ ] Authentication/authorization properly implemented
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (output encoding)
- [ ] CSRF protection for state-changing operations

### Performance ✅
- [ ] Database queries optimized (no N+1 patterns)
- [ ] Appropriate caching implemented
- [ ] Large datasets paginated
- [ ] Images/assets optimized
- [ ] API response times within SLA

### Code Quality ✅
- [ ] Code follows established patterns and standards
- [ ] Adequate error handling and logging
- [ ] Unit tests written and passing (>90% coverage)
- [ ] Integration tests included
- [ ] Documentation updated
- [ ] No dead code or commented-out code

### Infrastructure ✅
- [ ] Docker containers properly configured
- [ ] Environment variables used for configuration
- [ ] Health checks implemented
- [ ] Resource limits defined
- [ ] Proper network isolation
```

### 7.2 Release Management

#### Deployment Checklist
```yaml
# ✅ GOOD: Automated deployment gates
pre-deployment-checks:
  security:
    - container_scan_passed
    - dependency_audit_passed
    - secrets_scanned

  quality:
    - unit_tests_passed
    - integration_tests_passed
    - e2e_tests_passed
    - code_coverage > 90%

  performance:
    - load_test_passed
    - no_performance_regressions
    - api_response_time < 100ms

  monitoring:
    - alerting_configured
    - dashboards_updated
    - log_aggregation_configured

post-deployment-validation:
  - smoke_tests_passed
  - health_checks_passed
  - user_acceptance_successful
  - rollback_plan_tested
```

---

## 8. Emergency Procedures

### 8.1 Incident Response

#### Escalation Matrix
```markdown
| Severity | Response Time | Escalation | Communication |
|----------|---------------|------------|---------------|
| P0 (Critical) | 15 minutes | Immediate | All stakeholders |
| P1 (High) | 1 hour | 30 minutes | Team lead + stakeholders |
| P2 (Medium) | 4 hours | 2 hours | Team lead |
| P3 (Low) | 24 hours | 8 hours | Developer |
```

#### Emergency Rollback Procedure
```bash
#!/bin/bash
# ✅ GOOD: Automated rollback script

ROLLBACK_VERSION=$1
SERVICE_NAME=$2

echo "Initiating emergency rollback to version $ROLLBACK_VERSION for $SERVICE_NAME"

# 1. Stop current service
docker-compose stop $SERVICE_NAME

# 2. Rollback database if needed
if [ -f "rollback-$ROLLBACK_VERSION.sql" ]; then
  echo "Rolling back database..."
  psql $DATABASE_URL -f rollback-$ROLLBACK_VERSION.sql
fi

# 3. Deploy previous version
docker-compose pull $SERVICE_NAME:$ROLLBACK_VERSION
docker-compose up -d $SERVICE_NAME

# 4. Health check
sleep 30
if curl -f http://localhost:3000/health; then
  echo "Rollback successful"
  # Notify team
  ./scripts/notify-rollback-success.sh
else
  echo "Rollback failed, escalating..."
  ./scripts/notify-rollback-failure.sh
  exit 1
fi
```

---

## 9. Continuous Improvement

### 9.1 Metrics & KPIs

#### Technical KPIs
- **Deployment Frequency:** Target 5+ deployments/week
- **Lead Time for Changes:** Target <24 hours
- **Mean Time to Recovery (MTTR):** Target <1 hour
- **Change Failure Rate:** Target <10%
- **API Response Time:** Target p95 <100ms
- **System Uptime:** Target >99.9%

#### Quality KPIs
- **Code Coverage:** Target >90%
- **Security Scan Results:** Zero critical vulnerabilities
- **Test Pass Rate:** Target >99%
- **Code Review Time:** Target <4 hours

### 9.2 Retrospective Process

#### Monthly Review Agenda
1. **What went well?** (Celebrate successes)
2. **What could be improved?** (Identify pain points)
3. **Action items:** (Concrete improvements with owners)
4. **Metrics review:** (KPIs and trends)
5. **Technology updates:** (New tools and practices)

---

**Dokument owner:** DevOps Team Lead
**Review frequency:** Quarterly
**Next review date:** 2025-03-01

---

*Diese Guidelines werden regelmäßig überprüft und aktualisiert, um den neuesten Best Practices und Technologien zu entsprechen.*