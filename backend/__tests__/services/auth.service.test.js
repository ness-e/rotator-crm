import { describe, it, expect } from '@jest/globals';
import { verifyPasswordLegacy } from '../../src/services/authService.js';

describe('Auth Service', () => {
    describe('verifyPasswordLegacy', () => {
        it('should return true for matching passwords', () => {
            const password = 'testPassword123';
            const result = verifyPasswordLegacy(password, password);
            expect(result).toBe(true);
        });

        it('should return false for non-matching passwords', () => {
            const password1 = 'testPassword123';
            const password2 = 'differentPassword456';
            const result = verifyPasswordLegacy(password1, password2);
            expect(result).toBe(false);
        });

        it('should be case sensitive', () => {
            const password1 = 'TestPassword';
            const password2 = 'testpassword';
            const result = verifyPasswordLegacy(password1, password2);
            expect(result).toBe(false);
        });

        it('should handle empty strings', () => {
            const result = verifyPasswordLegacy('', '');
            expect(result).toBe(true);
        });

        it('should handle special characters', () => {
            const password = 'p@ssw0rd!#$%';
            const result = verifyPasswordLegacy(password, password);
            expect(result).toBe(true);
        });

        it('should handle unicode characters', () => {
            const password = 'contraseña123';
            const result = verifyPasswordLegacy(password, password);
            expect(result).toBe(true);
        });
    });
});
