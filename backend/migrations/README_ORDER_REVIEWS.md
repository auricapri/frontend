# Migração: Sistema de Avaliações de Pedidos

## Aplicar Migração do Banco de Dados

Execute o SQL em `create_order_reviews.sql` no seu banco Supabase:

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Execute o conteúdo do arquivo `create_order_reviews.sql`

## Configurar Storage Bucket

Crie um bucket no Supabase Storage chamado `order-reviews`:

1. Acesse Storage no Supabase Dashboard
2. Crie um novo bucket chamado `order-reviews`
3. Configure as políticas de acesso:
   - **Public**: false (recomendado para privacidade)
   - **File size limit**: 10MB
   - **Allowed MIME types**: image/*, video/*

### Políticas RLS (Row Level Security)

As políticas RLS devem ser configuradas nas tabelas:

```sql
-- Permitir leitura pública de reviews
CREATE POLICY "Public read access" ON order_reviews
  FOR SELECT USING (true);

-- Permitir usuários autenticados criarem suas próprias reviews
CREATE POLICY "Users can create own reviews" ON order_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir usuários editarem suas próprias reviews
CREATE POLICY "Users can update own reviews" ON order_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas similares para order_review_media e order_review_helpful
```

## Instalar Dependências

No backend, as dependências já foram adicionadas ao `package.json`. Execute:

```bash
cd backend
npm install
```

## Funcionalidades Implementadas

✅ Avaliação de pedidos concluídos
✅ Edição de avaliações
✅ Upload de múltiplas fotos/vídeos (até 20 arquivos, 10MB cada, 50MB total)
✅ Sistema de "É útil" (helpful)
✅ Interface similar à imagem de referência
✅ Limitações de tamanho de arquivo para não estourar o banco

## Endpoints da API

- `GET /api/order-reviews/order/:orderId` - Listar reviews de um pedido
- `GET /api/order-reviews/user` - Listar reviews do usuário atual
- `POST /api/order-reviews` - Criar review (multipart/form-data)
- `PUT /api/order-reviews/:id` - Editar review (multipart/form-data)
- `POST /api/order-reviews/:id/helpful` - Marcar/desmarcar como útil

## Componentes Frontend

- `OrderReviewForm` - Formulário para criar/editar review
- `OrderReviewsList` - Lista de reviews com botão "É útil"
- Integrado em `OrderReceipt` - Aparece automaticamente para pedidos entregues

