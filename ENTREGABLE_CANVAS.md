# TALLER AUTÓNOMO: AUDITORÍA DE IA CON McCABE Y COBERTURA DE CÓDIGO
**Asignatura:** Pruebas, Control de Calidad y Mantenimiento de Software  
**Semestre / Período:** 7mo Semestre | Auditoría de Caja Blanca  
**Fecha:** Octubre 2026  
**Repositorio GitHub:** [https://github.com/danielbazx/mccabe-y-cobertura-de-codigo](https://github.com/danielbazx/mccabe-y-cobertura-de-codigo)  

---

## 👥 PORTADA Y ROLES TÁCTICOS DEL EQUIPO

| Integrante | Rol Táctico Asignado | Responsabilidades en la Actividad |
| :--- | :--- | :--- |
| **Daniel Cadena** | **Git Lead & Arquitecto Backend** | Configuración de arquitectura Node.js/Express, persistencia SQLite nativa, gestión del repositorio Git y orquestación del entregable. |
| **Gonzalo Cárdenas** | **Auditor Topológico de McCabe** | Extracción de Grafos de Flujo de Control (CFG), cálculo formal de complejidad ciclomática $V(G) = P + 1 = E - N + 2$ y verificación del límite $V(G) \le 10$. |
| **Gabriel Vásquez** | **Ingeniero de Automatización QA** | Diseño de pruebas unitarias en Jest bajo el modelo PIE, erradicación de tests zombis y garantía de Cobertura de Ramas al 100%. |

---

## 📌 RESUMEN EJECUTIVO

El presente taller implementa y audita un **Sistema de Citas para Médico Familiar** bajo el paradigma de **Pruebas Estructurales de Caja Blanca (IEEE/ISTQB)** aplicadas a código generado por Inteligencia Artificial.

Frente al fenómeno del *"Desarrollador Copiador"* (que confía ciegamente en el primer output de la IA y en coberturas superficiales de sentencias), el equipo actuó bajo el rol de **Ingeniero QA Auditor**:
1. Se extrajeron los **Grafos de Flujo de Control (CFG)** para las 4 reglas de negocio críticas del sistema.
2. Se determinó matemáticamente el límite innegociable de caminos linealmente independientes mediante la **Complejidad Ciclomática de McCabe ($V(G)$)**.
3. Se garantizó el **100% de Cobertura de Ramas (*Branch Coverage*)** en Jest a través de 39 pruebas sin zonas ciegas.
4. Se erradicaron los "tests zombis" implementando oráculos estrictos basados en el **Modelo PIE (Execution, Infection, Detection)**.

---

## 📐 MATRIZ TOPOLÓGICA Y MÉTRICAS DE McCABE

| Regla de Negocio | Función Auditada | Nodos ($N$) | Aristas ($E$) | Predicados ($P$) | $V(G) = P + 1$ | $V(G) = E - N + 2$ | Límite ($V(G) \le 10$) | Caminos Básicos |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Regla 1: Edad Pediátrica vs Adulta** | `validarReglaEdad` | 7 | 10 | 4 | **5** | **5** | ✅ Aprobado | 6 |
| **Regla 2: Restricción de Horarios** | `validarRestriccionHorario` | 9 | 14 | 6 | **7** | **7** | ✅ Aprobado | 7 |
| **Regla 3: Choque de Citas** | `validarChoqueDeCitas` | 6 | 8 | 3 | **4** | **4** | ✅ Aprobado | 4 |
| **Regla 4: Penalización Tardía (< 24h)** | `evaluarPenalizacionCancelacion` | 5 | 6 | 2 | **3** | **3** | ✅ Aprobado | 3 |

*Todas las funciones cumplen con la política de refactorización guiada ($V(G) \le 10$), asegurando alta modularidad y mantenibilidad.*

---

## 🎯 CASO DE ESTUDIO (DIAPOSITIVA 8): PENALIZACIÓN TARDÍA

### Lógica Condicional Auditada
```javascript
if (cancelacionTardia && !esEmergencia) {
    aplicarPenalizacion();
}
```

### Derivación Matemática de los 3 Caminos Independientes ($V(G) = 3$)
1. **Camino 1 (`cancelacionTardia = False`):** Cancelación con $\ge$ 24 horas de antelación $\rightarrow$ Estado: `CANCELADA_A_TIEMPO`, Cargo: `$0.00`, Penalización: `false`.
2. **Camino 2 (`cancelacionTardia = True` $\land$ `esEmergencia = True`):** Cancelación tardía justificada por emergencia $\rightarrow$ Estado: `CANCELADA_EXONERADA`, Cargo: `$0.00`, Penalización: `false`.
3. **Camino 3 (`cancelacionTardia = True` $\land$ `esEmergencia = False`):** Cancelación tardía no justificada $\rightarrow$ Estado: `CANCELADA_CON_PENALIZACION`, Cargo: `$15.00`, Penalización: `true`.

---

## 🧪 EVIDENCIA DE COBERTURA DE CÓDIGO (JEST)

```text
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

## 💡 RESPUESTAS AL CUESTIONARIO DE AUDITORÍA (DIAPOSITIVA 12)

1. **¿Conozco el número exacto de caminos lógicos $V(G)$ antes de leer los tests generados por la IA?**  
   **Sí.** Mediante la fórmula $V(G) = P + 1$ calculamos los caminos antes de redactar pruebas. Para la penalización tardía sabemos con rigor matemático que se requieren exactamente 3 pruebas.
2. **¿El 100% de cobertura que reporta la herramienta incluye aserciones (oráculos) fuertes?**  
   **Sí.** Se erradicó el "falso 100%" (tests zombis) mediante aserciones estrictas sobre estados finales, cargos tarifarios y flags booleanas.
3. **¿Están evaluadas todas las condiciones lógicas, o solo las líneas de código superficiales?**  
   **Sí.** Se logró 100% de Cobertura de Ramas (*Branch Coverage*), garantizando la evaluación de combinaciones y cortocircuitos booleanos.
4. **¿He forzado intencionalmente fallos (mutaciones) para verificar si los tests de la IA los detectan?**  
   **Sí.** Se probaron mutaciones lógicas y datos corruptos, comprobando que los oráculos fallan de inmediato si se altera una regla de negocio.
5. **¿Es la complejidad del código generado tan alta que la acción correcta es refactorizar en lugar de testear?**  
   **No.** La complejidad ciclomática de todas las funciones es $V(G) \le 7$, manteniéndose dentro del estándar de excelencia ($V(G) \le 10$).
