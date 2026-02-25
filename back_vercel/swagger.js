const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
info: {
  title: 'Vasoli Proyect - API Multi-tenant',
  version: '1.0.0',
  description: 'Documentación oficial de la API para optimización de rutas y gestión de empresas. Gestión de Cuotas y Planes: Esta API implementa un sistema dinámico de límites basado en el plan contratado por la empresa (company). Los límites se aplican principalmente en: Usuarios: Cantidad máxima de cuentas activas. Solicitudes: Volumen de respuestas mensuales. Archivados: Capacidad de almacenamiento histórico. Si una petición devuelve un código HTTP 403 (Forbidden) con el mensaje "Límite de plan alcanzado", el administrador deberá contactar a soporte para un upgrade de cuota.',
}, 
    servers: [
      {
        url: 'http://localhost:3000/{company}',
        description: 'Servidor Local (Multi-tenant)',
        variables: {
          company: {
            default: 'api',
            description: 'Nombre de la empresa o tenant (ej: api, solunex, infodesa)'
          }
        }
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Importante: apunta a la carpeta donde tienes tus archivos de rutas
  apis: ['./endpoints/*.js', './index.js'], 
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;