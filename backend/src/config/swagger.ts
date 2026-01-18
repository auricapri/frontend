import { env } from './env.js';
import { getVersion } from './version.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Auricapri API',
    version: getVersion(),
    description: 'API RESTful para o e-commerce Auricapri. Documentação completa de todos os endpoints disponíveis.',
    contact: {
      name: 'Auricapri Support',
      email: 'support@auricapri.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.server.port}`,
      description: 'Servidor de Desenvolvimento',
    },
    {
      url: env.cors.frontendUrl.replace('3000', String(env.server.port)),
      description: 'Servidor Local (via Frontend URL)',
    },
    {
      url: 'https://api.auricapri.com',
      description: 'Servidor de Produção',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido através do endpoint /api/auth/signin',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Mensagem de erro descritiva',
              },
              code: {
                type: 'string',
                description: 'Código de erro (opcional)',
              },
            },
            required: ['message'],
          },
        },
        required: ['error'],
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
              issues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    path: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                    message: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
          },
          total: {
            type: 'integer',
            minimum: 0,
          },
          totalPages: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'object',
            description: 'Nome do produto em múltiplos idiomas',
          },
          slug: {
            type: 'object',
            description: 'Slug do produto em múltiplos idiomas',
          },
          description: {
            type: 'object',
            description: 'Descrição do produto',
          },
          is_active: {
            type: 'boolean',
          },
          variants: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          user_id: {
            type: 'string',
            format: 'uuid',
          },
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
          total_amount: {
            type: 'number',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
          subtotal: {
            type: 'number',
          },
          total: {
            type: 'number',
          },
          appliedCoupon: {
            type: 'object',
            nullable: true,
          },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          full_name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          phone: {
            type: 'string',
          },
          role: {
            type: 'string',
            enum: ['customer', 'admin', 'editor', 'affiliate', 'delivery'],
          },
          default_address: {
            type: 'object',
            nullable: true,
          },
          saved_cards: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'Endpoints de autenticação e autorização',
    },
    {
      name: 'Products',
      description: 'Gerenciamento de produtos e variantes',
    },
    {
      name: 'Orders',
      description: 'Gerenciamento de pedidos',
    },
    {
      name: 'Cart',
      description: 'Gerenciamento do carrinho de compras',
    },
    {
      name: 'Users',
      description: 'Gerenciamento de usuários e perfis',
    },
    {
      name: 'Store',
      description: 'Configurações e informações da loja',
    },
    {
      name: 'Collections',
      description: 'Gerenciamento de coleções',
    },
    {
      name: 'Coupons',
      description: 'Gerenciamento de cupons de desconto',
    },
    {
      name: 'Wishlist',
      description: 'Gerenciamento de lista de desejos',
    },
    {
      name: 'Tracking',
      description: 'Rastreamento de eventos e analytics',
    },
    {
      name: 'Weather',
      description: 'Dados meteorológicos para personalização',
    },
    {
      name: 'Marketing',
      description: 'Endpoints de marketing e campanhas',
    },
    {
      name: 'Delivery',
      description: 'Gerenciamento de entregas',
    },
    {
      name: 'Reviews',
      description: 'Avaliações de produtos',
    },
  ],
};

export default swaggerDefinition;
