# Correção de Vulnerabilidades Cloudflare - auricapri.com.br

Este documento descreve as vulnerabilidades identificadas pelo Cloudflare Security Insights e como corrigi-las.

## Vulnerabilidades Identificadas

### 1. DMARC Record Errors (Severidade: Low)
**Status**: Active  
**Risco**: Email Spoofing  
**Data**: 2026-01-02

**Problema**:  
O domínio possui registros MX (email) sem um registro DMARC correspondente e corretamente formado.

**Solução**:
1. Acesse o Cloudflare Dashboard
2. Vá em **DNS** > **Records**
3. Adicione um novo registro TXT com o nome `_dmarc.auricapri.com.br`
4. Use o seguinte valor (ajuste conforme necessário):

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@auricapri.com.br; ruf=mailto:dmarc@auricapri.com.br; fo=1; adkim=r; aspf=r; pct=100; rf=afrf; ri=86400
```

**Ou use o Email Security Wizard do Cloudflare**:
- Vá em **Email** > **Email Routing** > **Security**
- Use o wizard para gerar automaticamente o registro DMARC

**Políticas DMARC recomendadas**:
- `p=none` - Apenas monitoramento (inicial)
- `p=quarantine` - Quarentena emails suspeitos
- `p=reject` - Rejeita emails não autenticados (após validação)

### 2. Unproxied 'A' Records (Severidade: Moderate)
**Status**: Active  
**Risco**: DDoS Attack  
**Data**: 2026-01-02

**Problema**:  
Registros DNS tipo 'A' não estão sendo proxyados pelo Cloudflare, expondo o servidor de origem diretamente.

**Solução**:
1. Acesse o Cloudflare Dashboard
2. Vá em **DNS** > **Records**
3. Para cada registro 'A' que precisa ser protegido:
   - Clique no registro
   - Ative o **Proxy** (ícone de nuvem laranja)
   - O ícone deve ficar laranja (proxied) ao invés de cinza (DNS only)

**Registros que devem estar proxied**:
- `auricapri.com.br` (root domain)
- `www.auricapri.com.br` (se existir)
- Qualquer subdomínio que aponte para o servidor de origem

**Benefícios**:
- IP do servidor de origem fica oculto
- Proteção automática contra DDoS
- Cache de conteúdo estático
- SSL/TLS automático

### 3. Review unwanted AI crawlers with AI Labyrinth (Severidade: Low)
**Status**: Active  
**Tipo**: Configuration suggestion

**Solução**:
1. Acesse o Cloudflare Dashboard
2. Vá em **Security** > **Bots**
3. Procure por **AI Labyrinth** ou **AI Scrapers and Crawlers**
4. Ative a opção **AI Labyrinth**
5. Configure quais crawlers AI devem ser bloqueados/permitidos

**Benefícios**:
- Reduz uso de recursos por crawlers AI
- Protege conteúdo proprietário
- Melhora performance do site

### 4. Review and block AI bots (Severidade: Moderate)
**Status**: Active  
**Tipo**: Configuration suggestion

**Solução**:
1. Acesse o Cloudflare Dashboard
2. Vá em **Security** > **Bots**
3. Ative o toggle **Block AI bots**
4. Revise a lista de bots AI e ajuste conforme necessário

**Bots AI comuns**:
- ChatGPT-User
- Google-Extended
- GPTBot
- CCBot
- anthropic-ai
- Claude-Web

**Configuração recomendada**:
- Bloquear bots de treinamento de modelos
- Permitir bots de indexação (Google, Bing) se necessário
- Monitorar logs para ajustar regras

## Checklist de Implementação

- [ ] Adicionar registro DMARC via DNS ou Email Security Wizard
- [ ] Verificar e ativar Proxy em todos os registros 'A' relevantes
- [ ] Ativar AI Labyrinth em Security > Bots
- [ ] Ativar Block AI bots toggle
- [ ] Revisar configurações de segurança após 24-48h
- [ ] Verificar se vulnerabilidades foram resolvidas no Security Insights

## Verificação

Após implementar as correções:

1. **DMARC**: Verifique com ferramentas como:
   - https://mxtoolbox.com/dmarc.aspx
   - https://www.dmarcanalyzer.com/

2. **Proxy Status**: 
   - Verifique no DNS se os registros mostram nuvem laranja
   - Teste acesso ao site - deve mostrar Cloudflare nos headers

3. **AI Bots**:
   - Verifique logs em Security > Events
   - Monitore bloqueios de bots AI

## Notas Importantes

- **DMARC**: Comece com `p=none` para monitorar, depois evolua para `quarantine` e finalmente `reject`
- **Proxy**: Alguns serviços podem não funcionar com proxy (ex: email SMTP). Use DNS only para esses casos
- **AI Bots**: Bloquear pode afetar SEO se bots de indexação forem bloqueados. Revise cuidadosamente

## Suporte

Para mais informações:
- [Cloudflare DMARC Documentation](https://developers.cloudflare.com/dns/manage-dns-records/how-to/email-security/)
- [Cloudflare Bot Management](https://developers.cloudflare.com/bots/)
- [Cloudflare Security Center](https://dash.cloudflare.com/)

