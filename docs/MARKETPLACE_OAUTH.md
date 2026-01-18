# Marketplace OAuth - Guia de Configuracao

## Visao Geral

Este documento descreve o fluxo OAuth para integracao com marketplaces (Mercado Livre, TikTok Shop, etc.) no sistema Auricapri.

---

## URLs de Redirect

### URL Padrao para Todos os Marketplaces

```
https://api.auricapri.com.br/api/marketplace/oauth/callback
```

Esta URL deve ser registrada em **todos** os portais de desenvolvedores dos marketplaces.

---

## Configuracao por Marketplace

### Mercado Livre

**Portal:** https://developers.mercadolivre.com.br/devcenter

| Campo | Valor |
|-------|-------|
| Redirect URI | `https://api.auricapri.com.br/api/marketplace/oauth/callback` |
| Auth URL | `https://auth.mercadolivre.com.br/authorization` |
| Token URL | `https://api.mercadolibre.com/oauth/token` |

**Passos para configurar:**
1. Acesse o Portal de Desenvolvedores
2. Crie ou edite sua aplicacao
3. Em "Redirect URI", adicione exatamente: `https://api.auricapri.com.br/api/marketplace/oauth/callback`
4. Anote o `App ID` e `Secret Key`
5. Salve as alteracoes

---

### TikTok Shop

**Portal:** https://partner.tiktokshop.com/

| Campo | Valor |
|-------|-------|
| Redirect URI | `https://api.auricapri.com.br/api/marketplace/oauth/callback` |
| Auth URL | `https://services.tiktokshop.com/open/authorize` |
| Token URL | `https://auth.tiktok-shops.com/api/v2/token/get` |

**Passos para configurar:**
1. Acesse o TikTok Shop Partner Center
2. Va em "My Apps" > Criar/Editar aplicacao
3. Em "Callback URL", adicione: `https://api.auricapri.com.br/api/marketplace/oauth/callback`
4. Anote o `App Key` e `App Secret`
5. Salve as alteracoes

---

## Fluxo OAuth

```
┌─────────────┐     1. Clica "Conectar"      ┌─────────────┐
│   Frontend  │ ──────────────────────────>  │   Backend   │
│  (React)    │                              │   (Node)    │
└─────────────┘                              └─────────────┘
                                                    │
                                    2. Retorna URL do Marketplace
                                                    │
┌─────────────┐     3. Redirect               ┌─────────────┐
│   Usuario   │ ──────────────────────────>   │ Marketplace │
│  (Browser)  │                               │    (ML)     │
└─────────────┘                               └─────────────┘
       │                                            │
       │              4. Usuario autoriza           │
       │<───────────────────────────────────────────│
       │
       │     5. Redirect com code
       │     https://api.../oauth/callback?code=XX
       ▼
┌─────────────┐                              ┌─────────────┐
│   Backend   │  6. Troca code por token     │ Marketplace │
│   (Node)    │ ──────────────────────────>  │    API      │
└─────────────┘                              └─────────────┘
       │                                            │
       │              7. Retorna tokens             │
       │<───────────────────────────────────────────│
       │
       │     8. Salva tokens no banco (criptografado)
       │     9. Redirect para frontend
       ▼
┌─────────────┐
│   Frontend  │  ?oauth=success&config_id=XX
│   (React)   │
└─────────────┘
```

---

## Armazenamento de Tokens

Os tokens sao armazenados na tabela `marketplace_configs`:

| Campo | Descricao |
|-------|-----------|
| `access_token_encrypted` | Token de acesso criptografado (AES-256-CBC) |
| `refresh_token_encrypted` | Refresh token criptografado |
| `token_expires_at` | Data/hora de expiracao do token |
| `status` | `'connected'` apos sucesso, `'disconnected'` em erro |

**Seguranca:**
- Tokens sao criptografados usando `MASTER_KEY` com AES-256-CBC
- Nunca sao expostos em logs ou respostas da API
- Refresh automatico antes da expiracao

---

## Variaveis de Ambiente

### Backend (.env)

```env
# URL do frontend para redirect apos OAuth
FRONTEND_URL=https://www.auricapri.com.br

# URL do backend para construir redirect_uri
BACKEND_URL=https://api.auricapri.com.br

# Chave de criptografia dos tokens (32 caracteres)
MASTER_KEY=sua_chave_aqui
```

### Frontend (.env)

```env
# URL da API
VITE_API_URL=https://api.auricapri.com.br/api
```

---

## Troubleshooting

### Erro: "Nao foi possivel conectar o aplicativo a sua conta"

**Causa:** Redirect URI nao corresponde ao registrado no portal.

**Solucao:**
1. Verifique se a URL no portal e exatamente: `https://api.auricapri.com.br/api/marketplace/oauth/callback`
2. Sem barras extras, sem espacos, protocolo HTTPS

---

### Erro: Safari nao pode abrir a pagina

**Causa:** `FRONTEND_URL` nao configurado no backend.

**Solucao:**
1. Adicione `FRONTEND_URL=https://www.auricapri.com.br` no .env do backend
2. Reinicie o servidor

---

### Erro: client_id undefined

**Causa:** Credenciais nao foram enviadas corretamente.

**Solucao:**
1. Verifique se os campos `client_id` e `client_secret` estao preenchidos
2. Confirme que os nomes dos campos correspondem ao esperado pelo backend

---

### Token expirado

**Comportamento esperado:** O sistema deve renovar automaticamente usando o refresh_token.

**Se nao renovar:**
1. Verifique se `refresh_token_encrypted` existe no banco
2. Verifique logs do backend para erros na renovacao
3. Pode ser necessario reconectar a conta

---

## Endpoints da API

### Obter URL de Autorizacao

```
GET /api/marketplace/configs/{configId}/auth-url?redirect_uri={redirectUri}
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "url": "https://auth.mercadolivre.com.br/authorization?client_id=...&redirect_uri=...&state=..."
}
```

---

### Callback OAuth (Publico)

```
GET /api/marketplace/oauth/callback?code={code}&state={state}
```

Este endpoint e publico (sem autenticacao) para receber o redirect do marketplace.

**Redirect de sucesso:**
```
https://www.auricapri.com.br/admin/marketplaces?oauth=success&config_id={configId}
```

**Redirect de erro:**
```
https://www.auricapri.com.br/admin/marketplaces?oauth=error&message={mensagem}
```

---

## Checklist de Configuracao

- [ ] Registrar app no portal do marketplace
- [ ] Configurar Redirect URI exata: `https://api.auricapri.com.br/api/marketplace/oauth/callback`
- [ ] Anotar Client ID e Client Secret
- [ ] Configurar `FRONTEND_URL` no backend
- [ ] Configurar `BACKEND_URL` no backend
- [ ] Configurar `VITE_API_URL` no frontend
- [ ] Testar conexao em ambiente de desenvolvimento
- [ ] Testar conexao em producao
