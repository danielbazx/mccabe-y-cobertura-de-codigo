/**
 * Regla de Negocio 3: Choque de Citas (Prevención de Doble Reserva)
 * 
 * Topología del Grafo de Flujo de Control (CFG):
 * - Nodo 1: Entry / Normalización de fecha y listas
 * - Predicado 1 (P1): ¿Datos obligatorios ausentes (nuevaCita inválida)?
 *   - TRUE -> Retorno: Error de datos
 *   - FALSE -> Continúa
 * - Predicado 2 (P2): ¿Existe choque de médico (mismo medicoId en el mismo bloque horario activo)?
 *   - TRUE -> Retorno: Error choque médico
 *   - FALSE -> Continúa
 * - Predicado 3 (P3): ¿Existe choque de paciente (mismo pacienteId en el mismo bloque horario activo)?
 *   - TRUE -> Retorno: Error choque paciente
 *   - FALSE -> Continúa
 * - Nodo Final: Retorno Éxito (Sin colisiones)
 * 
 * Métricas de McCabe:
 * - Nodos Predicado P = 3
 * - Complejidad Ciclomática V(G) = P + 1 = 4
 * - Límite de McCabe cumplido: V(G) = 4 <= 10
 * - Caminos Linealmente Independientes = 4
 */

/**
 * Valida la ausencia de colisiones de agenda tanto para el médico como para el paciente.
 * 
 * @param {Object} params
 * @param {Array<Object>} params.citasExistentes - Lista de citas registradas en el sistema
 * @param {Object} params.nuevaCita - Cita a validar
 * @param {number|string} params.nuevaCita.medicoId - ID del médico
 * @param {number|string} params.nuevaCita.pacienteId - ID del paciente
 * @param {string|Date} params.nuevaCita.fechaHora - Fecha y hora del turno
 * @param {number|string} [params.nuevaCita.citaIdExcluir] - ID de cita a excluir (para reprogramaciones)
 * @returns {{ esValido: boolean, motivo?: string, conflicto?: 'MEDICO' | 'PACIENTE' }}
 */
function validarChoqueDeCitas({ citasExistentes = [], nuevaCita }) {
  if (!nuevaCita || !nuevaCita.medicoId || !nuevaCita.pacienteId || !nuevaCita.fechaHora) {
    return {
      esValido: false,
      motivo: 'Faltan parámetros obligatorios para validar el choque de citas (medicoId, pacienteId, fechaHora).'
    };
  }

  const nuevaFechaTime = new Date(nuevaCita.fechaHora).getTime();

  // Filtrar citas activas que no estén canceladas y excluir la propia cita si es actualización
  const citasActivas = citasExistentes.filter(c => {
    const estado = (c.estado || '').toUpperCase();
    const esCancelada = estado.includes('CANCEL');
    const esMismaCita = nuevaCita.citaIdExcluir && String(c.id) === String(nuevaCita.citaIdExcluir);
    return !esCancelada && !esMismaCita;
  });

  // Verificación de choque con la agenda del médico
  const choqueMedico = citasActivas.find(c => {
    const cTime = new Date(c.fechaHora || c.fecha_hora).getTime();
    return String(c.medicoId || c.medico_id) === String(nuevaCita.medicoId) && cTime === nuevaFechaTime;
  });

  if (choqueMedico) {
    return {
      esValido: false,
      motivo: 'El médico seleccionado ya tiene una cita reservada y confirmada en ese horario.',
      conflicto: 'MEDICO'
    };
  }

  // Verificación de choque con la agenda del paciente
  const choquePaciente = citasActivas.find(c => {
    const cTime = new Date(c.fechaHora || c.fecha_hora).getTime();
    return String(c.pacienteId || c.paciente_id) === String(nuevaCita.pacienteId) && cTime === nuevaFechaTime;
  });

  if (choquePaciente) {
    return {
      esValido: false,
      motivo: 'El paciente ya cuenta con otra cita médica agendada en el mismo bloque horario.',
      conflicto: 'PACIENTE'
    };
  }

  return {
    esValido: true
  };
}

module.exports = {
  validarChoqueDeCitas
};
