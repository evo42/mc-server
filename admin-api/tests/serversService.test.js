const { isValidServer } = require('../services/serversService');
const { describe, it, expect } = require('vitest');

describe('serversService', () => {
  describe('isValidServer', () => {
    it('should return true for valid server names', () => {
      const validServers = [
        'mc-ilias',
        'mc-niilo',
        'mc-bgstpoelten',
        'mc-htlstp',
        'mc-borgstpoelten',
        'mc-hakstpoelten',
        'mc-basop-bafep-stp',
        'mc-play'
      ];

      validServers.forEach(server => {
        expect(isValidServer(server)).toBe(true);
      });
    });

    it('should return false for invalid server names', () => {
      const invalidServers = [
        'invalid-server',
        'mc-test',
        'nonexistent',
        '',
        null,
        undefined,
        123,
        'mc-ilias-hacked'
      ];

      invalidServers.forEach(server => {
        expect(isValidServer(server)).toBe(false);
      });
    });

    it('should return false for server names with invalid characters', () => {
      const invalidServers = [
        'mc-ilias../',
        'mc-;ilias',
        'mc-ilias<script>',
        'mc-ilias%20'
      ];

      invalidServers.forEach(server => {
        expect(isValidServer(server)).toBe(false);
      });
    });
  });
});