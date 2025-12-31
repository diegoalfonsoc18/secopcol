// jest.setup.js
// Configuración mínima para tests

// Silenciar warnings
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});
