/**
 * Regla de Negocio 4: Penalización Tardía (< 24h) y Exoneración por Emergencia
 * (Basada explícitamente en el Caso de Estudio de la Diapositiva 8 del Taller de Auditoría)
 * 
 * Lógica Formal:
 *   if (cancelacionTardia && !esEmergencia) {
 *       aplicarPenalizacion();
 *   }
 * 
 * Análisis Topológico del Grafo de Flujo de Control (CFG):
 * - Nodo 1 (Entry): Cálculo de diferencia de horas (fechaCita - fechaCancelacion).
 * - Predicado 1 (P1): ¿cancelacionTardia (< 24 horas)?
 *   - FALSE -> Camino 1: Cancelación con anticipación (>= 24h) -> Sin penalización.
 *   - TRUE -> Evaluación de cortocircuito booleano de la segunda sub-condición:
 *     - Predicado 2 (P2): ¿!esEmergencia?
 *       - FALSE (esEmergencia = TRUE) -> Camino 2: Cancelación tardía por emergencia -> Exonerado.
 *       - TRUE (esEmergencia = FALSE) -> Camino 3: Cancelación tardía sin emergencia -> Aplica penalización.
 * - Nodo Final (Exit): Retorno del objeto auditado con estado y montos.
 * 
 * Métricas Matemáticas de McCabe:
 * - Nodos (N): 5
 * - Aristas (E): 6
 * - Nodos de Predicado (P): 2 (cancelacionTardia, !esEmergencia)
 * - Fórmulas:
 *   - V(G) = E - N + 2 = 6 - 5 + 2 = 3
 *   - V(G) = P + 1 = 2 + 1 = 3
 *   - Regiones R = 3 (2 cerradas + 1 exterior)
 * 
 * Caminos Linealmente Independientes (Basis Paths):
 * - Camino 1: cancelacionTardia = False (Cita cancelada con >= 24h)
 * - Camino 2: cancelacionTardia = True AND !esEmergencia = False (esEmergencia = True)
 * - Camino 3: cancelacionTardia = True AND !esEmergencia = True (esEmergencia = False)
 */

const MONTO_PENALIZACION_ESTANDAR = 15.00;

/**
 * Evalúa las condiciones de tiempo y causa de fuerza mayor para determinar si procede penalización.
 * 
 * @param {Object} params
 * @param {Date | string} params.fechaCita - Fecha y hora programada de la cita médica
 * @param {Date | string} [params.fechaCancelacion] - Momento en que se solicita la cancelación
 * @param {boolean} [params.esEmergencia=false] - Indicador de fuerza mayor o urgencia médica
 * @param {number} [params.tarifaPenalizacion=15.00] - Monto a penalizar en caso aplicable
 * @returns {{
 *   cancelacionTardia: boolean,
 *   esEmergencia: boolean,
 *   aplicaPenalizacion: boolean,
 *   montoPenalizacion: number,
 *   nuevoEstado: 'CANCELADA_A_TIEMPO' | 'CANCELADA_EXONERADA' | 'CANCELADA_CON_PENALIZACION',
 *   motivo: string,
 *   horasAnticipacion: number
 * }}
 */
function evaluarPenalizacionCancelacion({
  fechaCita,
  fechaCancelacion = new Date(),
  esEmergencia = false,
  tarifaPenalizacion = MONTO_PENALIZACION_ESTANDAR
}) {
  const citaTime = new Date(fechaCita).getTime();
  const cancelacionTime = new Date(fechaCancelacion).getTime();

  if (isNaN(citaTime) || isNaN(cancelacionTime)) {
    throw new Error('Fechas inválidas para el cálculo de penalización de cancelación.');
  }

  const diferenciaMilisegundos = citaTime - cancelacionTime;
  const horasAnticipacion = diferenciaMilisegundos / (1000 * 60 * 60);

  // Sub-condición booleana 1: ¿Se cancela con menos de 24 horas de antelación?
  const cancelacionTardia = horasAnticipacion < 24;

  let aplicaPenalizacion = false;
  let montoPenalizacion = 0;
  let nuevoEstado = 'CANCELADA_A_TIEMPO';
  let motivo = 'Cancelación realizada a tiempo (con 24h o más de anticipación). Sin cargo.';

  // Regla auditada (Slide 8):
  if (cancelacionTardia && !esEmergencia) {
    // Camino 3: cancelacionTardia = true && !esEmergencia = true
    aplicaPenalizacion = true;
    montoPenalizacion = Number(tarifaPenalizacion.toFixed(2));
    nuevoEstado = 'CANCELADA_CON_PENALIZACION';
    motivo = 'Cancelación tardía efectuada con menos de 24 horas de antelación sin causa de emergencia.';
  } else if (cancelacionTardia) {
    // Camino 2: cancelacionTardia = true && !esEmergencia = false (esEmergencia = true)
    aplicaPenalizacion = false;
    montoPenalizacion = 0;
    nuevoEstado = 'CANCELADA_EXONERADA';
    motivo = 'Cancelación tardía (<24h) exonerada de penalización por motivo de emergencia médica justificada.';
  }
  // Camino 1: cancelacionTardia = false (mantiene valores iniciales)

  return {
    cancelacionTardia,
    esEmergencia: Boolean(esEmergencia),
    aplicaPenalizacion,
    montoPenalizacion,
    nuevoEstado,
    motivo,
    horasAnticipacion: Number(horasAnticipacion.toFixed(2))
  };
}

module.exports = {
  MONTO_PENALIZACION_ESTANDAR,
  evaluarPenalizacionCancelacion
};
