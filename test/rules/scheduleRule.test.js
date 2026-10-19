/**
 * Suite de Pruebas de Caja Blanca - Regla 2: Restricción de Horarios
 * 
 * Topología CFG y Métricas de McCabe:
 * - Nodos de Predicado: P = 6
 * - Complejidad Ciclomática: V(G) = P + 1 = 7
 * - Cobertura de Ramas (Branch Coverage) = 100%
 */

const { validarRestriccionHorario } = require('../../src/rules/scheduleRule');

describe('Regla 2: Restricción de Horarios y Franjas Operativas (Caja Blanca McCabe V(G) = 7)', () => {
  // Fecha fija de referencia: Miércoles 18 de Noviembre de 2026, 08:00 AM
  const FECHA_REF = new Date('2026-11-18T08:00:00.000Z');

  // Camino 1: Formato de fecha inválido
  test('Camino 1: Formato de fecha no convertible a Timestamp es rechazado', () => {
    const res = validarRestriccionHorario({
      fechaHora: 'fecha_invalida_123',
      fechaReferencia: FECHA_REF
    });

    expect(res.esValido).toBe(false);
    expect(res.motivo).toMatch(/formato de fecha y hora.*no es válido/i);
  });

  // Camino 2: Fecha en el pasado
  test('Camino 2: Citas en fechas u horas pasadas son bloqueadas', () => {
    const res = validarRestriccionHorario({
      fechaHora: '2026-11-17T10:00:00.000Z', // Ayer respecto a FECHA_REF
      fechaReferencia: FECHA_REF
    });

    expect(res.esValido).toBe(false);
    expect(res.motivo).toMatch(/fechas u horas pasadas/i);
  });

  // Camino 3: Fines de semana (Sábado y Domingo no operativos)
  test('Camino 3: Citas en fin de semana (Sábado o Domingo) son rechazadas', () => {
    // Sábado 21 de Noviembre de 2026
    const resSabado = validarRestriccionHorario({
      fechaHora: '2026-11-21T10:00:00',
      fechaReferencia: '2026-11-18T08:00:00'
    });
    expect(resSabado.esValido).toBe(false);
    expect(resSabado.motivo).toMatch(/días hábiles \(Lunes a Viernes\)/i);

    // Domingo 22 de Noviembre de 2026
    const resDomingo = validarRestriccionHorario({
      fechaHora: '2026-11-22T10:00:00',
      fechaReferencia: '2026-11-18T08:00:00'
    });
    expect(resDomingo.esValido).toBe(false);
    expect(resDomingo.motivo).toMatch(/días hábiles/i);
  });

  // Camino 4: Fuera de rango operativo (<08:00 o >=17:00)
  test('Camino 4: Citas antes de las 08:00 o después de las 17:00 son bloqueadas', () => {
    // Jueves 19 de Noviembre a las 07:30 (Muy temprano)
    const resTemprano = validarRestriccionHorario({
      fechaHora: '2026-11-19T07:30:00',
      fechaReferencia: '2026-11-18T08:00:00'
    });
    expect(resTemprano.esValido).toBe(false);
    expect(resTemprano.motivo).toMatch(/08:00 a 17:00/i);

    // Jueves 19 de Noviembre a las 17:30 (Muy tarde)
    const resTarde = validarRestriccionHorario({
      fechaHora: '2026-11-19T17:30:00',
      fechaReferencia: '2026-11-18T08:00:00'
    });
    expect(resTarde.esValido).toBe(false);
    expect(resTarde.motivo).toMatch(/08:00 a 17:00/i);
  });

  // Camino 5: Franja de almuerzo/receso médico (13:00 a 14:00)
  test('Camino 5: Franja de 13:00 a 14:00 bloqueada por receso de personal', () => {
    // Jueves 19 de Noviembre a las 13:00
    const resReceso = validarRestriccionHorario({
      fechaHora: '2026-11-19T13:00:00',
      fechaReferencia: '2026-11-18T08:00:00'
    });
    expect(resReceso.esValido).toBe(false);
    expect(resReceso.motivo).toMatch(/receso de almuerzo/i);
  });

  // Camino 6: Minutos no modulares (distintos de :00 y :30)
  test('Camino 6: Intervalos de minutos no estándar (ej: 10:15) son rechazados', () => {
    // Jueves 19 de Noviembre a las 10:15
    const resMinutos = validarRestriccionHorario({
      fechaHora: '2026-11-19T10:15:00',
      fechaReferencia: '2026-11-18T08:00:00'
    });
    expect(resMinutos.esValido).toBe(false);
    expect(resMinutos.motivo).toMatch(/bloques exactos de 30 minutos/i);
  });

  // Camino 7: Cita en horario hábil y bloque estándar válido -> Éxito
  test('Camino 7: Cita programada en franja operativa hábil de 30m es aceptada', () => {
    // Jueves 19 de Noviembre a las 10:30 AM
    const resValido = validarRestriccionHorario({
      fechaHora: '2026-11-19T10:30:00',
      fechaReferencia: '2026-11-18T08:00:00'
    });
    expect(resValido.esValido).toBe(true);
    expect(resValido.metadata).toBeDefined();
    expect(resValido.metadata.hora).toBe(10);
    expect(resValido.metadata.minutos).toBe(30);
  });
});
