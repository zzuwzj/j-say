export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  sessionMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(','),
  importLimit: parseInt(process.env.IMPORT_LIMIT || '5000', 10),
};