/**
 * Regla de Negocio 2: Restricción de Horarios (Bloqueo de Franjas No Operativas)
 * 
 * Topología del Grafo de Flujo de Control (CFG):
 * - Nodo 1: Entry / Parseo de fecha
 * - Predicado 1 (P1): ¿Fecha inválida (NaN)?
 *   - TRUE -> Retorno: Error de formato
 *   - FALSE -> Continúa
 * - Predicado 2 (P2): ¿Fecha en el pasado (fechaHora <= fechaReferenciaActual)?
 *   - TRUE -> Retorno: Error fecha pasada
 *   - FALSE -> Continúa
 * - Predicado 3 (P3): ¿Fin de semana (dia === 0 || dia === 6)?
 *   - TRUE -> Retorno: Error días no operativos (Sábado / Domingo)
 *   - FALSE -> Continúa
 * - Predicado 4 (P4): ¿Fuera de rango operativo (hora < 8 || hora >= 17)?
 *   - TRUE -> Retorno: Error fuera de horario (08:00 - 17:00)
 *   - FALSE -> Continúa
 * - Predicado 5 (P5): ¿Franja de receso médico (hora === 13)?
 *   - TRUE -> Retorno: Error franja de receso (13:00 - 14:00)
 *   - FALSE -> Continúa
 * - Predicado 6 (P6): ¿Intervalo no estándar (minutos !== 0 && minutos !== 30)?
 *   - TRUE -> Retorno: Error intervalo inválido (solo bloques :00 y :30)
 *   - FALSE -> Continúa
 * - Nodo Final: Retorno Éxito (Horario operativo disponible)
 * 
 * Métricas de McCabe:
 * - Nodos de Predicado P = 6
 * - Complejidad Ciclomática V(G) = P + 1 = 7
 * - Límite de McCabe cumplido: V(G) = 7 <= 10
 * - Caminos Linealmente Independientes = 7
 */

/**
 * Valida si la fecha y hora seleccionada se encuentra dentro de las franjas operativas permitidas.
 * 
 * @param {Object} params
 * @param {Date | string} params.fechaHora - Fecha y hora solicitada para la cita
 * @param {Date | string} [params.fechaReferencia] - Fecha actual para validación (permite determinismo en pruebas)
 * @returns {{ esValido: boolean, motivo?: string, metadata?: Object }}
 */
function validarRestriccionHorario({ fechaHora, fechaReferencia = new Date() }) {
  const citaDate = new Date(fechaHora);
  const referenciaDate = new Date(fechaReferencia);

  if (isNaN(citaDate.getTime()) || isNaN(referenciaDate.getTime())) {
    return {
      esValido: false,
      motivo: 'El formato de fecha y hora proporcionado no es válido.'
    };
  }

  // 1. Bloqueo de fechas pasadas
  if (citaDate.getTime() <= referenciaDate.getTime()) {
    return {
      esValido: false,
      motivo: 'No es posible agendar citas en fechas u horas pasadas.'
    };
  }

  // 2. Bloqueo de días no operativos (Domingo = 0, Sábado = 6)
  const diaSemana = citaDate.getDay();
  if (diaSemana === 0 || diaSemana === 6) {
    return {
      esValido: false,
      motivo: 'El centro de salud familiar solo opera en días hábiles (Lunes a Viernes).'
    };
  }

  // 3. Bloqueo fuera del horario operativo general (08:00 a 17:00)
  const hora = citaDate.getHours();
  if (hora < 8 || hora >= 17) {
    return {
      esValido: false,
      motivo: 'El horario de atención es exclusivamente de 08:00 a 17:00 horas.'
    };
  }

  // 4. Bloqueo de franja de receso médico (13:00 a 14:00)
  if (hora === 13) {
    return {
      esValido: false,
      motivo: 'La franja de 13:00 a 14:00 horas está bloqueada por receso de almuerzo del personal médico.'
    };
  }

  // 5. Bloqueo de intervalos no modulares (solo bloques de 30 minutos: :00 o :30)
  const minutos = citaDate.getMinutes();
  if (minutos !== 0 && minutos !== 30) {
    return {
      esValido: false,
      motivo: 'Las citas deben agendarse en bloques exactos de 30 minutos (ejemplo: XX:00 o XX:30).'
    };
  }

  return {
    esValido: true,
    metadata: {
      diaSemana,
      hora,
      minutos,
      fechaISO: citaDate.toISOString()
    }
  };
}

module.exports = {
  validarRestriccionHorario
};
