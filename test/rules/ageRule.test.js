/**
 * Suite de Pruebas de Caja Blanca - Regla 1: Validación de Edad (Pediátrica vs Adulta)
 * 
 * Topología CFG y Métricas de McCabe:
 * - Nodos de Predicado: P = 4 (edad inválida, esPediatrico, especialidad pediatría, tutor completo)
 * - Complejidad Ciclomática: V(G) = P + 1 = 5
 * - Cobertura de Ramas (Branch Coverage) = 100%
 */

const { validarReglaEdad } = require('../../src/rules/ageRule');

describe('Regla 1: Validación de Edad Pediátrica vs. Adulta (Caja Blanca McCabe V(G) = 5)', () => {
  // Camino 1: Edad inválida (Tipo no numérico, NaN o negativa)
  test('Camino 1: Entrada corrupta o negativa rechazada por cláusula de guardia', () => {
    const resString = validarReglaEdad({ edad: 'diez', especialidad: 'Pediatria' });
    expect(resString.esValido).toBe(false);
    expect(resString.tipoPaciente).toBe('DESCONOCIDO');
    expect(resString.motivo).toMatch(/número entero mayor o igual a 0/i);

    const resNegativa = validarReglaEdad({ edad: -5, especialidad: 'Pediatria' });
    expect(resNegativa.esValido).toBe(false);
  });

  // Camino 2: Paciente pediátrico (<18) intentando agendar con médico de adultos
  test('Camino 2: Paciente menor de 18 años con médico no pediatra es rechazado', () => {
    const res = validarReglaEdad({
      edad: 7,
      especialidad: 'Medicina Familiar',
      tutorNombre: 'Carlos Cadena',
      tutorTelefono: '0999999999'
    });

    expect(res.esValido).toBe(false);
    expect(res.tipoPaciente).toBe('PEDIATRICO');
    expect(res.motivo).toMatch(/exclusivamente por la especialidad de Pediatria/i);
  });

  // Camino 3: Paciente pediátrico (<18) con pediatra pero sin tutor legal completo
  test('Camino 3: Paciente menor de 18 años con pediatra sin tutor es rechazado', () => {
    // Caso 3a: Sin tutor
    const resSinTutor = validarReglaEdad({
      edad: 10,
      especialidad: 'Pediatria'
    });
    expect(resSinTutor.esValido).toBe(false);
    expect(resSinTutor.tipoPaciente).toBe('PEDIATRICO');
    expect(resSinTutor.motivo).toMatch(/tutor o representante legal/i);

    // Caso 3b: Tutor con nombre pero sin teléfono
    const resTutorIncompleto = validarReglaEdad({
      edad: 12,
      especialidad: 'Pediatria',
      tutorNombre: 'Ana Gómez',
      tutorTelefono: ''
    });
    expect(resTutorIncompleto.esValido).toBe(false);
    expect(resTutorIncompleto.tipoPaciente).toBe('PEDIATRICO');
  });

  // Camino 4: Paciente pediátrico (<18) con pediatra y tutor completo -> Válido
  test('Camino 4: Paciente menor de 18 años con pediatra y tutor completo es aceptado', () => {
    const res = validarReglaEdad({
      edad: 5,
      especialidad: 'Pediatria',
      tutorNombre: 'María Torres',
      tutorTelefono: '0987654321'
    });

    expect(res.esValido).toBe(true);
    expect(res.tipoPaciente).toBe('PEDIATRICO');
    expect(res.motivo).toBeUndefined();
  });

  // Camino 5: Paciente adulto (>=18) intentando agendar con pediatra -> Rechazado
  test('Camino 5: Paciente adulto (>= 18 años) intentando consultar en pediatría es rechazado', () => {
    const res = validarReglaEdad({
      edad: 25,
      especialidad: 'Pediatria'
    });

    expect(res.esValido).toBe(false);
    expect(res.tipoPaciente).toBe('ADULTO');
    expect(res.motivo).toMatch(/no pueden agendar consultas en la especialidad de Pediatria/i);
  });

  // Camino 6: Paciente adulto (>=18) con especialidad general o familiar -> Válido
  test('Camino 6: Paciente adulto con especialidad no pediátrica es aceptado', () => {
    const res = validarReglaEdad({
      edad: 18, // Caso límite frontera (18 años exactos)
      especialidad: 'Medicina Familiar'
    });

    expect(res.esValido).toBe(true);
    expect(res.tipoPaciente).toBe('ADULTO');
    expect(res.motivo).toBeUndefined();
  });
});
