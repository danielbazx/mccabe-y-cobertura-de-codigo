/**
 * Orquestador de Validación de Citas Médicas
 * 
 * Integra modularmente las 3 reglas de negocio preventivas antes de permitir
 * la inserción en la base de datos:
 * 1. Regla de Edad (Pediátrico vs. Adulto y tutor legal)
 * 2. Restricción de Horarios (Franjas operativas y días hábiles)
 * 3. Choque de Citas (Prevención de doble reserva médica/paciente)
 */

const { validarReglaEdad } = require('./ageRule');
const { validarRestriccionHorario } = require('./scheduleRule');
const { validarChoqueDeCitas } = require('./conflictRule');

/**
 * Valida de manera integral todos los requisitos para agendar una cita.
 * 
 * @param {Object} params
 * @param {Object} params.paciente - Datos del paciente ({ id, edad, tutorNombre, tutorTelefono })
 * @param {Object} params.medico - Datos del médico ({ id, especialidad })
 * @param {string | Date} params.fechaHora - Fecha y hora solicitada
 * @param {Array<Object>} [params.citasExistentes=[]] - Citas ya registradas
 * @param {string | Date} [params.fechaReferencia] - Para control temporal en tests
 * @returns {{ esValido: boolean, errores: string[], tipoPaciente?: string }}
 */
function validarCitaCompleta({
  paciente,
  medico,
  fechaHora,
  citasExistentes = [],
  fechaReferencia
}) {
  const errores = [];

  if (!paciente || typeof paciente.edad === 'undefined') {
    return {
      esValido: false,
      errores: ['Información del paciente incompleta o inexistente.']
    };
  }

  if (!medico || !medico.especialidad) {
    return {
      esValido: false,
      errores: ['Información del médico incompleta o sin especialidad.']
    };
  }

  // 1. Regla de Edad
  const resEdad = validarReglaEdad({
    edad: paciente.edad,
    especialidad: medico.especialidad,
    tutorNombre: paciente.tutorNombre || paciente.tutor_nombre,
    tutorTelefono: paciente.tutorTelefono || paciente.tutor_telefono
  });

  if (!resEdad.esValido) {
    errores.push(resEdad.motivo);
  }

  // 2. Regla de Horario
  const resHorario = validarRestriccionHorario({
    fechaHora,
    fechaReferencia
  });

  if (!resHorario.esValido) {
    errores.push(resHorario.motivo);
  }

  // 3. Regla de Choque de Citas
  const resChoque = validarChoqueDeCitas({
    citasExistentes,
    nuevaCita: {
      medicoId: medico.id,
      pacienteId: paciente.id,
      fechaHora
    }
  });

  if (!resChoque.esValido) {
    errores.push(resChoque.motivo);
  }

  return {
    esValido: errores.length === 0,
    errores,
    tipoPaciente: resEdad.tipoPaciente
  };
}

module.exports = {
  validarCitaCompleta
};
