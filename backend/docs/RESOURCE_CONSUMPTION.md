# Consumo de Recursos do Backend - Auricapri

Documentação técnica sobre o peso e consumo de recursos de cada componente do backend para avaliação de infraestrutura.

---

## Comparativo: Render Free vs Pro

| Recurso | Free Tier | Pro ($7/mês) |
|---------|-----------|--------------|
| RAM | 512 MB | 512 MB |
| CPU | Compartilhado | Dedicado parcial |
| Sleep | Após 15 min inativo | Nunca |
| Bandwidth | 100 GB/mês | Ilimitado |
| Custom Domains | Sim | Sim |
| SSL | Sim | Sim |
| Cold Start | ~30s após sleep | N/A |

---

## Resumo de Consumo por Componente

| Componente | RAM | CPU | Risco | Notas |
|------------|-----|-----|-------|-------|
| **Puppeteer (PDF)** | 100-200 MB | Alto | CRÍTICO | Lança Chromium headless |
| **Tracking Queue** | 20-100 MB | Médio | Alto | Fallback em memória |
| **Schedulers (8x)** | 10-30 MB | Picos | Alto | Jobs a cada hora/dia |
| **Redis Client** | 5-10 MB | Baixo | Médio | Conexões persistentes |
| **Express Server** | 50-80 MB | Baixo | Baixo | Base da aplicação |
| **Prometheus Metrics** | 5-10 MB | Baixo | Baixo | Coleta de métricas |

**Total estimado em repouso**: ~100-150 MB
**Pico com PDF**: ~300-400 MB
**Pico com tracking + PDF**: ~400-500 MB (limite!)

---

## Componentes Críticos

### 1. Puppeteer - Geração de PDF

**Arquivos**: `src/services/pdf.service.ts`
**Rotas**: `/api/pdf/receipt/:orderId`, `/api/pdf/plp/:orderId`

```
Consumo: 100-200 MB por instância do Chromium
Problema: Cada requisição de PDF lança um browser completo
Sem pooling: Browser é criado/destruído a cada request
```

**Impacto no Free Tier**:
- Uma única requisição de PDF pode consumir 40% da RAM
- Duas requisições simultâneas = crash quase garantido
- Não há proteção contra requisições concorrentes

**Soluções**:
1. **Desabilitar no Free Tier**: Remover rotas ou retornar erro
2. **Externalizar**: Usar função serverless (Vercel, Cloudflare Workers)
3. **Browser Pool**: Implementar pool de browsers reutilizáveis
4. **Limite de concorrência**: Usar semáforo para 1 PDF por vez

---

### 2. Tracking Queue Service

**Arquivo**: `src/services/tracking-queue.service.ts`

```
Limite em memória: 5.000 eventos
TTL em memória: 10 minutos
Batch size: 500 eventos
Intervalo: 30 segundos
```

**Fluxo**:
```
Requisição → Evento criado → Redis (ou memória) → Batch a cada 30s → Supabase
```

**Impacto no Free Tier**:
- Se Redis falhar, acumula em memória
- 5.000 eventos × ~1KB = ~5MB mínimo, pode crescer
- Picos de CPU a cada 30s durante processamento

**Configuração recomendada**:
```env
TRACKING_INTERVAL_MS=60000  # Aumentar para 60s
REDIS_URL_SERVER_PRIMARY=redis://...  # Obrigatório
```

---

### 3. Scheduler Service

**Arquivo**: `src/services/scheduler.service.ts`

| Job | Frequência | Impacto |
|-----|------------|---------|
| Dream Card Cleanup | Configurável | Médio |
| Cart Cleanup | Diário | Baixo |
| Tax Sync | Diário | Médio |
| Tax History Cleanup | Diário | Baixo |
| Tag Decay | Semanal | Baixo |
| Tracking Aggregates | Diário | Alto |
| Tracking Partitions | Mensal | Baixo |
| Tracking Cleanup | Diário | Médio |

**Impacto no Free Tier**:
- Mantém servidor "acordado" (bom)
- Picos de CPU durante execução de jobs
- Queries pesadas podem causar timeouts

**Configuração para desabilitar**:
```env
AUTO_CLEANUP_ENABLED=false
```

---

### 4. Redis

**Uso no sistema**:
- Cache de carrinho (4h TTL, 20KB limite)
- Cache de clima (1h TTL)
- Locks distribuídos para schedulers
- Fila de tracking

**Se Redis não disponível**:
- Carrinho: fallback para Supabase (mais lento)
- Tracking: fallback para memória (perigoso)
- Locks: scheduler pode executar duplicado

**Opções de Redis**:
| Serviço | Preço | Free Tier |
|---------|-------|-----------|
| Render Redis | $7/mês | Não |
| Upstash | Pay-as-you-go | 10K cmd/dia |
| Railway | $5/mês | 500MB |

---

## APIs Externas e Custos

### Asaas (Pagamentos)
```
Tipo: Por transação
Custo: 2.99% + R$0.49 (cartão) / R$1.99 (PIX)
Rate Limit: Não documentado no código
Cache: Nenhum
```

### Open-Meteo (Clima)
```
Tipo: Gratuito
Custo: $0
Rate Limit: 10.000 req/dia (free)
Cache: 1 hora em Redis
```

### Supabase (Database)
```
Tipo: Por projeto
Custo Free: 500MB database, 2GB bandwidth
Limite: 50 concurrent connections
```

### Mercado Livre (Marketplace)
```
Tipo: OAuth2
Custo: Comissão por venda (11%)
Rate Limit: Varia por endpoint
Cache: Nenhum
```

---

## Configurações por Tier

### Para Render Free Tier

```env
# Desabilitar features pesadas
AUTO_CLEANUP_ENABLED=false
PDF_GENERATION_ENABLED=false  # Se implementado

# Otimizar tracking
TRACKING_INTERVAL_MS=120000  # 2 minutos

# Redis obrigatório
REDIS_URL_SERVER_PRIMARY=redis://seu-redis-upstash

# Supabase
SUPABASE_MONITORING_MAX_CONCURRENT=10  # Reduzir de 20
```

### Para Render Pro

```env
# Pode habilitar tudo
AUTO_CLEANUP_ENABLED=true

# Tracking normal
TRACKING_INTERVAL_MS=30000

# Limite padrão
SUPABASE_MONITORING_MAX_CONCURRENT=20
```

---

## Monitoramento

### Endpoint de Métricas
```
GET /metrics
```

Métricas disponíveis:
- `http_requests_total` - Total de requisições por rota
- `http_request_duration_ms` - Latência por rota
- `tracking_events_total` - Eventos de tracking
- `tracking_queue_size` - Tamanho da fila

### Health Check
```
GET /health
```

### Verificar Memória (Node.js)
```javascript
const used = process.memoryUsage();
console.log({
  heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
  heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
  rss: Math.round(used.rss / 1024 / 1024) + ' MB'
});
```

---

## Quando Migrar para Pro?

### Sinais de que precisa migrar:

1. **Cold starts frequentes** - Usuários reclamando de lentidão
2. **Crashes por memória** - Logs mostrando OOM kills
3. **Jobs não executando** - Scheduler não roda por sleep
4. **PDFs necessários** - Funcionalidade crítica para o negócio
5. **Tráfego consistente** - >100 req/dia que acorda o servidor

### Estimativa de custos mensais:

| Serviço | Free | Pro |
|---------|------|-----|
| Render Backend | $0 | $7 |
| Redis (Upstash) | $0 | ~$1-5 |
| Supabase | $0 | $0 (free tier) |
| **Total** | **$0** | **$8-12** |

---

## Score de Compatibilidade

| Cenário | Score | Recomendação |
|---------|-------|--------------|
| Free + PDF habilitado | 3/10 | Não viável |
| Free + PDF desabilitado | 6/10 | Viável com cuidado |
| Free + PDF + schedulers off | 7/10 | Viável |
| Pro | 9/10 | Recomendado |

---

## Decisão Final

### Use Free Tier se:
- Projeto em desenvolvimento/testes
- Baixo tráfego (<50 req/dia)
- Pode tolerar cold starts de 30s
- Não precisa de geração de PDF
- Tem Redis externo (Upstash free)

### Use Pro ($7/mês) se:
- Produção com usuários reais
- Precisa de resposta rápida sempre
- Gera PDFs (recibos, etiquetas)
- Jobs de cleanup são importantes
- Quer paz de espírito

---

*Última atualização: Janeiro 2026*
