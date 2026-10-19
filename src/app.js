/**
 * Servidor Express y Enrutamiento API para el Sistema de Citas de Médico Familiar
 */

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { getDatabase } = require('./db/database');
const { validarCitaCompleta } = require('./rules/appointmentValidator');
const { evaluarPenalizacionCancelacion } = require('./rules/cancellationPenaltyRule');

function createApp(dbInstance = null) {
  const app = express();
  const db = dbInstance || getDatabase();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // 1. Listar médicos
  app.get('/api/medicos', (req, res) => {
    try {
      const medicos = db.getMedicos();
      res.json(medicos);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener lista de médicos', detalle: err.message });
    }
  });

  // 2. Listar pacientes
  app.get('/api/pacientes', (req, res) => {
    try {
      const pacientes = db.getPacientes();
      res.json(pacientes);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener lista de pacientes', detalle: err.message });
    }
  });

  // 3. Crear paciente
  app.post('/api/pacientes', (req, res) => {
    try {
      const { nombre, edad, email, telefono, tutor_nombre, tutor_telefono } = req.body;
      if (!nombre || typeof edad !== 'number') {
        return res.status(400).json({ error: 'Nombre y edad válida son obligatorios.' });
      }
      const nuevo = db.createPaciente({ nombre, edad, email, telefono, tutor_nombre, tutor_telefono });
      res.status(201).json(nuevo);
    } catch (err) {
      res.status(500).json({ error: 'Error al registrar paciente', detalle: err.message });
    }
  });

  // 4. Listar citas
  app.get('/api/citas', (req, res) => {
    try {
      const { medico_id, paciente_id, estado } = req.query;
      const citas = db.getCitas({ medico_id, paciente_id, estado });
      res.json(citas);
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar citas', detalle: err.message });
    }
  });

  // 5. Agendar cita aplicando reglas de negocio de Caja Blanca
  app.post('/api/citas', (req, res) => {
    try {
      const { medico_id, paciente_id, fecha_hora, motivo } = req.body;

      if (!medico_id || !paciente_id || !fecha_hora) {
        return res.status(400).json({
          error: 'Faltan parámetros requeridos (medico_id, paciente_id, fecha_hora).'
        });
      }

      const medico = db.getMedicoById(medico_id);
      if (!medico) {
        return res.status(404).json({ error: 'El médico especificado no existe en el sistema.' });
      }

      const paciente = db.getPacienteById(paciente_id);
      if (!paciente) {
        return res.status(404).json({ error: 'El paciente especificado no existe en el sistema.' });
      }

      const citasExistentes = db.getCitas();

      // Validación Caja Blanca de las 3 reglas preventivas
      const auditoria = validarCitaCompleta({
        paciente: {
          id: paciente.id,
          edad: paciente.edad,
          tutorNombre: paciente.tutor_nombre,
          tutorTelefono: paciente.tutor_telefono
        },
        medico: {
          id: medico.id,
          especialidad: medico.especialidad
        },
        fechaHora: fecha_hora,
        citasExistentes
      });

      if (!auditoria.esValido) {
        return res.status(422).json({
          exito: false,
          error: 'Fallo en la auditoría de reglas de negocio.',
          errores: auditoria.errores,
          tipoPaciente: auditoria.tipoPaciente
        });
      }

      const nuevaCita = db.createCita({
        medico_id,
        paciente_id,
        fecha_hora,
        motivo
      });

      res.status(201).json({
        exito: true,
        mensaje: 'Cita médica agendada con éxito tras superar la auditoría de reglas.',
        cita: nuevaCita
      });
    } catch (err) {
      res.status(500).json({ error: 'Error al procesar la cita', detalle: err.message });
    }
  });

  // 6. Cancelar cita aplicando la regla de penalización tardía (<24h)
  app.post('/api/citas/:id/cancelar', (req, res) => {
    try {
      const { id } = req.params;
      const { esEmergencia = false, fechaCancelacionSimulada } = req.body;

      const cita = db.getCitaById(id);
      if (!cita) {
        return res.status(404).json({ error: 'La cita especificada no existe.' });
      }

      if (cita.estado.startsWith('CANCELADA')) {
        return res.status(400).json({ error: 'La cita ya se encuentra en estado cancelado.' });
      }

      // Ejecutar la Regla 4 de Penalización Tardía
      const fechaCancelacion = fechaCancelacionSimulada ? new Date(fechaCancelacionSimulada) : new Date();
      const resultadoPenalizacion = evaluarPenalizacionCancelacion({
        fechaCita: cita.fecha_hora,
        fechaCancelacion,
        esEmergencia: Boolean(esEmergencia)
      });

      const citaActualizada = db.updateCitaCancelacion(id, {
        estado: resultadoPenalizacion.nuevoEstado,
        penalizacion_aplicada: resultadoPenalizacion.aplicaPenalizacion,
        penalizacion_monto: resultadoPenalizacion.montoPenalizacion,
        penalizacion_motivo: resultadoPenalizacion.motivo
      });

      res.json({
        exito: true,
        mensaje: 'Cancelación procesada conforme a las reglas de auditoría.',
        auditoria: resultadoPenalizacion,
        cita: citaActualizada
      });
    } catch (err) {
      res.status(500).json({ error: 'Error al cancelar la cita', detalle: err.message });
    }
  });

  // 7. Endpoint de Auditoría de QA y Métricas McCabe
  app.get('/api/qa/audit', (req, res) => {
    res.json({
      framework: 'Augmented QA Framework (Pruebas de Caja Blanca en la Era de la IA)',
      mccabeRules: [
        {
          id: 1,
          nombre: 'Regla de Edad (Pediátrico vs Adulto)',
          archivo: 'src/rules/ageRule.js',
          predicados: 4,
          complejidadCiclica_VG: 5,
          limiteCumplido: true,
          caminosIndependientes: 5,
          descripcion: 'Valida correspondencia entre edad (<18 vs >=18), especialidad (Pediatría vs Adulto) y existencia de tutor legal.'
        },
        {
          id: 2,
          nombre: 'Restricción de Horarios (Franjas No Operativas)',
          archivo: 'src/rules/scheduleRule.js',
          predicados: 6,
          complejidadCiclica_VG: 7,
          limiteCumplido: true,
          caminosIndependientes: 7,
          descripcion: 'Bloquea fechas pasadas, fines de semana, horas fuera de 08:00-17:00, receso de 13:00-14:00 y bloques no modulares de 30m.'
        },
        {
          id: 3,
          nombre: 'Choque de Citas (Prevención de Doble Reserva)',
          archivo: 'src/rules/conflictRule.js',
          predicados: 3,
          complejidadCiclica_VG: 4,
          limiteCumplido: true,
          caminosIndependientes: 4,
          descripcion: 'Impide solapamiento temporal de citas activas tanto para el médico como para el paciente.'
        },
        {
          id: 4,
          nombre: 'Penalización Tardía y Exoneración (<24h)',
          archivo: 'src/rules/cancellationPenaltyRule.js',
          predicados: 2,
          complejidadCiclica_VG: 3,
          limiteCumplido: true,
          caminosIndependientes: 3,
          formula: 'if (cancelacionTardia && !esEmergencia) { aplicarPenalizacion(); }',
          descripcion: 'Evalúa la ventana crítica de 24 horas y exenciones por emergencia médica bajo el modelo PIE.'
        }
      ]
    });
  });

  return app;
}

module.exports = { createApp };
