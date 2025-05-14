/**
 * OpenAPI Documentation Generator
 * 
 * This script generates OpenAPI documentation from our Zod schemas
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
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

// Document schemas
registry.registerComponent('schemas', 'Document', {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    updatedAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    filename: { type: 'string' },
    originalFilename: { type: 'string' },
    mimeType: { type: 'string' },
    fileSize: { type: 'string' },
    storageKey: { type: 'string' },
    checksum: { type: 'string' },
    documentType: { 
      type: 'string', 
      enum: ['CONTRACT', 'AGREEMENT', 'POLICY', 'REPORT', 'PRESENTATION', 'CORRESPONDENCE', 'INVOICE', 'OTHER'] 
    },
    isConfidential: { type: 'boolean' },
    tags: { 
      type: 'array',
      items: { type: 'string' },
      nullable: true
    },
    processingStatus: {
      type: 'string',
      enum: ['PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'ERROR'],
    },
    aiProcessed: { type: 'boolean' },
    aiMetadata: { 
      type: 'object',
      nullable: true
    },
    uploadedBy: { type: 'string', format: 'uuid' },
    tenantId: { type: 'string', format: 'uuid' },
    versionId: { type: 'string', format: 'uuid', nullable: true },
    customMetadata: { 
      type: 'object',
      nullable: true
    }
  },
  required: ['id', 'title', 'filename', 'originalFilename', 'mimeType', 'fileSize', 'storageKey', 'checksum']
});

// Contract schemas removed

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

// Document endpoints
registry.registerPath({
  method: 'get',
  path: '/api/documents',
  tags: ['Documents'],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'documentType',
      in: 'query',
      required: false,
      schema: { 
        type: 'string',
        enum: ['CONTRACT', 'AGREEMENT', 'POLICY', 'REPORT', 'PRESENTATION', 'CORRESPONDENCE', 'INVOICE', 'OTHER']
      },
    },
    {
      name: 'search',
      in: 'query',
      required: false,
      schema: { type: 'string' },
    },
    {
      name: 'limit',
      in: 'query',
      required: false,
      schema: { type: 'integer', default: 20 },
    },
    {
      name: 'offset',
      in: 'query',
      required: false,
      schema: { type: 'integer', default: 0 },
    },
    {
      name: 'sortBy',
      in: 'query',
      required: false,
      schema: { type: 'string', default: 'createdAt' },
    },
    {
      name: 'sortOrder',
      in: 'query',
      required: false,
      schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
    },
  ],
  responses: {
    '200': {
      description: 'List of documents',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/Document' },
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/documents',
  tags: ['Documents'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'Document file to upload',
            },
            title: { 
              type: 'string',
              description: 'Document title'
            },
            description: {
              type: 'string',
              description: 'Document description'
            },
            documentType: {
              type: 'string',
              enum: ['CONTRACT', 'AGREEMENT', 'POLICY', 'REPORT', 'PRESENTATION', 'CORRESPONDENCE', 'INVOICE', 'OTHER'],
              description: 'Type of document'
            },
            isConfidential: {
              type: 'boolean',
              description: 'Whether the document contains confidential information'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorizing the document'
            }
          },
          required: ['file', 'title'],
        },
      },
    },
  },
  responses: {
    '201': {
      description: 'Document uploaded successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { $ref: '#/components/schemas/Document' },
            },
          },
        },
      },
    },
    '400': {
      description: 'Invalid request or file upload error',
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

registry.registerPath({
  method: 'get',
  path: '/api/documents/{id}',
  tags: ['Documents'],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    },
  ],
  responses: {
    '200': {
      description: 'Document details',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { $ref: '#/components/schemas/Document' },
            },
          },
        },
      },
    },
    '404': {
      description: 'Document not found',
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

// Contract endpoints removed

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
  paths: {},  // Use empty object instead of registry.paths
  components: {
    schemas: {},
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
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

// Write OpenAPI schema to file (prepare file path)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = resolve(__dirname, '../../docs/openapi.json');

// Write schema to file
try {
  writeFileSync(outputPath, JSON.stringify(openApiSchema, null, 2));
  console.log(`OpenAPI schema generated at: ${outputPath}`);
} catch (error) {
  console.error('Error writing OpenAPI schema:', error);
}

// Export for use in Express
export default openApiSchema;