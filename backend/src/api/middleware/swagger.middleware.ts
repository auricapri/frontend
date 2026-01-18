import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { Express, Request, Response } from 'express';
import swaggerDefinition from '../../config/swagger.js';
import { env } from '../../config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../../**/*.ts'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Auricapri API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    })
  );

  // OpenAPI JSON
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export { swaggerSpec };
