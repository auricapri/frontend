# Configuração de Variáveis de Ambiente

Este documento descreve as variáveis de ambiente necessárias para o funcionamento da aplicação.

## Variáveis Obrigatórias

### Supabase

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Onde encontrar:**
- Acesse o dashboard do seu projeto Supabase
- Vá em Settings > API
- Copie a URL do projeto e a chave `anon` public

### Frontend URL (Importante para OAuth)

```bash
VITE_FRONTEND_URL=https://yourdomain.com
```

**Importante:** Esta variável é usada para o redirecionamento do OAuth. 
- Em **produção**, defina esta variável com a URL pública da sua aplicação (ex: `https://auricapri.com`)
- Em **desenvolvimento local**, você pode deixar vazia e o sistema usará `window.location.origin` automaticamente

**⚠️ ATENÇÃO:** Sem esta variável configurada corretamente em produção, o OAuth do Google (e outros provedores) redirecionará para `localhost`, causando erros.

## Variáveis Opcionais

### API URL

```bash
VITE_API_URL=http://localhost:3001/api
```

URL do backend. Em produção, defina para a URL do seu backend deployado.

### Gemini API Key

```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

Chave da API do Gemini (opcional, apenas se usar recursos de IA).

## Como Configurar

1. Crie um arquivo `.env` ou `.env.local` na raiz do projeto `auricapri/`
2. Adicione as variáveis acima com os valores corretos
3. Reinicie o servidor de desenvolvimento (`npm run dev`)

## Exemplo de Arquivo .env

```bash
# Supabase
VITE_SUPABASE_URL=https://zbrunudbdyuebtpxfnkd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_x5fb1BLl1KN851qTDOgjPg_59DeZfwU

# Frontend URL (PRODUÇÃO)
VITE_FRONTEND_URL=https://auricapri.com

# API
VITE_API_URL=https://api.auricapri.com/api

# Gemini (opcional)
GEMINI_API_KEY=your-key-here
```

## Configuração no Supabase

Além de configurar as variáveis de ambiente, você também precisa configurar as URLs de redirecionamento no dashboard do Supabase:

1. Acesse Authentication > URL Configuration
2. Adicione sua URL de produção em "Redirect URLs"
3. Exemplo: `https://yourdomain.com`

