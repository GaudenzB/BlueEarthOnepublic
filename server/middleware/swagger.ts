import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import openApiSchema from '../docs/openapi';

/**
 * Configure Swagger UI middleware for API documentation
 * 
 * @param app Express application instance
 */
export function setupSwaggerDocs(app: Express): void {
  // Use the generated OpenAPI schema for Swagger UI
  const options = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
  };

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSchema, options));

  // Also serve the raw OpenAPI JSON at a well-known endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiSchema);
  });

  // Serve OpenAPI definition file from docs directory
  app.get('/openapi.json', (req, res) => {
    try {
      const openApiPath = resolve(__dirname, '../../docs/openapi.json');
      const openApiJson = readFileSync(openApiPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.send(openApiJson);
    } catch (err) {
      res.status(404).send({ error: 'OpenAPI definition not found' });
    }
  });
}