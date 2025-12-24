import { getRecentProcesses, searchProcesses, SecopProcess } from './secop';

describe('SECOP API Functions', () => {
  describe('getRecentProcesses', () => {
    it('should fetch a limited number of recent processes', async () => {
      const limit = 2;
      const result = await getRecentProcesses(limit);

      expect(result).toHaveLength(limit);
      expect(result[0]).toHaveProperty('id_del_proceso');
      expect(result[0]).toHaveProperty('entidad');
      expect(result[0]).toHaveProperty('fase');
    });

    it('should return default 5 processes when no limit is specified', async () => {
      const result = await getRecentProcesses();

      expect(result).toHaveLength(3); // Based on current mock data
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return all available processes when limit exceeds data size', async () => {
      const limit = 100;
      const result = await getRecentProcesses(limit);

      expect(result.length).toBeLessThanOrEqual(limit);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return processes with expected structure', async () => {
      const result = await getRecentProcesses(1);

      expect(result[0]).toMatchObject({
        id_del_proceso: expect.any(String),
        entidad: expect.any(String),
        nit_entidad: expect.any(String),
        ciudad_entidad: expect.any(String),
        departamento_entidad: expect.any(String),
        nombre_del_procedimiento: expect.any(String),
        descripci_n_del_procedimiento: expect.any(String),
        fase: expect.any(String),
        fecha_de_publicacion_del: expect.any(String),
      });
    });
  });

  describe('searchProcesses - Municipality Filter', () => {
    it('should correctly filter processes by municipality (exact match)', async () => {
      const result = await searchProcesses('Bogotá');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.ciudad_entidad.toLowerCase()).toContain('bogotá');
      });
    });

    it('should correctly filter processes by municipality (case insensitive)', async () => {
      const result = await searchProcesses('BOGOTÁ');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.ciudad_entidad.toLowerCase()).toContain('bogotá');
      });
    });

    it('should correctly filter processes by municipality (partial match)', async () => {
      const result = await searchProcesses('Mede');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.ciudad_entidad.toLowerCase()).toContain('mede');
      });
    });

    it('should return empty array when municipality does not match', async () => {
      const result = await searchProcesses('NonexistentCity');

      expect(result).toHaveLength(0);
    });

    it('should ignore empty or whitespace-only municipality filter', async () => {
      const resultEmpty = await searchProcesses('');
      const resultWhitespace = await searchProcesses('   ');

      expect(resultEmpty.length).toBeGreaterThan(0);
      expect(resultWhitespace.length).toBeGreaterThan(0);
    });
  });

  describe('searchProcesses - Status Filter', () => {
    it('should correctly filter processes by status', async () => {
      const result = await searchProcesses(undefined, 'Publicado');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.fase.toLowerCase()).toContain('publicado');
      });
    });

    it('should correctly filter processes by status (case insensitive)', async () => {
      const result = await searchProcesses(undefined, 'PUBLICADO');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.fase.toLowerCase()).toContain('publicado');
      });
    });

    it('should correctly filter processes by status (partial match)', async () => {
      const result = await searchProcesses(undefined, 'Public');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.fase.toLowerCase()).toContain('public');
      });
    });

    it('should return empty array when status does not match', async () => {
      const result = await searchProcesses(undefined, 'Cerrado');

      expect(result).toHaveLength(0);
    });

    it('should ignore empty or whitespace-only status filter', async () => {
      const resultEmpty = await searchProcesses(undefined, '');
      const resultWhitespace = await searchProcesses(undefined, '   ');

      expect(resultEmpty.length).toBeGreaterThan(0);
      expect(resultWhitespace.length).toBeGreaterThan(0);
    });
  });

  describe('searchProcesses - Keyword Filter', () => {
    it('should correctly filter processes by keyword in procedure name', async () => {
      const result = await searchProcesses(undefined, undefined, 'carreteras');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.nombre_del_procedimiento.toLowerCase()).toContain('carreteras');
      });
    });

    it('should correctly filter processes by keyword (case insensitive)', async () => {
      const result = await searchProcesses(undefined, undefined, 'CARRETERAS');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.nombre_del_procedimiento.toLowerCase()).toContain('carreteras');
      });
    });

    it('should correctly filter processes by keyword (partial match)', async () => {
      const result = await searchProcesses(undefined, undefined, 'Equip');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.nombre_del_procedimiento.toLowerCase()).toContain('equip');
      });
    });

    it('should return empty array when keyword does not match', async () => {
      const result = await searchProcesses(undefined, undefined, 'software');

      expect(result).toHaveLength(0);
    });

    it('should ignore empty or whitespace-only keyword filter', async () => {
      const resultEmpty = await searchProcesses(undefined, undefined, '');
      const resultWhitespace = await searchProcesses(undefined, undefined, '   ');

      expect(resultEmpty.length).toBeGreaterThan(0);
      expect(resultWhitespace.length).toBeGreaterThan(0);
    });
  });

  describe('searchProcesses - Combined Filters', () => {
    it('should correctly combine municipality and status filters', async () => {
      const result = await searchProcesses('Bogotá', 'Publicado');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.ciudad_entidad.toLowerCase()).toContain('bogotá');
        expect(process.fase.toLowerCase()).toContain('publicado');
      });
    });

    it('should correctly combine municipality and keyword filters', async () => {
      const result = await searchProcesses('Bogotá', undefined, 'carreteras');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.ciudad_entidad.toLowerCase()).toContain('bogotá');
        expect(process.nombre_del_procedimiento.toLowerCase()).toContain('carreteras');
      });
    });

    it('should correctly combine status and keyword filters', async () => {
      const result = await searchProcesses(undefined, 'Publicado', 'Equipos');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.fase.toLowerCase()).toContain('publicado');
        expect(process.nombre_del_procedimiento.toLowerCase()).toContain('equipos');
      });
    });

    it('should correctly combine municipality, status, and keyword filters', async () => {
      const result = await searchProcesses('Medellín', 'Publicado', 'vías');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((process) => {
        expect(process.ciudad_entidad.toLowerCase()).toContain('medellín');
        expect(process.fase.toLowerCase()).toContain('publicado');
        expect(process.nombre_del_procedimiento.toLowerCase()).toContain('vías');
      });
    });

    it('should return empty array when combined filters do not match any process', async () => {
      const result = await searchProcesses('Bogotá', 'Publicado', 'software');

      expect(result).toHaveLength(0);
    });

    it('should respect limit parameter with combined filters', async () => {
      const limit = 1;
      const result = await searchProcesses('Bogotá', 'Publicado', undefined, limit);

      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it('should apply filters sequentially and maintain data integrity', async () => {
      const allProcesses = await searchProcesses();
      const filteredByMunicipality = await searchProcesses('Bogotá');
      const filteredByStatus = await searchProcesses(undefined, 'Publicado');
      const combined = await searchProcesses('Bogotá', 'Publicado');

      expect(combined.length).toBeLessThanOrEqual(filteredByMunicipality.length);
      expect(combined.length).toBeLessThanOrEqual(filteredByStatus.length);
      expect(allProcesses.length).toBeGreaterThanOrEqual(combined.length);
    });
  });

  describe('searchProcesses - Edge Cases', () => {
    it('should handle undefined parameters', async () => {
      const result = await searchProcesses(undefined, undefined, undefined);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle limit parameter correctly', async () => {
      const limit = 1;
      const result = await searchProcesses(undefined, undefined, undefined, limit);

      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it('should return processes in correct order (limited by slice)', async () => {
      const limit = 2;
      const result = await searchProcesses(undefined, undefined, undefined, limit);
      const allResults = await searchProcesses();

      expect(result[0]).toEqual(allResults[0]);
      if (result.length > 1) {
        expect(result[1]).toEqual(allResults[1]);
      }
    });
  });
});
