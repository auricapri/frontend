-- ============================================================
-- DELIVERY DEMO DATA — Auricapri
-- Execute no Supabase SQL Editor
-- Gera dados de demonstracao para o painel de entregas
-- ============================================================

-- 1. CRIAR FORNECEDORES DEMO
-- (use ON CONFLICT para nao duplicar se rodar novamente)

INSERT INTO suppliers (id, store_name, phone, email, contact_person, is_active, address, comments, created_at, updated_at)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'Moda Fashion Atacado',
    '(11) 98765-4321',
    'contato@modafashion.com.br',
    'Ana Silva',
    true,
    jsonb_build_object(
      'street', 'Rua Oscar Freire',
      'number', '1234',
      'neighborhood', 'Jardins',
      'city', 'Sao Paulo',
      'state', 'SP',
      'zip', '01426-001'
    ),
    'Fornecedor principal de vestidos e blusas',
    now(),
    now()
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    'Elegance Textil',
    '(11) 91234-5678',
    'vendas@elegancetextil.com.br',
    'Carlos Mendes',
    true,
    jsonb_build_object(
      'street', 'Rua Jose Paulino',
      'number', '567',
      'neighborhood', 'Bom Retiro',
      'city', 'Sao Paulo',
      'state', 'SP',
      'zip', '01120-200'
    ),
    'Fornecedor de acessorios e calcas',
    now(),
    now()
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'Bella Donna Confeccoes',
    '(11) 94567-8901',
    'atacado@belladonna.com.br',
    'Maria Oliveira',
    true,
    jsonb_build_object(
      'street', 'Rua Maria Marcolina',
      'number', '890',
      'neighborhood', 'Bras',
      'city', 'Sao Paulo',
      'state', 'SP',
      'zip', '03016-020'
    ),
    'Fornecedor de saias e conjuntos',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- 2. ASSOCIAR PRODUTOS EXISTENTES AOS FORNECEDORES
-- Distribui os produtos existentes entre os 3 fornecedores
-- (ajuste os IDs se os seus produtos tiverem IDs diferentes)

-- Pega os 3 primeiros produtos → fornecedor 1 (Moda Fashion)
UPDATE products SET supplier_id = 'a1111111-1111-1111-1111-111111111111'
WHERE id IN (SELECT id FROM products WHERE is_active = true ORDER BY created_at LIMIT 3);

-- Produto 4 → fornecedor 2 (Elegance Textil)
UPDATE products SET supplier_id = 'b2222222-2222-2222-2222-222222222222'
WHERE id IN (SELECT id FROM products WHERE is_active = true ORDER BY created_at LIMIT 1 OFFSET 3);

-- Produto 5+ → fornecedor 3 (Bella Donna)
UPDATE products SET supplier_id = 'c3333333-3333-3333-3333-333333333333'
WHERE id IN (SELECT id FROM products WHERE is_active = true AND supplier_id IS NULL);

-- 3. CRIAR PEDIDOS DE DEMONSTRACAO PARA HOJE
-- Esses pedidos aparecerao no painel de entregas

-- Funcao auxiliar para pegar dados de produtos reais
DO $$
DECLARE
  prod1 RECORD;
  prod2 RECORD;
  prod3 RECORD;
  var1 RECORD;
  var2 RECORD;
  var3 RECORD;
  order1_id UUID := gen_random_uuid();
  order2_id UUID := gen_random_uuid();
  order3_id UUID := gen_random_uuid();
  order4_id UUID := gen_random_uuid();
BEGIN
  -- Buscar produtos reais com suas variantes
  SELECT p.id, p.name, p.base_images INTO prod1
  FROM products p WHERE p.is_active = true ORDER BY p.created_at LIMIT 1;

  SELECT p.id, p.name, p.base_images INTO prod2
  FROM products p WHERE p.is_active = true ORDER BY p.created_at LIMIT 1 OFFSET 1;

  SELECT p.id, p.name, p.base_images INTO prod3
  FROM products p WHERE p.is_active = true ORDER BY p.created_at LIMIT 1 OFFSET 2;

  -- Buscar variantes
  SELECT pv.id, pv.retail_price, pv.size, pv.color_name, pv.sku INTO var1
  FROM product_variants pv WHERE pv.product_id = prod1.id AND pv.is_active = true LIMIT 1;

  SELECT pv.id, pv.retail_price, pv.size, pv.color_name, pv.sku INTO var2
  FROM product_variants pv WHERE pv.product_id = prod2.id AND pv.is_active = true LIMIT 1;

  SELECT pv.id, pv.retail_price, pv.size, pv.color_name, pv.sku INTO var3
  FROM product_variants pv WHERE pv.product_id = prod3.id AND pv.is_active = true LIMIT 1;

  -- Se nao encontrou produtos, abortar
  IF prod1.id IS NULL THEN
    RAISE NOTICE 'Nenhum produto encontrado. Cadastre produtos primeiro.';
    RETURN;
  END IF;

  -- Pedido 1: 2 itens do fornecedor 1 (Moda Fashion)
  INSERT INTO orders (id, created_at, status, total_amount, subtotal, shipping_cost, items, shipping_address_snapshot, payment_method, store_id)
  VALUES (
    order1_id,
    now() - interval '2 hours',
    'confirmed',
    COALESCE(var1.retail_price, 199.90) + COALESCE(var2.retail_price, 249.90),
    COALESCE(var1.retail_price, 199.90) + COALESCE(var2.retail_price, 249.90),
    0,
    jsonb_build_array(
      jsonb_build_object(
        'product_id', prod1.id,
        'variant_id', var1.id,
        'name', COALESCE(prod1.name, jsonb_build_object('pt', 'Produto 1')),
        'quantity', 1,
        'price', COALESCE(var1.retail_price, 199.90),
        'image', COALESCE((prod1.base_images->0)::text, '""'),
        'size', COALESCE(var1.size, 'M'),
        'color_name', COALESCE(var1.color_name, jsonb_build_object('pt', 'Preto')),
        'sku', COALESCE(var1.sku, 'SKU001')
      ),
      jsonb_build_object(
        'product_id', prod2.id,
        'variant_id', var2.id,
        'name', COALESCE(prod2.name, jsonb_build_object('pt', 'Produto 2')),
        'quantity', 2,
        'price', COALESCE(var2.retail_price, 249.90),
        'image', COALESCE((prod2.base_images->0)::text, '""'),
        'size', COALESCE(var2.size, 'P'),
        'color_name', COALESCE(var2.color_name, jsonb_build_object('pt', 'Branco')),
        'sku', COALESCE(var2.sku, 'SKU002')
      )
    ),
    jsonb_build_object(
      'name', 'Julia Santos',
      'street', 'Av. Paulista',
      'number', '1578',
      'neighborhood', 'Bela Vista',
      'city', 'Sao Paulo',
      'state', 'SP',
      'zip', '01310-200',
      'phone', '(11) 99876-5432'
    ),
    'pix',
    (SELECT id FROM store_config LIMIT 1)
  );

  -- Pedido 2: 1 item do fornecedor 2 (Elegance)
  INSERT INTO orders (id, created_at, status, total_amount, subtotal, shipping_cost, items, shipping_address_snapshot, payment_method, store_id)
  VALUES (
    order2_id,
    now() - interval '1 hour',
    'confirmed',
    COALESCE(var3.retail_price, 179.90),
    COALESCE(var3.retail_price, 179.90),
    0,
    jsonb_build_array(
      jsonb_build_object(
        'product_id', COALESCE(prod3.id, prod1.id),
        'variant_id', COALESCE(var3.id, var1.id),
        'name', COALESCE(prod3.name, jsonb_build_object('pt', 'Produto 3')),
        'quantity', 1,
        'price', COALESCE(var3.retail_price, 179.90),
        'image', COALESCE((COALESCE(prod3.base_images, prod1.base_images)->0)::text, '""'),
        'size', COALESCE(var3.size, 'G'),
        'color_name', COALESCE(var3.color_name, jsonb_build_object('pt', 'Rosa')),
        'sku', COALESCE(var3.sku, 'SKU003')
      )
    ),
    jsonb_build_object(
      'name', 'Fernanda Lima',
      'street', 'Rua Augusta',
      'number', '2045',
      'neighborhood', 'Consolacao',
      'city', 'Sao Paulo',
      'state', 'SP',
      'zip', '01305-100',
      'phone', '(11) 98765-1234'
    ),
    'credit_card',
    (SELECT id FROM store_config LIMIT 1)
  );

  -- Pedido 3: 3 itens (mix de fornecedores)
  INSERT INTO orders (id, created_at, status, total_amount, subtotal, shipping_cost, items, shipping_address_snapshot, payment_method, store_id)
  VALUES (
    order3_id,
    now() - interval '30 minutes',
    'confirmed',
    COALESCE(var1.retail_price, 199.90) * 2 + COALESCE(var2.retail_price, 249.90),
    COALESCE(var1.retail_price, 199.90) * 2 + COALESCE(var2.retail_price, 249.90),
    0,
    jsonb_build_array(
      jsonb_build_object(
        'product_id', prod1.id,
        'variant_id', var1.id,
        'name', COALESCE(prod1.name, jsonb_build_object('pt', 'Produto 1')),
        'quantity', 2,
        'price', COALESCE(var1.retail_price, 199.90),
        'image', COALESCE((prod1.base_images->0)::text, '""'),
        'size', COALESCE(var1.size, 'G'),
        'color_name', COALESCE(var1.color_name, jsonb_build_object('pt', 'Preto')),
        'sku', COALESCE(var1.sku, 'SKU001')
      ),
      jsonb_build_object(
        'product_id', prod2.id,
        'variant_id', var2.id,
        'name', COALESCE(prod2.name, jsonb_build_object('pt', 'Produto 2')),
        'quantity', 1,
        'price', COALESCE(var2.retail_price, 249.90),
        'image', COALESCE((prod2.base_images->0)::text, '""'),
        'size', COALESCE(var2.size, 'M'),
        'color_name', COALESCE(var2.color_name, jsonb_build_object('pt', 'Branco')),
        'sku', COALESCE(var2.sku, 'SKU002')
      )
    ),
    jsonb_build_object(
      'name', 'Patricia Almeida',
      'street', 'Rua Oscar Freire',
      'number', '789',
      'neighborhood', 'Jardins',
      'city', 'Sao Paulo',
      'state', 'SP',
      'zip', '01426-001',
      'phone', '(11) 97654-3210'
    ),
    'pix',
    (SELECT id FROM store_config LIMIT 1)
  );

  -- Pedido 4: 1 item (ja coletado parcialmente - para demonstrar progresso)
  INSERT INTO orders (id, created_at, status, total_amount, subtotal, shipping_cost, items, shipping_address_snapshot, payment_method, store_id)
  VALUES (
    order4_id,
    now() - interval '3 hours',
    'confirmed',
    COALESCE(var1.retail_price, 199.90),
    COALESCE(var1.retail_price, 199.90),
    0,
    jsonb_build_array(
      jsonb_build_object(
        'product_id', prod1.id,
        'variant_id', var1.id,
        'name', COALESCE(prod1.name, jsonb_build_object('pt', 'Produto 1')),
        'quantity', 1,
        'price', COALESCE(var1.retail_price, 199.90),
        'image', COALESCE((prod1.base_images->0)::text, '""'),
        'size', COALESCE(var1.size, 'P'),
        'color_name', COALESCE(var1.color_name, jsonb_build_object('pt', 'Preto')),
        'sku', COALESCE(var1.sku, 'SKU001')
      )
    ),
    jsonb_build_object(
      'name', 'Camila Rodrigues',
      'street', 'Alameda Santos',
      'number', '456',
      'neighborhood', 'Cerqueira Cesar',
      'city', 'Sao Paulo',
      'state', 'SP',
      'zip', '01418-000',
      'phone', '(11) 96543-2109'
    ),
    'boleto',
    (SELECT id FROM store_config LIMIT 1)
  );

  RAISE NOTICE 'Criados 4 pedidos demo: %, %, %, %', order1_id, order2_id, order3_id, order4_id;
END $$;

-- 4. CRIAR USUARIO DE DELIVERY (se nao existir)
-- IMPORTANTE: Primeiro crie o usuario no Supabase Auth (Dashboard > Authentication > Users)
-- Email: entregador@auricapri.com.br
-- Password: Entrega@2026
-- Depois rode o UPDATE abaixo para setar a role

-- UPDATE profiles SET role = 'delivery', is_delivery = true
-- WHERE email = 'entregador@auricapri.com.br';

-- ============================================================
-- INSTRUCOES:
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Crie o usuario de delivery no Auth dashboard:
--    Email: entregador@auricapri.com.br
--    Password: Entrega@2026
-- 3. Depois rode o UPDATE de profiles (descomente acima)
-- 4. Acesse: auricapri.com.br/delivery-login
-- 5. Faca login com as credenciais acima
-- 6. Configure o MFA (app autenticador)
-- 7. O painel mostrara os 4 pedidos agrupados por fornecedor
-- ============================================================
