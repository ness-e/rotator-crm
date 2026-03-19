import { describe, it, expect } from '@jest/globals';
import { generateLicensePayload } from '../../src/services/licenseService.js';

describe('License Service', () => {
  describe('generateLicensePayload', () => {
    it('should generate valid license serial and key', () => {
      const input = {
        fecha: '2027-12-31',
        id_version: '3',
        version_letras: 'PR',
        id_hosting: '2',
        hosting_letras: 'CL',
        email: 'test@example.com',
        organizacion: 'TestOrg',
        activador_letras: 'AB',
        pais_letras: 'US',
        admins: '5',
        tablets: '10',
        telefonicos: '3',
        dataEntries: '20',
        analizadores: '2',
        clasificadores: '1',
        supsCaptura: '4',
        supsKiosco: '2',
        clientes: '100',
        preguntas: '500'
      };

      const result = generateLicensePayload(input);

      // Verify serial format: PAIS-VERSION-HOSTING-FECHA-CORREO-ORG-ACTIVADOR
      expect(result.serial).toBeDefined();
      expect(result.serial).toContain('US');
      expect(result.serial).toContain('PR');
      expect(result.serial).toContain('CL');
      expect(result.serial).toContain('31122027');
      expect(result.serial).toContain('TEE');
      expect(result.serial).toContain('TG');
      expect(result.serial).toContain('AB');

      // Verify clave is encrypted (hex string)
      expect(result.clave).toBeDefined();
      expect(result.clave).toMatch(/^[0-9A-F]+$/);
      expect(result.clave.length).toBeGreaterThan(0);
    });

    it('should generate different keys for different inputs', () => {
      const input1 = {
        fecha: '2027-12-31',
        id_version: '3',
        version_letras: 'PR',
        id_hosting: '2',
        hosting_letras: 'CL',
        email: 'test1@example.com',
        organizacion: 'TestOrg1',
        activador_letras: 'AB',
        pais_letras: 'US',
        admins: '5',
        tablets: '10',
        telefonicos: '3',
        dataEntries: '20',
        analizadores: '2',
        clasificadores: '1',
        supsCaptura: '4',
        supsKiosco: '2',
        clientes: '100',
        preguntas: '500'
      };

      const input2 = {
        ...input1,
        email: 'test2@example.com',
        organizacion: 'TestOrg2',
        admins: '6'
      };

      const result1 = generateLicensePayload(input1);
      const result2 = generateLicensePayload(input2);

      expect(result1.serial).not.toBe(result2.serial);
      expect(result1.clave).not.toBe(result2.clave);
    });

    it('should handle email correctly in serial', () => {
      const input = {
        fecha: '2027-12-31',
        id_version: '3',
        version_letras: 'PR',
        id_hosting: '2',
        hosting_letras: 'CL',
        email: 'john.doe@company.com',
        organizacion: 'MyCompany',
        activador_letras: 'AB',
        pais_letras: 'US',
        admins: '5',
        tablets: '10',
        telefonicos: '3',
        dataEntries: '20',
        analizadores: '2',
        clasificadores: '1',
        supsCaptura: '4',
        supsKiosco: '2',
        clientes: '100',
        preguntas: '500'
      };

      const result = generateLicensePayload(input);

      // Email should be encoded as first 2 chars of username + first char of domain
      expect(result.serial).toContain('JOC'); // JO from john.doe, C from company
    });

    it('should handle organization correctly in serial', () => {
      const input = {
        fecha: '2027-12-31',
        id_version: '3',
        version_letras: 'PR',
        id_hosting: '2',
        hosting_letras: 'CL',
        email: 'test@example.com',
        organizacion: 'Rotator',
        activador_letras: 'AB',
        pais_letras: 'US',
        admins: '5',
        tablets: '10',
        telefonicos: '3',
        dataEntries: '20',
        analizadores: '2',
        clasificadores: '1',
        supsCaptura: '4',
        supsKiosco: '2',
        clientes: '100',
        preguntas: '500'
      };

      const result = generateLicensePayload(input);

      // Organization should be encoded as first + last char
      expect(result.serial).toContain('RR'); // R from Rotator (first and last)
    });

    it('should include all numeric limits in encrypted key', () => {
      const input = {
        fecha: '2027-12-31',
        id_version: '3',
        version_letras: 'PR',
        id_hosting: '2',
        hosting_letras: 'CL',
        email: 'test@example.com',
        organizacion: 'TestOrg',
        activador_letras: 'AB',
        pais_letras: 'US',
        admins: '10',
        tablets: '20',
        telefonicos: '5',
        dataEntries: '50',
        analizadores: '3',
        clasificadores: '2',
        supsCaptura: '8',
        supsKiosco: '4',
        clientes: '200',
        preguntas: '1000'
      };

      const result = generateLicensePayload(input);

      // The encrypted key should contain all the limits
      // We can't easily verify the encrypted content, but we can verify it's generated
      expect(result.clave).toBeDefined();
      expect(result.clave.length).toBeGreaterThan(50); // Encrypted string should be substantial
    });

    it('should handle date formatting correctly', () => {
      const input = {
        fecha: '2027-01-05', // Single digit day and month
        id_version: '3',
        version_letras: 'PR',
        id_hosting: '2',
        hosting_letras: 'CL',
        email: 'test@example.com',
        organizacion: 'TestOrg',
        activador_letras: 'AB',
        pais_letras: 'US',
        admins: '5',
        tablets: '10',
        telefonicos: '3',
        dataEntries: '20',
        analizadores: '2',
        clasificadores: '1',
        supsCaptura: '4',
        supsKiosco: '2',
        clientes: '100',
        preguntas: '500'
      };

      const result = generateLicensePayload(input);

      // Date should be formatted as DDMMYYYY
      expect(result.serial).toContain('05012027');
    });
  });
});
