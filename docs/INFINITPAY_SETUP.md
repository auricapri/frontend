# Configuração do Módulo InfinitPay

Este documento descreve como configurar e usar o módulo de checkout com InfinitPay.

## Visão Geral

O módulo InfinitPay substitui apenas a etapa de pagamento do checkout, mantendo a etapa de endereço original. O módulo é facilmente removível caso não atenda às expectativas.

A InfinitPay utiliza apenas a **handle** (InfiniteTag) para identificação, sem necessidade de API keys ou autenticação Bearer.

## Arquitetura

- **Backend**: Serviço e rotas para integração com API do InfinitPay
- **Frontend**: Componente `CheckoutViewInfinitPay` que substitui o step 2 do checkout
- **Webhook**: Endpoint para receber notificações de status de pagamento

## Configuração

### 1. Variáveis de Ambiente

Adicione a seguinte variável no arquivo `.env` do backend:

```env
# InfinitPay Configuration
INFINITPAY_HANDLE=seu-handle-sem-o-simbolo-dolar
```

**Variável:**
- `INFINITPAY_HANDLE`: Sua InfiniteTag (nome de usuário no App InfinitePay) **sem o símbolo $ do início**

**Exemplo:** Se sua InfiniteTag é `$minhaloja`, use apenas `minhaloja`

### 2. Ativar o Módulo no Frontend

Adicione a seguinte variável no arquivo `.env` do frontend (ou `vite.config.ts`):

```env
VITE_USE_INFINITPAY_CHECKOUT=true
```

Para desativar, remova a variável ou defina como `false`.

### 3. Webhook (Opcional)

O webhook é configurado automaticamente através do campo `webhook_url` no payload da requisição. Não é necessário configurar no painel do InfinitPay.

A URL do webhook será:
- **Desenvolvimento**: `http://localhost:3001/api/infinitpay/webhook` (use ngrok para tornar acessível publicamente)
- **Produção**: `https://seu-dominio.com/api/infinitpay/webhook`

O webhook será chamado automaticamente quando o pagamento for aprovado.

## Fluxo de Pagamento

1. **Etapa 1 - Endereço**: Usuário preenche endereço (mantido do checkout original)
2. **Etapa 2 - Pagamento**: 
   - Sistema cria ordem com status `pending`
   - Gera link de pagamento via API InfinitPay
   - Redireciona usuário automaticamente para checkout do InfinitPay
3. **Etapa 3 - Confirmação**: 
   - Usuário retorna do InfinitPay via `redirect_url`
   - Webhook atualiza status da ordem automaticamente
   - Sistema exibe confirmação

## Endpoints da API

### POST `/api/infinitpay/create-link`

Cria um link de pagamento. Requer autenticação.

**Request:**
```json
{
  "amount": 100.00,
  "description": "Pedido 3 itens",
  "customer": {
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+5511999999999"
  },
  "items": [
    {
      "variant_id": "uuid",
      "product_id": "uuid",
      "name": "Produto",
      "price": 100.00,
      "quantity": 1
    }
  ],
  "addressData": {
    "logradouro": "Rua das Flores",
    "bairro": "Centro",
    "localidade": "São Paulo",
    "uf": "SP",
    "cep": "12345678",
    "numero": "123",
    "complemento": "Apto 45"
  },
  "logisticsInfo": {...},
  "subtotal": 95.00
}
```

**Response:**
```json
{
  "order_id": "uuid-da-ordem",
  "checkout_url": "https://checkout.infinitepay.io/...",
  "invoice_slug": "codigo-da-fatura"
}
```

### POST `/api/infinitpay/webhook`

Recebe notificações do InfinitPay quando o pagamento é aprovado. Endpoint público.

**Payload recebido:**
```json
{
  "invoice_slug": "abc123",
  "amount": 1000,
  "paid_amount": 1010,
  "installments": 1,
  "capture_method": "credit_card",
  "transaction_nsu": "UUID",
  "order_nsu": "UUID-do-pedido",
  "receipt_url": "https://comprovante.com/123",
  "items": [...]
}
```

**Resposta esperada:**
- `200 OK` - Webhook processado com sucesso
- `400 Bad Request` - Erro no processamento (InfinitPay tentará reenviar)

### POST `/api/infinitpay/payment-check`

Consulta status de um pagamento. Requer autenticação.

**Request:**
```json
{
  "order_nsu": "123456",
  "transaction_nsu": "UUID-que-recebeu",
  "slug": "codigo-da-fatura"
}
```

**Response:**
```json
{
  "success": true,
  "paid": true,
  "amount": 1500,
  "paid_amount": 1510,
  "installments": 1,
  "capture_method": "pix"
}
```

## Estrutura de Arquivos

```
backend/src/
  ├── services/
  │   └── infinitpay.service.ts       # Serviço de integração
  ├── api/routes/
  │   └── infinitpay.routes.ts       # Rotas da API
  └── config/
      └── env.ts                      # Configuração de ambiente

auricapri/src/
  ├── components/checkout/
  │   ├── CheckoutViewInfinitPay.tsx  # Wrapper do checkout
  │   └── PaymentFormInfinitPay.tsx   # Componente de pagamento
  └── api/
      └── infinitpay.api.ts           # Cliente API do frontend
```

## Remoção do Módulo

Para remover o módulo completamente:

1. **Frontend**: Remova ou defina `VITE_USE_INFINITPAY_CHECKOUT=false`
2. **Backend**: Remova as rotas em `server.ts`:
   ```typescript
   // Remover esta linha:
   app.use('/api/infinitpay', infinitpayRoutes);
   ```
3. **Deletar arquivos**:
   - `backend/src/services/infinitpay.service.ts`
   - `backend/src/api/routes/infinitpay.routes.ts`
   - `auricapri/src/components/checkout/CheckoutViewInfinitPay.tsx`
   - `auricapri/src/components/checkout/PaymentFormInfinitPay.tsx`
   - `auricapri/src/api/infinitpay.api.ts`
4. **Remover variáveis de ambiente** do `.env`
5. **Limpar imports** em `App.tsx` e `index.ts`

## Troubleshooting

### Erro: "InfinitPay handle not configured"

Verifique se a variável `INFINITPAY_HANDLE` está configurada corretamente no backend. Lembre-se de usar apenas o handle **sem o símbolo $**.

### Webhook não está sendo recebido

1. Verifique se a URL do webhook está correta no payload enviado (campo `webhook_url`)
2. Para desenvolvimento local, use ngrok ou similar para tornar o servidor acessível publicamente
3. Verifique os logs do servidor para erros
4. O webhook deve responder com `200 OK` para ser considerado processado
5. O webhook é configurado automaticamente via payload, não é necessário configurar no painel

### Link de pagamento não é criado

1. Verifique se o usuário está autenticado
2. Verifique se todos os campos obrigatórios estão sendo enviados (especialmente `items` com pelo menos 1 item)
3. Verifique os logs do backend para detalhes do erro
4. Verifique se a handle está correta (sem o símbolo $)

### Status da ordem não atualiza

1. Verifique se o `webhook_url` está sendo enviado corretamente no payload
2. Verifique os logs do webhook no backend
3. O webhook é chamado automaticamente quando o pagamento é aprovado
4. Você pode consultar o status manualmente usando o endpoint `/payment-check`
5. Para desenvolvimento, certifique-se de que o servidor está acessível publicamente (use ngrok)

### Redirecionamento não funciona

1. Verifique se a `redirect_url` está configurada corretamente
2. Após o pagamento, o usuário será redirecionado com parâmetros na URL:
   - `payment_status=return`
   - `order_id=uuid-da-ordem`
   - `receipt_url`, `order_nsu`, `slug`, `capture_method`, `transaction_nsu`

## Notas Importantes

- O módulo cria ordens com status `pending` antes de gerar o link
- O status da ordem é atualizado automaticamente via webhook quando o pagamento é aprovado
- Se o webhook não chegar, a ordem permanece como `pending`
- O usuário pode ser redirecionado de volta mesmo sem confirmação do webhook
- Recomenda-se implementar verificação periódica de status para ordens pendentes usando `/payment-check`
- Os valores devem ser enviados em **centavos** (R$ 10,00 = 1000 centavos)
- O campo `itens` (com "e") é obrigatório e deve ter pelo menos 1 item
- A handle é obrigatória e identifica sua conta no InfinitPay

## Suporte

Para questões sobre a API do InfinitPay, consulte a documentação oficial:
- [Documentação InfinitPay](https://www.infinitepay.io/docs)
