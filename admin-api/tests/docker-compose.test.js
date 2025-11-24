const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

describe('Docker Compose Configuration', () => {
  it('should have EULA=TRUE for all services', (done) => {
    const dockerComposePath = path.join(__dirname, '..', '..', 'docker-compose.yml');
    const dockerComposeFile = fs.readFileSync(dockerComposePath, 'utf8');
    const dockerCompose = yaml.load(dockerComposeFile);

    const services = dockerCompose.services;
    for (const serviceName in services) {
      const service = services[serviceName];
      if (serviceName === 'bungeecord' || serviceName === 'admin-api' || serviceName === 'nginx' || serviceName === 'watchtower' || serviceName === 'admin-ui') {
        continue;
      }

      if (service.environment) {
        const eulaVar = service.environment.find(env => env.startsWith('EULA='));
        if (eulaVar) {
          const eulaValue = eulaVar.split('=')[1];
          expect(eulaValue).toBe('${MC_EULA:-TRUE}');
        } else {
            done.fail(`EULA environment variable not found for service: ${serviceName}`);
        }
      } else {
          done.fail(`Environment block not found for service: ${serviceName}`);
      }
    }
    done();
  });
});
