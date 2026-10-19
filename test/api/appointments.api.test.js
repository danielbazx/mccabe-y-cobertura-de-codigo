/**
 * Pruebas de Integración de API - Endpoints Express con Base de Datos SQLite en Memoria
 */

const request = require('supertest');
const { createApp } = require('../../src/app');
const { DatabaseManager } = require('../../src/db/database');

describe('API de Citas Médicas y Reglas de Negocio (Integración)', () => {
  let app;
  let db;

  beforeEach(() => {
    // Instancia limpia en memoria para cada prueba
    db = new DatabaseManager(':memory:');
    db.seedInitialData();
    app = createApp(db);
  });

  afterEach(() => {
    db.close();
  });

  test('GET /api/medicos retorna los médicos disponibles', async () => {
    const res = await request(app).get('/api/medicos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    expect(res.body[0]).toHaveProperty('nombre');
    expect(res.body[0]).toHaveProperty('especialidad');
  });

  test('GET /api/pacientes retorna los pacientes registrados', async () => {
    const res = await request(app).get('/api/pacientes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });

  test('POST /api/pacientes crea un nuevo paciente exitosamente', async () => {
    const nuevo = {
      nombre: 'Lucía Méndez',
      edad: 32,
      email: 'lucia.mendez@test.com',
      telefono: '0995556677'
    };
    const res = await request(app).post('/api/pacientes').send(nuevo);
    expect(res.status).toBe(201);
    expect(res.body.nombre).toBe(nuevo.nombre);
    expect(res.body.edad).toBe(nuevo.edad);
  });

  test('POST /api/citas rechaza cita pediátrica con médico no pediatra (Regla 1)', async () => {
    // Paciente 1 es Mateo (6 años)
    // Médico 3 es Dra. Carmen Delgado (Medicina Familiar)
    const res = await request(app).post('/api/citas').send({
      medico_id: 3,
      paciente_id: 1,
      fecha_hora: '2026-11-25T10:00:00',
      motivo: 'Control de rutina'
    });

    expect(res.status).toBe(422);
    expect(res.body.exito).toBe(false);
    expect(res.body.errores[0]).toMatch(/exclusivamente por la especialidad de Pediatria/i);
  });

  test('POST /api/citas agenda exitosamente una cita válida', async () => {
    // Paciente 1 es Mateo (6 años)
    // Médico 1 es Dra. Elena Ramos (Pediatria)
    const res = await request(app).post('/api/citas').send({
      medico_id: 1,
      paciente_id: 1,
      fecha_hora: '2026-11-25T10:00:00',
      motivo: 'Vacunación infantil'
    });

    expect(res.status).toBe(201);
    expect(res.body.exito).toBe(true);
    expect(res.body.cita).toHaveProperty('id');
    expect(res.body.cita.estado).toBe('CONFIRMADA');
  });

  test('POST /api/citas detecta y bloquea choque de doble reserva (Regla 3)', async () => {
    // 1. Agendamos primera cita
    await request(app).post('/api/citas').send({
      medico_id: 1,
      paciente_id: 1,
      fecha_hora: '2026-11-25T10:00:00'
    });

    // 2. Intentamos agendar a otro paciente en el mismo horario con el mismo médico
    const resChoque = await request(app).post('/api/citas').send({
      medico_id: 1,
      paciente_id: 2, // Sofía (14 años)
      fecha_hora: '2026-11-25T10:00:00'
    });

    expect(resChoque.status).toBe(422);
    expect(resChoque.body.errores[0]).toMatch(/médico seleccionado ya tiene una cita reservada/i);
  });

  test('POST /api/citas/:id/cancelar aplica penalización si es tardía y sin emergencia (Regla 4)', async () => {
    // 1. Crear cita para el 25 de Noviembre a las 10:00 AM
    const resCita = await request(app).post('/api/citas').send({
      medico_id: 1,
      paciente_id: 1,
      fecha_hora: '2026-11-25T10:00:00'
    });
    const citaId = resCita.body.cita.id;

    // 2. Cancelar con fecha simulada a 2 horas de la cita (25 de Noviembre a las 08:00 AM) sin emergencia
    const resCancelacion = await request(app)
      .post(`/api/citas/${citaId}/cancelar`)
      .send({
        esEmergencia: false,
        fechaCancelacionSimulada: '2026-11-25T08:00:00'
      });

    expect(resCancelacion.status).toBe(200);
    expect(resCancelacion.body.cita.estado).toBe('CANCELADA_CON_PENALIZACION');
    expect(resCancelacion.body.cita.penalizacion_aplicada).toBe(1);
    expect(resCancelacion.body.cita.penalizacion_monto).toBe(15);
  });

  test('POST /api/citas/:id/cancelar exonera penalización si hay emergencia médica comprobada (Regla 4)', async () => {
    // 1. Crear cita
    const resCita = await request(app).post('/api/citas').send({
      medico_id: 1,
      paciente_id: 1,
      fecha_hora: '2026-11-25T10:00:00'
    });
    const citaId = resCita.body.cita.id;

    // 2. Cancelar con fecha simulada a 2 horas de la cita con emergencia = true
    const resCancelacion = await request(app)
      .post(`/api/citas/${citaId}/cancelar`)
      .send({
        esEmergencia: true,
        fechaCancelacionSimulada: '2026-11-25T08:00:00'
      });

    expect(resCancelacion.status).toBe(200);
    expect(resCancelacion.body.cita.estado).toBe('CANCELADA_EXONERADA');
    expect(resCancelacion.body.cita.penalizacion_aplicada).toBe(0);
    expect(resCancelacion.body.cita.penalizacion_monto).toBe(0);
  });

  test('GET /api/qa/audit entrega la matriz de auditoría de McCabe y topología', async () => {
    const res = await request(app).get('/api/qa/audit');
    expect(res.status).toBe(200);
    expect(res.body.mccabeRules.length).toBe(4);
    expect(res.body.mccabeRules[3].complejidadCiclica_VG).toBe(3);
  });
});
