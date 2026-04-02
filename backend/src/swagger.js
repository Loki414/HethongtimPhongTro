const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DACK API',
      version: '1.0.0',
      description: 'REST API for finding rental rooms',
    },
    servers: [{ url: process.env.SWAGGER_SERVER_URL || 'http://localhost:4000' }],
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
  apis: [],
};

// NOTE: For production, you can auto-generate from route JSDoc.
// Here we keep a minimal spec and extend as needed.
const spec = swaggerJSDoc(options);

spec.paths = {
  '/api/health': {
    get: {
      summary: 'Health check',
      responses: { 200: { description: 'OK' } },
    },
  },
  '/api/auth/register': {
    post: {
      summary: 'Register',
      responses: { 201: { description: 'Registered' } },
    },
  },
  '/api/auth/login': {
    post: {
      summary: 'Login',
      responses: { 200: { description: 'Logged in' } },
    },
  },
  '/api/rooms': {
    get: {
      summary: 'List/search rooms',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
        { name: 'minPrice', in: 'query', schema: { type: 'number' } },
        { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
        { name: 'locationId', in: 'query', schema: { type: 'string' } },
        { name: 'categoryId', in: 'query', schema: { type: 'string' } },
        { name: 'amenityIds', in: 'query', schema: { type: 'string' } },
        { name: 'q', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'OK' } },
    },
    post: {
      summary: 'Create room (user/admin)',
      security: [{ bearerAuth: [] }],
      responses: { 201: { description: 'Room created' } },
    },
  },
  '/api/rooms/{roomId}': {
    get: {
      summary: 'Get room by id',
      responses: { 200: { description: 'OK' } },
    },
    put: {
      summary: 'Update room',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Updated' } },
    },
    delete: {
      summary: 'Delete room',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Deleted' } },
    },
  },
  '/api/rooms/{roomId}/images': {
    post: {
      summary: 'Upload room images',
      security: [{ bearerAuth: [] }],
      responses: { 201: { description: 'Images uploaded' } },
    },
  },
};

module.exports = { spec };

