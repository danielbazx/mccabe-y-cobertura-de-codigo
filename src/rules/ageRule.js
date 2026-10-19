/**
 * Regla de Negocio 1: Validación de Edad (Pediátrica vs. Adulta)
 * 
 * Topología del Grafo de Flujo de Control (CFG):
 * - Nodo 1 (Entry / Inicio)
 * - Predicado 1 (P1): ¿edad < 18?
 *   - Rama TRUE (Paciente Pediátrico):
 *     - Predicado 2 (P2): ¿especialidad !== 'Pediatria'?
 *       - TRUE -> Error: Solo pediatra
 *       - FALSE ->
 *         - Predicado 3 (P3): ¿!tutorNombre || !tutorTelefono?
 *           - TRUE -> Error: Requiere tutor legal
 *           - FALSE -> Éxito (Pediátrico válido)
 *   - Rama FALSE (Paciente Adulto >= 18 años):
 *     - Predicado 4 (P4): ¿especialidad === 'Pediatria'?
 *       - TRUE -> Error: Adulto no puede ir a pediatría
 *       - FALSE -> Éxito (Adulto válido)
 * - Nodo Final (Exit / Retorno)
 * 
 * Métricas de McCabe:
 * - Nodos de Predicado P = 4 (edad < 18, especialidad !== 'Pediatria', tutor incompleto, especialidad === 'Pediatria')
 * - Complejidad Ciclomática V(G) = P + 1 = 5
 * - Caminos Linealmente Independientes = 5
 */

/**
 * Valida la correspondencia de edad del paciente con la especialidad médica y requisitos legales.
 * 
 * @param {Object} datos
 * @param {number} datos.edad - Edad del paciente en años
 * @param {string} datos.especialidad - Especialidad del médico (ej: 'Pediatria', 'Medicina Familiar', 'Medicina General')
 * @param {string} [datos.tutorNombre] - Nombre del representante legal
 * @param {string} [datos.tutorTelefono] - Teléfono de contacto del tutor
 * @returns {{ esValido: boolean, motivo?: string, tipoPaciente: 'PEDIATRICO' | 'ADULTO' }}
 */
function validarReglaEdad({ edad, especialidad, tutorNombre, tutorTelefono }) {
  if (typeof edad !== 'number' || isNaN(edad) || edad < 0) {
    return {
      esValido: false,
      motivo: 'La edad debe ser un número entero mayor o igual a 0.',
      tipoPaciente: 'DESCONOCIDO'
    };
  }

  const esPediatrico = edad < 18;

  if (esPediatrico) {
    // Sub-regla pediátrica 1: Solo pediatría
    if (especialidad !== 'Pediatria') {
      return {
        esValido: false,
        motivo: 'Los pacientes pediátricos (menores de 18 años) deben ser atendidos exclusivamente por la especialidad de Pediatria.',
        tipoPaciente: 'PEDIATRICO'
      };
    }

    // Sub-regla pediátrica 2: Requiere tutor legal completo
    const tieneTutorCompleto = Boolean(tutorNombre && tutorNombre.trim() && tutorTelefono && tutorTelefono.trim());
    if (!tieneTutorCompleto) {
      return {
        esValido: false,
        motivo: 'Los pacientes menores de 18 años requieren registrar un tutor o representante legal con nombre y teléfono de contacto.',
        tipoPaciente: 'PEDIATRICO'
      };
    }

    return {
      esValido: true,
      tipoPaciente: 'PEDIATRICO'
    };
  } else {
    // Sub-regla adulto: No puede consultar en pediatría
    if (especialidad === 'Pediatria') {
      return {
        esValido: false,
        motivo: 'Los pacientes adultos (mayores o iguales a 18 años) no pueden agendar consultas en la especialidad de Pediatria.',
        tipoPaciente: 'ADULTO'
      };
    }

    return {
      esValido: true,
      tipoPaciente: 'ADULTO'
    };
  }
}

module.exports = {
  validarReglaEdad
};
