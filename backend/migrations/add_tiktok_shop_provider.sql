-- ============================================
-- Migration: Adicionar TikTok Shop como Provider
-- Data: 18 de Janeiro de 2026
-- Descricao: Adiciona TikTok Shop na tabela marketplace_providers
-- ============================================

-- Remover se existir (para idempotencia)
DELETE FROM marketplace_providers WHERE code = 'tiktok_shop';

-- Inserir TikTok Shop
INSERT INTO marketplace_providers (code, name, logo_url, base_url, auth_type, required_fields, commission_default, documentation_url, is_active)
VALUES (
  'tiktok_shop',
  'TikTok Shop',
  'https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png',
  'https://open-api.tiktokglobalshop.com',
  'oauth2',
  '{
    "fields": [
      {"key": "app_key", "label": "App Key", "type": "text", "required": true, "help": "App Key do TikTok Shop Partner Center"},
      {"key": "app_secret", "label": "App Secret", "type": "password", "required": true, "help": "App Secret do TikTok Shop"}
    ],
    "oauth": {
      "auth_url": "https://services.tiktokshop.com/open/authorize",
      "token_url": "https://auth.tiktok-shops.com/api/v2/token/get",
      "scopes": []
    }
  }',
  10.00,
  'https://partner.tiktokshop.com/docv2/page/6507ead7b99d5302be949ba9',
  true
);

-- Verificar
SELECT code, name, auth_type, commission_default FROM marketplace_providers WHERE code = 'tiktok_shop';
