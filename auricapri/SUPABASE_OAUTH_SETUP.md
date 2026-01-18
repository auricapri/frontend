# Configuração do OAuth do Supabase - Solução do Problema de Redirecionamento

## Problema
O OAuth está redirecionando para `localhost:3000` mesmo em produção.

## Causa
O Supabase valida as URLs de redirecionamento. Se a URL de produção não estiver configurada no dashboard do Supabase, ele pode ignorar o parâmetro `redirectTo` e usar uma URL padrão.

## Solução Completa

### 1. Configurar Variável de Ambiente

Crie ou edite o arquivo `.env` na raiz do projeto `auricapri/`:

```bash
VITE_SUPABASE_URL=https://zbrunudbdyuebtpxfnkd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_x5fb1BLl1KN851qTDOgjPg_59DeZfwU
VITE_FRONTEND_URL=https://sua-url-de-producao.com
```

**⚠️ IMPORTANTE:** Substitua `https://sua-url-de-producao.com` pela URL real da sua aplicação em produção.

### 2. Configurar no Supabase Dashboard (CRÍTICO)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Authentication** > **URL Configuration**
4. Na seção **Redirect URLs**, adicione:
   - Sua URL de produção: `https://sua-url-de-producao.com`
   - Sua URL de produção com path: `https://sua-url-de-producao.com/**`
   - (Opcional) URL de desenvolvimento: `http://localhost:3000` (apenas para desenvolvimento local)

5. **Site URL** também deve estar configurada:
   - Em produção: `https://sua-url-de-producao.com`
   - Em desenvolvimento: `http://localhost:3000`

### 3. Rebuild da Aplicação

**IMPORTANTE:** Variáveis de ambiente `VITE_*` são injetadas no build. Após configurar o `.env`:

```bash
# No diretório auricapri/
npm run build
```

### 4. Verificar no Console do Navegador

Após fazer o deploy, abra o console do navegador (F12) e verifique:
- Ao clicar em "Google Login", deve aparecer no console: `OAuth redirect URL: https://sua-url-de-producao.com`
- Se aparecer `localhost:3000`, significa que a variável `VITE_FRONTEND_URL` não está configurada ou não foi incluída no build

### 5. Verificar Configuração do Google OAuth

No Supabase Dashboard:
1. Vá em **Authentication** > **Providers** > **Google**
2. Verifique se o OAuth está habilitado
3. Verifique se os **Client ID** e **Client Secret** estão configurados corretamente
4. No Google Cloud Console, verifique se as **Authorized redirect URIs** incluem:
   - `https://zbrunudbdyuebtpxfnkd.supabase.co/auth/v1/callback`

## Checklist de Verificação

- [ ] Arquivo `.env` criado com `VITE_FRONTEND_URL` configurada
- [ ] URL de produção adicionada em **Redirect URLs** no Supabase Dashboard
- [ ] **Site URL** configurada no Supabase Dashboard
- [ ] Aplicação rebuildada após configurar `.env`
- [ ] Deploy realizado com as novas variáveis
- [ ] Console do navegador mostra a URL correta ao fazer login

## Debug

Se ainda estiver redirecionando para localhost:

1. **Verifique o console do navegador:**
   ```javascript
   console.log('VITE_FRONTEND_URL:', import.meta.env.VITE_FRONTEND_URL);
   console.log('window.location.origin:', window.location.origin);
   ```

2. **Verifique se a variável está no build:**
   - As variáveis `VITE_*` precisam estar disponíveis no momento do build
   - Se estiver usando um serviço de deploy (Vercel, Netlify, etc.), configure as variáveis de ambiente no painel do serviço

3. **Verifique a configuração do Supabase:**
   - A URL de produção DEVE estar na lista de Redirect URLs permitidas
   - O Supabase pode bloquear redirecionamentos para URLs não autorizadas

## Exemplo de Configuração Completa

### .env (local)
```bash
VITE_SUPABASE_URL=https://zbrunudbdyuebtpxfnkd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_x5fb1BLl1KN851qTDOgjPg_59DeZfwU
VITE_FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:3001/api
```

### .env.production (ou variáveis no serviço de deploy)
```bash
VITE_SUPABASE_URL=https://zbrunudbdyuebtpxfnkd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_x5fb1BLl1KN851qTDOgjPg_59DeZfwU
VITE_FRONTEND_URL=https://auricapri.com
VITE_API_URL=https://api.auricapri.com/api
```

### Supabase Dashboard - Redirect URLs
```
http://localhost:3000
http://localhost:3000/**
https://auricapri.com
https://auricapri.com/**
```

### Supabase Dashboard - Site URL
```
https://auricapri.com
```

