/**
 * Punto de Entrada del Servidor
 */

const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏥 Sistema de Citas Médico Familiar & Auditoría QA`);
  console.log(`🚀 Servidor activo en: http://localhost:${PORT}`);
  console.log(`📊 Panel interactivo en: http://localhost:${PORT}`);
  console.log(`🔬 API de Auditoría: http://localhost:${PORT}/api/qa/audit`);
  console.log(`====================================================`);
});
