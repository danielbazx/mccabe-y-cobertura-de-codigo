/**
 * Suite de Pruebas de Integración y Orquestación - Validador Completo de Citas
 */

const { validarCitaCompleta } = require('../../src/rules/appointmentValidator');

describe('Orquestador de Validación de Citas (Caja Blanca Integral)', () => {
  const FECHA_VALIDA = '2026-11-24T10:00:00'; // Martes hábil 10:00 AM
  const FECHA_REF = '2026-11-20T08:00:00';

  const medicoPediatra = { id: 1, nombre: 'Dra. Ramos', especialidad: 'Pediatria' };
  const medicoGeneral = { id: 2, nombre: 'Dr. Morales', especialidad: 'Medicina General' };

  const pacientePediátrico = {
    id: 10,
    nombre: 'Mateo',
    edad: 8,
    tutor_nombre: 'Daniel Cadena',
    tutor_telefono: '0991234567'
  };

  const pacienteAdulto = {
    id: 20,
    nombre: 'Carlos',
    edad: 30
  };

  test('Validación Exitosa: Paciente pediátrico con tutor y pediatra en horario hábil', () => {
    const res = validarCitaCompleta({
      paciente: pacientePediátrico,
      medico: medicoPediatra,
      fechaHora: FECHA_VALIDA,
      fechaReferencia: FECHA_REF,
      citasExistentes: []
    });

    expect(res.esValido).toBe(true);
    expect(res.errores.length).toBe(0);
    expect(res.tipoPaciente).toBe('PEDIATRICO');
  });

  test('Validación Exitosa: Paciente adulto con médico general en horario hábil', () => {
    const res = validarCitaCompleta({
      paciente: pacienteAdulto,
      medico: medicoGeneral,
      fechaHora: FECHA_VALIDA,
      fechaReferencia: FECHA_REF,
      citasExistentes: []
    });

    expect(res.esValido).toBe(true);
    expect(res.errores.length).toBe(0);
    expect(res.tipoPaciente).toBe('ADULTO');
  });

  test('Validación Fallida Múltiple: Paciente adulto en pediatría en domingo', () => {
    // Domingo 22 de Noviembre
    const FECHA_DOMINGO = '2026-11-22T10:00:00';
    const res = validarCitaCompleta({
      paciente: pacienteAdulto,
      medico: medicoPediatra, // Error 1: Adulto en pediatría
      fechaHora: FECHA_DOMINGO, // Error 2: Domingo no operativo
      fechaReferencia: FECHA_REF,
      citasExistentes: []
    });

    expect(res.esValido).toBe(false);
    expect(res.errores.length).toBe(2);
    expect(res.errores[0]).toMatch(/adultos.*no pueden agendar consultas en la especialidad de Pediatria/i);
    expect(res.errores[1]).toMatch(/días hábiles/i);
  });

  test('Validación Defensiva: Parámetros nulos o incompletos', () => {
    const resSinPaciente = validarCitaCompleta({ paciente: null, medico: medicoGeneral, fechaHora: FECHA_VALIDA });
    expect(resSinPaciente.esValido).toBe(false);
    expect(resSinPaciente.errores[0]).toMatch(/paciente incompleta/i);

    const resSinMedico = validarCitaCompleta({ paciente: pacienteAdulto, medico: null, fechaHora: FECHA_VALIDA });
    expect(resSinMedico.esValido).toBe(false);
    expect(resSinMedico.errores[0]).toMatch(/médico incompleta/i);
  });
});
