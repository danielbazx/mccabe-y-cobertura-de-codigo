/**
 * Suite de Pruebas de Caja Blanca - Regla 4: Penalización Tardía y Exoneración (< 24h)
 * 
 * Basado explícitamente en los Pasos 1, 2 y 3 del Taller de Auditoría (Diapositivas 8, 9 y 10).
 * 
 * Especificación Topológica del Grafo de Flujo de Control (CFG):
 * - Nodos de Predicado: P = 2 (cancelacionTardia, !esEmergencia)
 * - Complejidad Ciclomática de McCabe: V(G) = P + 1 = 3
 * - Número de Pruebas Matemáticamente Obligatorias = Exactamente 3 Caminos Independientes
 * 
 * Implementación del Modelo PIE (Anti Tests Zombis):
 * - P (Execution): Se fuerza la ejecución del camino de bifurcación boolean.
 * - I (Infection & Propagation): Se calcula y altera el estado interno de penalización y montos.
 * - E (Detection - Oráculos Estrictos): Aserciones sobre todos los atributos del resultado.
 */

const {
  evaluarPenalizacionCancelacion,
  MONTO_PENALIZACION_ESTANDAR
} = require('../../src/rules/cancellationPenaltyRule');

describe('Regla 4: Penalización Tardía de Cancelación (Auditoría de Caja Blanca - McCabe V(G) = 3)', () => {
  const FECHA_CITA_BASE = '2026-11-20T10:00:00.000Z';

  // =========================================================================
  // CAMINO 1: cancelacionTardia = False (Cancelación con >= 24h de antelación)
  // =========================================================================
  test('Camino Independiente 1: cancelacionTardia = False -> Cancelación oportuna sin penalización', () => {
    // Oráculo de entrada: Cancelación efectuada 48 horas antes de la cita
    const fechaCancelacion = '2026-11-18T10:00:00.000Z'; // 48h antes
    const esEmergencia = false;

    const resultado = evaluarPenalizacionCancelacion({
      fechaCita: FECHA_CITA_BASE,
      fechaCancelacion,
      esEmergencia
    });

    // Oráculos estrictos (Detección - Modelo PIE):
    expect(resultado.cancelacionTardia).toBe(false);
    expect(resultado.esEmergencia).toBe(false);
    expect(resultado.aplicaPenalizacion).toBe(false);
    expect(resultado.montoPenalizacion).toBe(0);
    expect(resultado.nuevoEstado).toBe('CANCELADA_A_TIEMPO');
    expect(resultado.horasAnticipacion).toBe(48);
    expect(resultado.motivo).toMatch(/a tiempo|anticipación/i);
  });

  // =========================================================================
  // CAMINO 2: cancelacionTardia = True AND !esEmergencia = False (esEmergencia = True)
  // =========================================================================
  test('Camino Independiente 2: cancelacionTardia = True & esEmergencia = True -> Exoneración de penalización', () => {
    // Oráculo de entrada: Cancelación tardía (2 horas antes), pero con emergencia justificada
    const fechaCancelacion = '2026-11-20T08:00:00.000Z'; // 2h antes (<24h)
    const esEmergencia = true;

    const resultado = evaluarPenalizacionCancelacion({
      fechaCita: FECHA_CITA_BASE,
      fechaCancelacion,
      esEmergencia
    });

    // Oráculos estrictos (Detección - Modelo PIE):
    expect(resultado.cancelacionTardia).toBe(true);
    expect(resultado.esEmergencia).toBe(true);
    expect(resultado.aplicaPenalizacion).toBe(false);
    expect(resultado.montoPenalizacion).toBe(0);
    expect(resultado.nuevoEstado).toBe('CANCELADA_EXONERADA');
    expect(resultado.horasAnticipacion).toBe(2);
    expect(resultado.motivo).toMatch(/exonerada|emergencia/i);
  });

  // =========================================================================
  // CAMINO 3: cancelacionTardia = True AND !esEmergencia = True (esEmergencia = False)
  // =========================================================================
  test('Camino Independiente 3: cancelacionTardia = True & esEmergencia = False -> Aplica penalización estricta', () => {
    // Oráculo de entrada: Cancelación tardía (5 horas antes) sin justificación de emergencia
    const fechaCancelacion = '2026-11-20T05:00:00.000Z'; // 5h antes (<24h)
    const esEmergencia = false;

    const resultado = evaluarPenalizacionCancelacion({
      fechaCita: FECHA_CITA_BASE,
      fechaCancelacion,
      esEmergencia,
      tarifaPenalizacion: 20.00
    });

    // Oráculos estrictos (Detección - Modelo PIE):
    expect(resultado.cancelacionTardia).toBe(true);
    expect(resultado.esEmergencia).toBe(false);
    expect(resultado.aplicaPenalizacion).toBe(true);
    expect(resultado.montoPenalizacion).toBe(20.00);
    expect(resultado.nuevoEstado).toBe('CANCELADA_CON_PENALIZACION');
    expect(resultado.horasAnticipacion).toBe(5);
    expect(resultado.motivo).toMatch(/penalización|menos de 24 horas/i);
  });

  // =========================================================================
  // CASO DE CONTROL DEFENSIVO: Fechas corruptas o inválidas
  // =========================================================================
  test('Control Defensivo: Fechas inválidas lanzan excepción esperada', () => {
    expect(() => {
      evaluarPenalizacionCancelacion({
        fechaCita: 'fecha-no-valida',
        fechaCancelacion: '2026-11-20'
      });
    }).toThrow('Fechas inválidas');
  });

  // =========================================================================
  // CASO DE VALORES POR DEFECTO: fechaCancelacion y tarifaPenalizacion omitidos
  // =========================================================================
  test('Valores por defecto: utiliza fecha actual y tarifa estándar', () => {
    // Cita en el futuro lejano (ej: 10 días a partir de ahora)
    const fechaFutura = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const resultado = evaluarPenalizacionCancelacion({
      fechaCita: fechaFutura
      // Omite fechaCancelacion y tarifaPenalizacion intencionalmente
    });

    expect(resultado.cancelacionTardia).toBe(false);
    expect(resultado.aplicaPenalizacion).toBe(false);
    expect(resultado.montoPenalizacion).toBe(0);
    expect(resultado.nuevoEstado).toBe('CANCELADA_A_TIEMPO');
  });
});
