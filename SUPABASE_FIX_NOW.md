# 🔴 AÇÃO URGENTE - Configurar Supabase Dashboard

## Problema Identificado
O código está correto e usando a URL `https://frontend-female.vercel.app`, mas o Supabase está ignorando porque essa URL não está na lista de URLs permitidas.

## Solução Imediata (5 minutos)

### Passo 1: Acesse o Supabase Dashboard
1. Vá para: https://app.supabase.com
2. Selecione seu projeto: `zbrunudbdyuebtpxfnkd`

### Passo 2: Configure as Redirect URLs
1. No menu lateral, clique em **Authentication**
2. Clique em **URL Configuration** (ou vá direto em Settings > Auth)
3. Na seção **Redirect URLs**, adicione EXATAMENTE estas URLs (uma por linha):

```
http://localhost:3000
http://localhost:3000/**
https://frontend-female.vercel.app
https://frontend-female.vercel.app/**
```

4. Clique em **Save**

### Passo 3: Configure a Site URL
1. Na mesma página, encontre o campo **Site URL**
2. Defina como: `https://frontend-female.vercel.app`
3. Clique em **Save**

### Passo 4: Verifique o Google OAuth Provider
1. Ainda em **Authentication**, clique em **Providers**
2. Clique em **Google**
3. Verifique se está **Enabled**
4. Verifique se **Client ID** e **Client Secret** estão configurados
5. Clique em **Save** se fez alguma alteração

## ⚠️ IMPORTANTE
- Após salvar, aguarde 1-2 minutos para as mudanças propagarem
- Teste novamente o login com Google
- Se ainda não funcionar, limpe o cache do navegador (Cmd+Shift+R no Mac)

## Verificação
Após configurar, o OAuth deve redirecionar para:
`https://frontend-female.vercel.app/#access_token=...`

Em vez de:
`localhost:3000/#access_token=...`

