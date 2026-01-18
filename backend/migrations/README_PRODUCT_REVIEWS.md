# Migração: Sistema de Avaliações por Produto

Esta migração cria o sistema de avaliações por produto, onde cada produto do pedido pode ser avaliado individualmente com suas variantes específicas (tamanho, cor).

## Aplicar a Migração

Execute o SQL no Supabase SQL Editor:

```sql
-- Execute o conteúdo do arquivo create_product_reviews.sql
```

## Configurar Storage Bucket

1. Acesse o Supabase Dashboard → Storage
2. Crie um bucket chamado `product-reviews` (se não existir)
3. Configure as políticas RLS:

```sql
-- Permitir leitura pública
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-reviews');

-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-reviews' 
  AND auth.role() = 'authenticated'
);

-- Permitir atualização apenas para o dono
CREATE POLICY "Owner update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-reviews' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir deleção apenas para o dono
CREATE POLICY "Owner delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-reviews' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Estrutura

- **product_reviews**: Avaliações por produto/variante
- **product_review_media**: Mídia (fotos/vídeos) das avaliações
- **product_review_helpful**: Rastreamento de "útil" por usuário

## Diferenças da versão anterior

- Avaliação é por **produto**, não por pedido
- Cada produto mostra suas **variantes específicas** (M/vermelho)
- Usuário pode avaliar cada produto individualmente
- Cashback é aplicado por avaliação de produto

