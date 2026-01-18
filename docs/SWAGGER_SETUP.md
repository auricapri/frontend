# Documentação Swagger/OpenAPI - Guia de Uso

## Visão Geral

A API do Auricapri possui documentação interativa completa usando Swagger/OpenAPI. Esta documentação permite testar endpoints diretamente no navegador e entender todos os recursos disponíveis da API.

## Acessando a Documentação

### Desenvolvimento Local

1. Inicie o servidor backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Acesse a documentação Swagger UI:
   ```
   http://localhost:3001/api-docs
   ```

3. Para obter o JSON OpenAPI:
   ```
   http://localhost:3001/api-docs.json
   ```

### Produção

Por padrão, o Swagger está desabilitado em produção por segurança. Para habilitar:

1. Defina a variável de ambiente:
   ```bash
   ENABLE_SWAGGER=true
   ```

2. Acesse:
   ```
   https://api.auricapri.com/api-docs
   ```

## Usando a Autenticação

A maioria dos endpoints requer autenticação via JWT Bearer Token. Para usar no Swagger UI:

### 1. Obter Token de Autenticação

1. Na interface Swagger, encontre o endpoint `/api/auth/signin`
2. Clique em "Try it out"
3. Preencha os dados:
   ```json
   {
     "email": "seu-email@example.com",
     "password": "sua-senha"
   }
   ```
4. Execute a requisição
5. Copie o `access_token` da resposta

### 2. Configurar Autenticação no Swagger

1. Clique no botão **"Authorize"** no topo da página Swagger
2. No campo `bearerAuth`, cole o token (sem a palavra "Bearer")
3. Clique em "Authorize"
4. Clique em "Close"

Agora todas as requisições autenticadas usarão este token automaticamente.

### 3. Testar Endpoints Autenticados

Após configurar a autenticação, você pode testar qualquer endpoint:

1. Expanda o endpoint desejado
2. Clique em "Try it out"
3. Preencha os parâmetros (se necessário)
4. Clique em "Execute"
5. Veja a resposta e o código de status

## Estrutura da Documentação

### Tags

Os endpoints estão organizados por tags:

- **Authentication**: Login, registro, reset de senha
- **Products**: Gerenciamento de produtos
- **Orders**: Pedidos e status
- **Cart**: Carrinho de compras
- **Users**: Perfis e endereços
- **Store**: Configurações da loja
- **Collections**: Coleções de produtos
- **Coupons**: Cupons de desconto
- **Wishlist**: Lista de desejos
- **Tracking**: Rastreamento de eventos
- **Weather**: Dados meteorológicos
- **Marketing**: Campanhas e tags

### Schemas

A documentação inclui schemas reutilizáveis:

- **Error**: Respostas de erro padronizadas
- **ValidationError**: Erros de validação
- **Pagination**: Paginação (quando aplicável)

## Testando Endpoints

### Exemplo: Listar Produtos

1. Expanda a seção **Products**
2. Clique em `GET /api/products`
3. Clique em "Try it out"
4. (Opcional) Adicione parâmetros de query:
   - `limit`: número de produtos (padrão: 20)
   - `offset`: paginação (padrão: 0)
5. Clique em "Execute"
6. Veja a resposta JSON com a lista de produtos

### Exemplo: Criar Pedido

1. **Primeiro, autentique-se** (veja seção acima)
2. Expanda a seção **Orders**
3. Clique em `POST /api/orders`
4. Clique em "Try it out"
5. Preencha o body com os dados do pedido:
   ```json
   {
     "items": [
       {
         "variant_id": "uuid-da-variante",
         "product_id": "uuid-do-produto",
         "quantity": 1,
         "price": 99.90
       }
     ],
     "addressData": {
       "street_address": "Rua Exemplo, 123",
       "city": "São Paulo",
       "state_province": "SP",
       "postal_code": "01234-567",
       "country_code": "BR"
     },
     "logisticsInfo": {
       "shipping_method": "standard",
       "estimated_days": 5
     },
     "paymentMethod": "credit_card",
     "subtotal": 99.90,
     "finalAmount": 99.90
   }
   ```
6. Clique em "Execute"
7. Veja a resposta com o pedido criado

## Exportando para Postman

1. Acesse `/api-docs.json` no navegador
2. Copie todo o conteúdo JSON
3. No Postman:
   - Clique em "Import"
   - Cole o JSON
   - Clique em "Import"
4. Todas as rotas serão importadas com autenticação configurada

## Gerando Clientes SDK

Com o OpenAPI spec, você pode gerar clientes SDK automaticamente:

### TypeScript/JavaScript

```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3001/api-docs.json \
  -g typescript-axios \
  -o ./generated-client
```

### Python

```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3001/api-docs.json \
  -g python \
  -o ./generated-client
```

### Outras Linguagens

Veja todas as opções em: https://openapi-generator.tech/docs/generators

## Troubleshooting

### Swagger UI não carrega

- Verifique se o servidor está rodando
- Verifique se a porta está correta (3001 por padrão)
- Verifique o console do navegador para erros

### Autenticação não funciona

- Certifique-se de copiar apenas o token (sem "Bearer")
- Verifique se o token não expirou
- Tente fazer login novamente e atualizar o token

### Endpoints retornam 401

- Configure a autenticação no botão "Authorize"
- Verifique se o token está válido
- Alguns endpoints requerem permissão de admin

### Endpoints retornam 403

- O endpoint requer permissão de admin
- Faça login com uma conta de administrador
- Verifique se o usuário tem a role correta

## Recursos Adicionais

- **OpenAPI 3.0 Specification**: https://swagger.io/specification/
- **Swagger UI Documentation**: https://swagger.io/tools/swagger-ui/
- **Postman Import**: Suporta OpenAPI 3.0 nativamente

## Notas Importantes

1. **Produção**: O Swagger está desabilitado por padrão em produção. Habilite apenas se necessário.
2. **Rate Limiting**: Alguns endpoints têm rate limiting. Se receber 429, aguarde alguns minutos.
3. **CORS**: Certifique-se de que o CORS está configurado corretamente se testar de outro domínio.
4. **Validação**: Todos os endpoints validam dados de entrada usando Zod. Erros de validação retornam 400 com detalhes.

## Suporte

Para dúvidas ou problemas:
- Verifique os logs do servidor
- Consulte a documentação de cada endpoint no Swagger UI
- Entre em contato com a equipe de desenvolvimento
