/**
 * Capa de Persistencia SQLite (usando la API nativa DatabaseSync de Node.js 22)
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

class DatabaseManager {
  constructor(dbPath = null) {
    if (dbPath === ':memory:') {
      this.db = new DatabaseSync(':memory:');
    } else {
      const resolvedPath = dbPath || path.join(__dirname, '..', '..', 'appointments.db');
      this.db = new DatabaseSync(resolvedPath);
    }
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS medicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        especialidad TEXT NOT NULL,
        email TEXT,
        telefono TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS pacientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        edad INTEGER NOT NULL,
        email TEXT,
        telefono TEXT,
        tutor_nombre TEXT,
        tutor_telefono TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS citas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medico_id INTEGER NOT NULL,
        paciente_id INTEGER NOT NULL,
        fecha_hora TEXT NOT NULL,
        motivo TEXT,
        estado TEXT NOT NULL DEFAULT 'CONFIRMADA',
        penalizacion_aplicada INTEGER DEFAULT 0,
        penalizacion_monto REAL DEFAULT 0,
        penalizacion_motivo TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (medico_id) REFERENCES medicos(id),
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
      );
    `);
  }

  seedInitialData() {
    const medicosCount = this.db.prepare('SELECT COUNT(*) as count FROM medicos').get().count;
    if (medicosCount === 0) {
      const insertMedico = this.db.prepare(`
        INSERT INTO medicos (nombre, especialidad, email, telefono)
        VALUES (?, ?, ?, ?)
      `);
      insertMedico.run('Dra. Elena Ramos', 'Pediatria', 'elena.ramos@saludfamiliar.com', '+593 99 111 2233');
      insertMedico.run('Dr. Fernando Castro', 'Pediatria', 'fernando.castro@saludfamiliar.com', '+593 99 222 3344');
      insertMedico.run('Dra. Carmen Delgado', 'Medicina Familiar', 'carmen.delgado@saludfamiliar.com', '+593 99 333 4455');
      insertMedico.run('Dr. Javier Morales', 'Medicina General', 'javier.morales@saludfamiliar.com', '+593 99 444 5566');
    }

    const pacientesCount = this.db.prepare('SELECT COUNT(*) as count FROM pacientes').get().count;
    if (pacientesCount === 0) {
      const insertPaciente = this.db.prepare(`
        INSERT INTO pacientes (nombre, edad, email, telefono, tutor_nombre, tutor_telefono)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      // Paciente pediátrico con tutor
      insertPaciente.run('Mateo Cadena (6 años)', 6, 'contacto@familia.com', '+593 98 123 4567', 'Daniel Cadena', '+593 99 876 5432');
      // Paciente pediátrico de 14 años con tutor
      insertPaciente.run('Sofía Navarro (14 años)', 14, 'sofia.tutor@email.com', '+593 98 234 5678', 'Lucía Navarro', '+593 99 765 4321');
      // Paciente adulto de 28 años
      insertPaciente.run('Carlos Andrade (28 años)', 28, 'carlos.andrade@email.com', '+593 98 345 6789', null, null);
      // Paciente adulto mayor de 65 años
      insertPaciente.run('Rosa Benítez (65 años)', 65, 'rosa.benitez@email.com', '+593 98 456 7890', null, null);
    }
  }

  // Métodos de Médicos
  getMedicos() {
    return this.db.prepare('SELECT * FROM medicos ORDER BY nombre ASC').all();
  }

  getMedicoById(id) {
    return this.db.prepare('SELECT * FROM medicos WHERE id = ?').get(id);
  }

  // Métodos de Pacientes
  getPacientes() {
    return this.db.prepare('SELECT * FROM pacientes ORDER BY nombre ASC').all();
  }

  getPacienteById(id) {
    return this.db.prepare('SELECT * FROM pacientes WHERE id = ?').get(id);
  }

  createPaciente({ nombre, edad, email, telefono, tutor_nombre, tutor_telefono }) {
    const stmt = this.db.prepare(`
      INSERT INTO pacientes (nombre, edad, email, telefono, tutor_nombre, tutor_telefono)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(nombre, edad, email || null, telefono || null, tutor_nombre || null, tutor_telefono || null);
    return this.getPacienteById(result.lastInsertRowid);
  }

  // Métodos de Citas
  getCitas(filtro = {}) {
    let query = `
      SELECT c.*, 
             m.nombre as medico_nombre, m.especialidad as medico_especialidad,
             p.nombre as paciente_nombre, p.edad as paciente_edad,
             p.tutor_nombre, p.tutor_telefono
      FROM citas c
      JOIN medicos m ON c.medico_id = m.id
      JOIN pacientes p ON c.paciente_id = p.id
    `;
    const params = [];
    const conditions = [];

    if (filtro.medico_id) {
      conditions.push('c.medico_id = ?');
      params.push(filtro.medico_id);
    }
    if (filtro.paciente_id) {
      conditions.push('c.paciente_id = ?');
      params.push(filtro.paciente_id);
    }
    if (filtro.estado) {
      conditions.push('c.estado = ?');
      params.push(filtro.estado);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY c.fecha_hora DESC';
    return this.db.prepare(query).all(...params);
  }

  getCitaById(id) {
    return this.db.prepare(`
      SELECT c.*, 
             m.nombre as medico_nombre, m.especialidad as medico_especialidad,
             p.nombre as paciente_nombre, p.edad as paciente_edad,
             p.tutor_nombre, p.tutor_telefono
      FROM citas c
      JOIN medicos m ON c.medico_id = m.id
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.id = ?
    `).get(id);
  }

  createCita({ medico_id, paciente_id, fecha_hora, motivo }) {
    const stmt = this.db.prepare(`
      INSERT INTO citas (medico_id, paciente_id, fecha_hora, motivo, estado)
      VALUES (?, ?, ?, ?, 'CONFIRMADA')
    `);
    const result = stmt.run(medico_id, paciente_id, fecha_hora, motivo || 'Consulta médica general');
    return this.getCitaById(result.lastInsertRowid);
  }

  updateCitaCancelacion(id, { estado, penalizacion_aplicada, penalizacion_monto, penalizacion_motivo }) {
    const stmt = this.db.prepare(`
      UPDATE citas
      SET estado = ?,
          penalizacion_aplicada = ?,
          penalizacion_monto = ?,
          penalizacion_motivo = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(
      estado,
      penalizacion_aplicada ? 1 : 0,
      penalizacion_monto || 0,
      penalizacion_motivo || null,
      id
    );
    return this.getCitaById(id);
  }

  close() {
    this.db.close();
  }
}

let defaultInstance = null;

function getDatabase(dbPath = null) {
  if (dbPath === ':memory:') {
    const memoryDb = new DatabaseManager(':memory:');
    memoryDb.seedInitialData();
    return memoryDb;
  }
  if (!defaultInstance) {
    defaultInstance = new DatabaseManager(dbPath);
    defaultInstance.seedInitialData();
  }
  return defaultInstance;
}

module.exports = {
  DatabaseManager,
  getDatabase
};
