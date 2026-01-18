-- ============================================
-- Seed: Marketplace Providers
-- Data: 16 de Janeiro de 2026
-- Descrição: Insere os providers de marketplace disponíveis
-- ============================================

-- Limpa dados existentes (para idempotência)
DELETE FROM marketplace_providers WHERE code IN (
  'mercado_livre', 'shopee', 'aliexpress', 'temu', 'amazon', 'magalu', 'americanas', 'shein'
);

-- Mercado Livre (Brasil)
INSERT INTO marketplace_providers (code, name, logo_url, base_url, auth_type, required_fields, commission_default, documentation_url, is_active)
VALUES (
  'mercado_livre',
  'Mercado Livre',
  'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/logo__large_plus.png',
  'https://api.mercadolibre.com',
  'oauth2',
  '{
    "fields": [
      {"key": "client_id", "label": "App ID", "type": "text", "required": true, "help": "ID da aplicação no Portal de Desenvolvedores do Mercado Livre"},
      {"key": "client_secret", "label": "Secret Key", "type": "password", "required": true, "help": "Chave secreta da aplicação"},
      {"key": "redirect_uri", "label": "Redirect URI", "type": "text", "required": true, "help": "URL de callback OAuth (deve ser registrada no portal)"}
    ],
    "oauth": {
      "auth_url": "https://auth.mercadolivre.com.br/authorization",
      "token_url": "https://api.mercadolibre.com/oauth/token",
      "scopes": ["read", "write", "offline_access"]
    }
  }',
  11.00,
  'https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br',
  true
);

-- Shopee (Brasil)
INSERT INTO marketplace_providers (code, name, logo_url, base_url, auth_type, required_fields, commission_default, documentation_url, is_active)
VALUES (
  'shopee',
  'Shopee',
  'https://cf.shopee.com.br/file/br-50009109-7f13e0e6e0e0e0e0e0e0e0e0e0e0e0e0',
  'https://partner.shopeemobile.com',
  'oauth2',
  '{
    "fields": [
      {"key": "partner_id", "label": "Partner ID", "type": "text", "required": true, "help": "ID do parceiro fornecido pela Shopee"},
      {"key": "partner_key", "label": "Partner Key", "type": "password", "required": true, "help": "Chave secreta do parceiro"},
      {"key": "shop_id", "label": "Shop ID", "type": "text", "required": true, "help": "ID da loja na Shopee"}
    ],
    "oauth": {
      "auth_url": "https://partner.shopeemobile.com/api/v2/shop/auth_partner",
      "token_url": "https://partner.shopeemobile.com/api/v2/auth/token/get",
      "scopes": []
    }
  }',
  12.00,
  'https://open.shopee.com/documents',
  true
);

-- AliExpress
INSERT INTO marketplace_providers (code, name, logo_url, base_url, auth_type, required_fields, commission_default, documentation_url, is_active)
VALUES (
  'aliexpress',
  'AliExpress',
  'https://ae01.alicdn.com/kf/S4c50e0e0e0e0e0e0e0e0e0e0e0e0e0e0.png',
  'https://api-sg.aliexpress.com',
  'api_key',
  '{
    "fields": [
      {"key": "app_key", "label": "App Key", "type": "text", "required": true, "help": "App Key da aplicação AliExpress"},
      {"key": "app_secret", "label": "App Secret", "type": "password", "required": true, "help": "Secret da aplicação"},
      {"key": "access_token", "label": "Access Token", "type": "password", "required": true, "help": "Token de acesso gerado no painel"}
    ],
    "oauth": null
  }',
  8.00,
  'https://developers.aliexpress.com/en/doc.htm',
  true
);

-- Temu
INSERT INTO marketplace_providers (code, name, logo_url, base_url, auth_type, required_fields, commission_default, documentation_url, is_active)
VALUES (
  'temu',
  'Temu',
  'https://aimg.kwcdn.com/upload_aimg/web/logo.png',
  'https://openapi.temu.com',
  'api_key',
  '{
    "fields": [
      {"key": "api_key", "label": "API Key", "type": "password", "required": true, "help": "Chave de API fornecida pela Temu"},
      {"key": "seller_id", "label": "Seller ID", "type": "text", "required": true, "help": "ID do vendedor na plataforma"}
    ],
    "oauth": null
  }',
  15.00,
  'https://seller.temu.com/api-documentation',
  true
);

-- Amazon (Brasil - SP-API)
INSERT INTO marketplace_providers (code, name, logo_url, base_url, auth_type, required_fields, commission_default, documentation_url, is_active)
VALUES (
  'amazon',
  'Amazon',
  'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  'https://sellingpartnerapi-sa-east-1.amazon.com',
  'oauth2',
  '{
    "fields": [
      {"key": "client_id", "label": "LWA Client ID", "type": "text", "required": true, "help": "Client ID do Login with Amazon"},
      {"key": "client_secret", "label": "LWA Client Secret", "type": "password", "required": true, "help": "Client Secret do LWA"},
      {"key": "refresh_token", "label": "Refresh Token", "type": "password", "required": true, "help": "Token de atualização da SP-API"},
      {"key": "seller_id", "label": "Seller ID", "type": "text", "required": true, "help": "ID do vendedor na Amazon"},
      {"key": "marketplace_id", "label": "Marketplace ID", "type": "text", "required": false, "help": "ID do marketplace (padrão: A2Q3Y263D00KWC para Brasil)"}
    ],
    "oauth": {
      "auth_url": "https://sellercentral.amazon.com.br/apps/authorize/consent",
      "token_url": "https://api.amazon.com/auth/o2/token",
      "scopes": []
    }
  }',
  15.00,
  'https://developer-docs.amazon.com/sp-api/',
  true
);

-- Magazine Luiza
INSERT INTO marketplace_providers (code, name, logo_url, base_url, auth_type, required_fields, commission_default, documentation_url, is_active)
VALUES (
  'magalu',
  'Magazine Luiza',
  'https://logodownload.org/wp-content/uploads/2014/06/magalu-logo.png',
  'https://api.magalu.com',
  'api_key',
  '{
    "fields": [
      {"key": "api_key", "label": "API Key", "type": "password", "required": true, "help": "Chave de API do Magalu Marketplace"},
      {"key": "seller_id", "label": "Seller ID", "type": "text", "required": true, "help": "ID do seller na plataforma"}
    ],
    "oauth": null
  }',
  16.00,
  'https://dev.magalu.com/',
  true
);

-- Americanas Marketplace (B2W)
INSERT INTO marketplace_providers (code, name, logo_url, base_url, auth_type, required_fields, commission_default, documentation_url, is_active)
VALUES (
  'americanas',
  'Americanas',
  'https://logodownload.org/wp-content/uploads/2019/08/americanas-logo.png',
  'https://api-marketplace.americanas.com',
  'api_key',
  '{
    "fields": [
      {"key": "app_token", "label": "App Token", "type": "password", "required": true, "help": "Token da aplicação B2W"},
      {"key": "seller_id", "label": "Seller ID", "type": "text", "required": true, "help": "ID do vendedor no marketplace"}
    ],
    "oauth": null
  }',
  16.00,
  'https://developers.americanas.io/',
  true
);

-- SHEIN (Seller Center)
INSERT INTO marketplace_providers (code, name, logo_url, base_url, auth_type, required_fields, commission_default, documentation_url, is_active)
VALUES (
  'shein',
  'SHEIN',
  'https://img.ltwebstatic.com/images3_pi/2021/06/23/16244097066e0e0e0e0e0e0e0e0e0e0e.png',
  'https://openapi.shein.com',
  'api_key',
  '{
    "fields": [
      {"key": "app_key", "label": "App Key", "type": "text", "required": true, "help": "App Key do Seller Center"},
      {"key": "app_secret", "label": "App Secret", "type": "password", "required": true, "help": "Secret do Seller Center"},
      {"key": "access_token", "label": "Access Token", "type": "password", "required": true, "help": "Token de acesso"}
    ],
    "oauth": null
  }',
  20.00,
  'https://sellercenter.shein.com/',
  true
);

-- Verificação
SELECT code, name, auth_type, commission_default FROM marketplace_providers ORDER BY name;
