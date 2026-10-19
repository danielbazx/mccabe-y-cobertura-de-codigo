/**
 * Suite de Pruebas de Caja Blanca - Regla 3: Choque de Citas (Prevención de Doble Reserva)
 * 
 * Topología CFG y Métricas de McCabe:
 * - Nodos de Predicado: P = 3
 * - Complejidad Ciclomática: V(G) = P + 1 = 4
 * - Cobertura de Ramas (Branch Coverage) = 100%
 */

const { validarChoqueDeCitas } = require('../../src/rules/conflictRule');

describe('Regla 3: Prevención de Choque de Citas (Caja Blanca McCabe V(G) = 4)', () => {
  const FECHA_COMUN = '2026-11-25T09:00:00.000Z';

  const citasExistentes = [
    {
      id: 1,
      medicoId: 10,
      pacienteId: 101,
      fechaHora: FECHA_COMUN,
      estado: 'CONFIRMADA'
    },
    {
      id: 2,
      medicoId: 20,
      pacienteId: 202,
      fechaHora: FECHA_COMUN,
      estado: 'CONFIRMADA'
    },
    {
      id: 3,
      medicoId: 30,
      pacienteId: 303,
      fechaHora: FECHA_COMUN,
      estado: 'CANCELADA_A_TIEMPO' // No debe bloquear porque está cancelada
    }
  ];

  // Camino 1: Parámetros incompletos
  test('Camino 1: Rechazo de solicitud con datos obligatorios incompletos', () => {
    const resSinDatos = validarChoqueDeCitas({ citasExistentes, nuevaCita: null });
    expect(resSinDatos.esValido).toBe(false);
    expect(resSinDatos.motivo).toMatch(/faltan parámetros obligatorios/i);

    const resIncompleto = validarChoqueDeCitas({
      citasExistentes,
      nuevaCita: { medicoId: 10, pacienteId: null, fechaHora: FECHA_COMUN }
    });
    expect(resIncompleto.esValido).toBe(false);
  });

  // Camino 2: Choque con agenda del médico
  test('Camino 2: Detección y rechazo de colisión en la agenda del médico', () => {
    const res = validarChoqueDeCitas({
      citasExistentes,
      nuevaCita: {
        medicoId: 10, // Médico 10 ya tiene cita a las 09:00
        pacienteId: 999, // Paciente distinto
        fechaHora: FECHA_COMUN
      }
    });

    expect(res.esValido).toBe(false);
    expect(res.conflicto).toBe('MEDICO');
    expect(res.motivo).toMatch(/médico seleccionado ya tiene una cita reservada/i);
  });

  // Camino 3: Choque con agenda del paciente
  test('Camino 3: Detección y rechazo de colisión en la agenda del paciente', () => {
    const res = validarChoqueDeCitas({
      citasExistentes,
      nuevaCita: {
        medicoId: 99, // Médico libre
        pacienteId: 101, // Paciente 101 ya tiene cita asignada a las 09:00 con el médico 10
        fechaHora: FECHA_COMUN
      }
    });

    expect(res.esValido).toBe(false);
    expect(res.conflicto).toBe('PACIENTE');
    expect(res.motivo).toMatch(/paciente ya cuenta con otra cita médica/i);
  });

  // Camino 4: Sin colisión -> Agenda disponible
  test('Camino 4: Cita sin conflicto de médico ni paciente es aceptada', () => {
    const res = validarChoqueDeCitas({
      citasExistentes,
      nuevaCita: {
        medicoId: 99,
        pacienteId: 999,
        fechaHora: FECHA_COMUN
      }
    });

    expect(res.esValido).toBe(true);
    expect(res.motivo).toBeUndefined();
    expect(res.conflicto).toBeUndefined();
  });

  // Caso especial: Permite agendar en horario donde la cita previa fue CANCELADA
  test('Caso Cita Previa Cancelada: No genera colisión', () => {
    const res = validarChoqueDeCitas({
      citasExistentes,
      nuevaCita: {
        medicoId: 30, // Médico 30 tenía una cita cancelada a las 09:00
        pacienteId: 303,
        fechaHora: FECHA_COMUN
      }
    });

    expect(res.esValido).toBe(true);
  });

  // Caso: Soporte para formato snake_case desde la base de datos SQLite
  test('Caso formato snake_case (BD SQLite): Detecta colisión correctamente', () => {
    const citasBD = [
      { id: 99, medico_id: 15, paciente_id: 400, fecha_hora: FECHA_COMUN, estado: 'CONFIRMADA' }
    ];

    const choqueMedicoBD = validarChoqueDeCitas({
      citasExistentes: citasBD,
      nuevaCita: { medicoId: 15, pacienteId: 500, fechaHora: FECHA_COMUN }
    });
    expect(choqueMedicoBD.esValido).toBe(false);
    expect(choqueMedicoBD.conflicto).toBe('MEDICO');

    const choquePacienteBD = validarChoqueDeCitas({
      citasExistentes: citasBD,
      nuevaCita: { medicoId: 88, pacienteId: 400, fechaHora: FECHA_COMUN }
    });
    expect(choquePacienteBD.esValido).toBe(false);
    expect(choquePacienteBD.conflicto).toBe('PACIENTE');
  });

  // Caso: Exclusión de cita en reprogramación (citaIdExcluir)
  test('Caso reprogramación con citaIdExcluir: Ignora la misma cita', () => {
    const res = validarChoqueDeCitas({
      citasExistentes: [{ id: 1, medicoId: 10, pacienteId: 101, fechaHora: FECHA_COMUN }],
      nuevaCita: {
        citaIdExcluir: 1,
        medicoId: 10,
        pacienteId: 101,
        fechaHora: FECHA_COMUN
      }
    });
    expect(res.esValido).toBe(true);
  });

  // Caso: Omisión de lista de citas existentes (utiliza default [])
  test('Caso lista de citas omitida: Acepta nueva cita', () => {
    const res = validarChoqueDeCitas({
      nuevaCita: { medicoId: 10, pacienteId: 101, fechaHora: FECHA_COMUN }
    });
    expect(res.esValido).toBe(true);
  });
});
