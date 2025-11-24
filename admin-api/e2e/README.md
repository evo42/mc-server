# E2E Testing Documentation and Examples

## End-to-End Tests for Minecraft SaaS Platform

This directory contains end-to-end tests for the Minecraft SaaS Platform MVP. These tests validate the complete user flow from the SPA admin panel to the backend API.

### Key User Flows to Test:

1. **Server Management Flow**:
   - User logs into the SPA admin panel
   - User views server statuses
   - User starts/stops/restarts servers
   - User verifies server status changes

2. **Datapack Management Flow**:
   - User navigates to datapacks section
   - User searches and installs a datapack
   - User verifies datapack is installed
   - User uninstalls a datapack
   - User verifies datapack is removed

3. **Security Flow**:
   - User attempts to access without authentication
   - User is redirected to login
   - Invalid credentials are rejected
   - Valid credentials grant access

### Technologies Used:
- Jest for testing framework
- Supertest for API testing
- Puppeteer/Cypress for browser automation (to be implemented)

### Sample Test Structure:
```
describe('SPA Admin Panel E2E Tests', () => {
  beforeAll(async () => {
    // Set up browser instance
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    // Clean up browser instance
    await browser.close();
  });

  test('should allow server management', async () => {
    // Navigate to admin panel
    await page.goto('http://localhost');
    
    // Login with credentials
    await page.type('#username', 'admin');
    await page.type('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for page to load
    await page.waitForNavigation();
    
    // Verify server list is displayed
    await expect(page).toMatchElement('.server-list');
    
    // Test server start functionality
    const startButton = await page.$('.btn-success');
    await startButton.click();
    
    // Verify status change
    await page.waitForTimeout(2000);
    await expect(page).toMatchElement('.server-card .badge.bg-success', { text: 'running' });
  });
});
```

### Implementation Status:
- [x] API E2E tests implemented
- [ ] SPA browser automation tests (planned)

### Running Tests:
```bash
# API tests
cd admin-api && npm test

# SPA tests (when implemented)
# npm run test-e2e
```

### Testing Checklist:
- [x] Server start/stop/restart functionality
- [x] Server status reporting
- [x] Datapack installation/listing/uninstallation
- [x] Basic authentication
- [x] Security validation (invalid server names, path traversal)
- [ ] Complete SPA user flows
- [ ] Error handling
- [ ] Performance under load