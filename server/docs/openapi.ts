/**
 * OpenAPI Documentation Generator
 * 
 * This script generates OpenAPI documentation from our Zod schemas
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import * as schema from '../../shared/schema';

// Create a registry for our API schema
const registry = new OpenAPIRegistry();

// Register user schemas
registry.registerComponent('schemas', 'User', {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    username: { type: 'string' },
    email: { type: 'string' },
    firstName: { type: 'string', nullable: true },
    lastName: { type: 'string', nullable: true },
    role: { type: 'string', enum: ['user', 'manager', 'admin', 'superadmin'] },
    active: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'username', 'email', 'role', 'active']
});

registry.registerComponent('schemas', 'Employee', {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    position: { type: 'string' },
    department: { type: 'string' },
    location: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string', nullable: true },
    avatarUrl: { type: 'string', nullable: true },
    bio: { type: 'string', nullable: true },
    responsibilities: { type: 'string', nullable: true },
    status: { type: 'string', enum: ['active', 'inactive', 'onleave'] },
    updatedAt: { type: 'string', format: 'date-time' },
    syncedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'position', 'department', 'email', 'status']
});

// Define authentication component
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT Bearer token authentication',
});

// Define API paths
registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              username: { type: 'string' },
              password: { type: 'string' },
            },
            required: ['username', 'password'],
          },
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'User logged in successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  user: { $ref: '#/components/schemas/User' },
                  token: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    '401': {
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              errors: { type: 'object' },
            },
          },
        },
      },
    },
  },
});

// Register employee endpoints
registry.registerPath({
  method: 'get',
  path: '/api/employees',
  tags: ['Employees'],
  security: [{ bearerAuth: [] }],
  responses: {
    '200': {
      description: 'List of employees',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/Employee' },
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/employees/{id}',
  tags: ['Employees'],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'integer' },
    },
  ],
  responses: {
    '200': {
      description: 'Employee details',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { $ref: '#/components/schemas/Employee' },
            },
          },
        },
      },
    },
    '404': {
      description: 'Employee not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
});

// Generate OpenAPI schema
const openApiSchema = {
  openapi: '3.0.0',
  info: {
    title: 'BlueEarth Capital Portal API',
    version: '1.0.0',
    description: 'API for BlueEarth Capital employee portal',
    contact: {
      name: 'BlueEarth Capital',
      email: 'support@blueearth.capital',
    },
  },
  paths: registry.paths,
  components: registry.components,
  security: [{ bearerAuth: [] }],
  servers: [
    {
      url: 'https://{server}/api',
      variables: {
        server: {
          default: 'localhost:3000',
          description: 'API server',
        },
      },
    },
  ],
};

// Write OpenAPI schema to file
const outputPath = resolve(__dirname, '../../docs/openapi.json');
writeFileSync(outputPath, JSON.stringify(openApiSchema, null, 2));

console.log(`OpenAPI schema generated at: ${outputPath}`);

// Export for use in Express
export default openApiSchema;