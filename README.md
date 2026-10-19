# Sistema de Citas de Médico Familiar & Auditoría QA con McCabe y Cobertura de Ramas

> **Materia:** Pruebas, Control de Calidad y Mantenimiento de Software (7mo Semestre)  
> **Autor:** Daniel Cadena  
> **Stack:** Node.js (Express), SQLite (`node:sqlite`), Alpine.js, Tailwind CSS, Jest

---

## 📌 Descripción del Proyecto

Aplicación web para la gestión y agendamiento de citas médicas familiares diseñada bajo el **Framework de QA Aumentado (Pruebas de Caja Blanca en la Era de la IA)**.

El sistema implementa 4 reglas de negocio críticas auditadas mediante:
1. **Modelado Topológico con Grafos de Flujo de Control (CFG)**.
2. **Cálculo de la Complejidad Ciclomática de McCabe ($V(G)$)** para determinar matemáticamente el conjunto de caminos linealmente independientes (*Basis Path Testing*).
3. **100% de Cobertura de Ramas (*Branch Coverage*)** en Jest.
4. **Erradicación de "Tests Zombis" mediante el Modelo PIE (Execution, Infection, Detection)** con oráculos de aserción estrictos.

---

## 🏥 Las 4 Reglas de Negocio Auditadas

1. **Regla de Edad (Pediátrico vs. Adulto):**
   - Menores de 18 años deben ser atendidos obligatoriamente por un especialista en **Pediatría** y contar con un tutor legal registrado (nombre y teléfono).
   - Adultos ($\ge$ 18 años) no pueden agendar con Pediatría (deben ser derivados a Medicina Familiar o General).
   - **Complejidad:** $V(G) = P + 1 = 4 + 1 = 5$ caminos independientes.

2. **Restricción de Horarios (Franjas No Operativas):**
   - Solo se atiende en días hábiles (Lunes a Viernes).
   - Rango operativo: 08:00 a 17:00.
   - Bloqueo de franja de receso/almuerzo médico: 13:00 a 14:00.
   - Bloques modulares de 30 minutos (:00 o :30). Bloqueo de fechas pasadas.
   - **Complejidad:** $V(G) = P + 1 = 6 + 1 = 7$ caminos independientes.

3. **Choque de Citas (Prevención de Doble Reserva):**
   - Impide que un mismo médico tenga citas duplicadas en el mismo horario.
   - Impide que un mismo paciente tenga dos citas simultáneas con diferentes médicos.
   - **Complejidad:** $V(G) = P + 1 = 3 + 1 = 4$ caminos independientes.

4. **Penalización Tardía (< 24h) y Exoneración por Emergencia (Caso Slide 8):**
   - Lógica: `if (cancelacionTardia && !esEmergencia) { aplicarPenalizacion(); }`
   - Si se cancela con $\ge$ 24 horas de antelación $\rightarrow$ Cancelación oportuna sin penalización (`CANCELADA_A_TIEMPO`, $0).
   - Si se cancela con $<$ 24 horas pero con causa de emergencia médica $\rightarrow$ Exonerado (`CANCELADA_EXONERADA`, $0).
   - Si se cancela con $<$ 24 horas sin causa de emergencia $\rightarrow$ Aplica penalización estricta (`CANCELADA_CON_PENALIZACION`, $15.00).
   - **Complejidad:** $V(G) = P + 1 = 2 + 1 = 3$ caminos independientes.

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js versión 20 o superior (recomendado Node.js 22 LTS).
- Gestor de paquetes `npm`.

### Pasos de Instalación
```bash
# Clonar o ubicarse en el directorio del repositorio
cd "McCabe Y cobertura de código"

# Instalar dependencias
npm install
```

### Ejecutar el Servidor
```bash
npm start
```
Abrir el navegador en: **`http://localhost:3000`**

---

## 🧪 Ejecución de Pruebas de Calidad (Jest & Cobertura)

### Correr Suite Completa con Cobertura
```bash
npm test
```

### Correr Pruebas con Detalle Verbose
```bash
npm run test:verbose
```

### Ejecutar Script de Auditoría de Métricas McCabe
```bash
npm run audit:metrics
```

---

## 📊 Resultados de Cobertura de Código

```
----------------------------|---------|----------|---------|---------|-------------------
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------------------|---------|----------|---------|---------|-------------------
All files                   |     100 |      100 |     100 |     100 |                   
 ageRule.js                 |     100 |      100 |     100 |     100 |                   
 appointmentValidator.js    |     100 |      100 |     100 |     100 |                   
 cancellationPenaltyRule.js |     100 |      100 |     100 |     100 |                   
 conflictRule.js            |     100 |      100 |     100 |     100 |                   
 scheduleRule.js            |     100 |      100 |     100 |     100 |                   
----------------------------|---------|----------|---------|---------|-------------------

Test Suites: 6 passed, 6 total
Tests:       39 passed, 39 total
```

---

## 📂 Estructura del Proyecto

```
├── .gitignore                      # Exclusiones de Git (node_modules, coverage, db)
├── AUDITORIA_QA_MCCABE.md          # Informe técnico exhaustivo de Auditoría de Caja Blanca
├── README.md                       # Documentación general del repositorio
├── package.json                    # Scripts y dependencias del proyecto
├── public/
│   └── index.html                  # Interfaz reactiva en Alpine.js con panel de QA
├── scripts/
│   └── calculate_mccabe.js         # Script evaluador de topología y fórmulas de McCabe
├── src/
│   ├── app.js                      # Configuración de Express y endpoints API REST
│   ├── server.js                   # Entrypoint del servidor
│   ├── db/
│   │   └── database.js             # Persistencia SQLite con semillas de datos
│   └── rules/
│       ├── ageRule.js              # Regla 1: Edad Pediátrica vs Adulta (V(G) = 5)
│       ├── scheduleRule.js         # Regla 2: Restricción Horaria (V(G) = 7)
│       ├── conflictRule.js         # Regla 3: Choque de Citas (V(G) = 4)
│       ├── cancellationPenaltyRule.js # Regla 4: Penalización Tardía (V(G) = 3)
│       └── appointmentValidator.js # Orquestador modular de validación
└── test/
    ├── api/
    │   └── appointments.api.test.js # Pruebas de integración de endpoints
    └── rules/
        ├── ageRule.test.js
        ├── scheduleRule.test.js
        ├── conflictRule.test.js
        ├── cancellationPenaltyRule.test.js
        └── appointmentValidator.test.js
```

---

## 📑 Informe de Auditoría
Para consultar el desglose matemático de cada regla, los diagramas de flujo de control (CFG) y las respuestas al Cuestionario Metacognitivo de la Diapositiva 12, consulte el archivo [AUDITORIA_QA_MCCABE.md](AUDITORIA_QA_MCCABE.md).
