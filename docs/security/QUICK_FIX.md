# Correção Rápida - Vulnerabilidades Cloudflare

## Ações Imediatas (5 minutos)

### 1. Ativar Proxy nos Registros DNS
**Onde**: Cloudflare Dashboard > DNS > Records

Para cada registro 'A' de `auricapri.com.br`:
- Clique no ícone de nuvem cinza
- Deve ficar **laranja** (proxied)

### 2. Adicionar DMARC
**Onde**: Cloudflare Dashboard > DNS > Records > Add record

- **Type**: TXT
- **Name**: `_dmarc`
- **Content**: `v=DMARC1; p=none; rua=mailto:dmarc@auricapri.com.br;`
- **Proxy**: Off (cinza)

### 3. Bloquear AI Bots
**Onde**: Cloudflare Dashboard > Security > Bots

- Ative **Block AI bots** toggle
- Ative **AI Labyrinth**

## Prioridade

1. **ALTA**: Ativar Proxy (proteção DDoS)
2. **MÉDIA**: Bloquear AI Bots
3. **BAIXA**: DMARC (pode começar com monitoramento)

## Verificação Rápida

Após 5 minutos, verifique:
- Registros DNS mostram nuvem laranja?
- Security Insights ainda mostra as vulnerabilidades?

**Nota**: Pode levar até 24h para o Cloudflare atualizar os Security Insights.

