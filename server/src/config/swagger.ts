import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CampusFlow REST API',
      version: '1.0.0',
      description:
        'Official API documentation for CampusFlow – Smart Student OD & Leave Management System with Automatic Attendance Integration.',
      contact: {
        name: 'CampusFlow API Team',
        email: 'api@campusflow.edu',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local Development Server',
      },
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
