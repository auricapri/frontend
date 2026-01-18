# Relatório de Performance - Auricapri

**Data:** Janeiro 2026  
**Versão:** 1.0.0  
**Status Geral:** ✅ **BOM** (7.5/10)

---

## 📊 Resumo Executivo

A aplicação Auricapri apresenta uma **arquitetura otimizada** com múltiplas camadas de cache, code splitting no frontend, e otimizações de banco de dados. A performance geral é **boa**, com oportunidades de melhoria em algumas áreas específicas.

### Métricas Principais

- **Frontend Bundle**: Code splitting implementado (vendor chunks separados)
- **Cache Hit Rate**: Múltiplas camadas (Redis + localStorage + Memory)
- **Database**: 69+ índices criados para otimização de queries
- **API Response Time**: Cache HTTP implementado com TTL configurável
- **Rate Limiting**: Implementado para proteção contra abuso

---

## 🎯 Frontend Performance

### ✅ Pontos Fortes

#### 1. Code Splitting e Lazy Loading
- **React.lazy()** implementado para componentes pesados:
  - `ProductDetail`
  - `CheckoutView`
  - `AdminDashboard`
  - `OrderReceipt`
  - `SharedWishlistPage`
- **Suspense** com fallbacks para melhor UX
- **Manual chunks** configurados no Vite:
  - `vendor-react` (React + ReactDOM)
  - `vendor-lucide` (Ícones)
  - `vendor-supabase` (Cliente Supabase)
  - `vendor-other` (Outras dependências)
  - `pages-main`, `pages-admin`, `pages-checkout` (Páginas separadas)
  - `components-admin`, `components-checkout`, `components-product` (Componentes por domínio)

#### 2. Build Optimizations
- **Minificação**: esbuild (mais rápido que Terser)
- **CSS Code Splitting**: Ativado
- **Compression**: Gzip e Brotli configurados
- **Sourcemaps**: Desabilitados em produção (reduz tamanho)
- **Chunk Size Warning**: 500KB (limite configurado)

#### 3. Client-Side Caching
- **CacheService** implementado com:
  - Memory cache (primeira camada)
  - localStorage (persistência)
  - TTL configurável por tipo de dado
  - Eviction automática (LRU-like)
  - Estatísticas de cache (hits/misses)

**Configurações de Cache:**
| Tipo | TTL | Persist | Max Size |
|------|-----|---------|----------|
| Produtos (Lista) | 5 min | Sim | 2 MB |
| Detalhe Produto | 10 min | Sim | 500 KB |
| Categorias | 30 min | Sim | 100 KB |
| Coleções | 15 min | Sim | 200 KB |
| Banners | 30 min | Sim | 100 KB |
| Store Config | 60 min | Sim | 50 KB |
| Cupons | 10 min | Não | 200 KB |
| Assets | 60 min | Sim | 500 KB |
| Pedidos | 2 min | Não | 500 KB |

### ⚠️ Pontos de Melhoria

1. **Bundle Size Analysis**: Não há análise automática de tamanho de bundles
2. **Image Optimization**: Não há otimização automática de imagens (WebP, lazy loading)
3. **Tree Shaking**: Pode ser melhorado (verificar imports não utilizados)
4. **Service Worker**: Não implementado para cache offline

**Recomendações:**
- Adicionar `vite-bundle-visualizer` para análise de bundles
- Implementar lazy loading de imagens
- Considerar PWA com service worker

---

## 🚀 Backend Performance

### ✅ Pontos Fortes

#### 1. Cache em Múltiplas Camadas

**Redis Dual Server:**
- Primary + Secondary Redis (distribuição de carga)
- Fallback automático entre servidores
- Hash-based distribution para cache HTTP
- Guardrails de memória:
  - Cache HTTP: max 120KB (compacta para 220KB se necessário)
  - Carrinho: max 20KB por entrada
  - Geocoding: max 40KB por entrada

**Cache HTTP Middleware:**
- Cache de respostas GET com TTL configurável
- Compressão automática (gzip) para payloads grandes
- Headers `X-Cache: HIT/MISS` para debugging
- Invalidação por prefixo

#### 2. Database Optimization

**69+ Índices Criados:**
- Índices em colunas frequentemente consultadas
- Índices compostos para queries complexas
- Índices parciais (WHERE clauses)
- GIN indexes para arrays/JSONB

**Query Optimization:**
- Seleção específica de campos (não `SELECT *`)
- Paginação implementada (`limit`, `offset`)
- Queries otimizadas com joins eficientes
- Exemplo: `ORDER_SELECT_FIELDS` evita buscar colunas inexistentes

**Índices Principais:**
- `orders`: `created_at`, `user_id`, `user_id + created_at`
- `products`: `supplier_id`, `is_active`
- `tracking_events`: `event_type`, `user_id`, `session_id`, `created_at`
- `cart_sessions`: `session_key`, `user_id`, `expires_at`
- E muitos outros...

#### 3. Rate Limiting

**Proteção Implementada:**
- **Geral**: 100 req/15min
- **Auth**: 5 req/15min (skip successful)
- **Tracking**: 100 req/min
- **Cart**: 30 req/min
- **API**: 200 req/15min

#### 4. Observabilidade

**Prometheus Metrics:**
- `http_requests_total` (contador)
- `http_request_duration_ms` (histograma)
- `tracking_pixel_requests_total`
- `tracking_events_total`
- `tracking_queue_size` (gauge)
- `tracking_processing_duration_ms`

**Buckets de Latência:**
- HTTP: [5, 10, 25, 50, 100, 150, 200, 250, 300, 500, 800, 1200, 2000, 5000]ms
- Tracking: [5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000]ms

### ⚠️ Pontos de Melhoria

1. **Connection Pooling**: Não há configuração explícita de pool para Supabase
2. **Query Timeout**: Não há timeout configurado para queries longas
3. **Database Connection Limits**: Não há monitoramento de conexões ativas
4. **Slow Query Logging**: Não implementado

**Recomendações:**
- Configurar connection pooling no Supabase client
- Implementar query timeout (ex: 30s)
- Adicionar logging de queries lentas (>1s)
- Monitorar conexões ativas do banco

---

## 💾 Database Performance

### ✅ Otimizações Implementadas

1. **Índices Estratégicos**: 69+ índices em tabelas críticas
2. **Field Selection**: Queries selecionam apenas campos necessários
3. **Pagination**: Implementada em endpoints de listagem
4. **Query Optimization**: Evita `SELECT *` e usa joins eficientes

### ⚠️ Áreas de Atenção

1. **N+1 Queries**: Verificar se há queries N+1 em loops
2. **Missing Indexes**: Algumas queries podem se beneficiar de índices adicionais
3. **Query Analysis**: Não há análise automática de planos de execução

**Recomendações:**
- Implementar análise de queries lentas
- Adicionar índices em colunas usadas em WHERE/ORDER BY
- Considerar materialized views para relatórios

---

## 📈 API Performance

### Tempos de Resposta Esperados

| Endpoint | Tipo | Sem Cache | Com Cache |
|----------|------|-----------|-----------|
| GET /products | Lista | 100-300ms | <10ms |
| GET /products/:id | Detalhe | 50-150ms | <10ms |
| GET /orders | Lista | 200-500ms | <10ms |
| GET /cart | Carrinho | 50-100ms | <10ms |
| POST /orders | Criar | 500-1000ms | N/A |

### Cache Strategy

- **Cache Hit**: Resposta em <10ms
- **Cache Miss**: Resposta normal + atualização assíncrona do cache
- **TTL**: Configurável por endpoint (60s a 3600s)

---

## 🔄 Otimizações Recentes

### ✅ Implementadas

1. **Orders Pagination**: Pedidos agora são paginados (50 por página)
2. **Lazy Loading**: Pedidos carregados apenas quando necessário
3. **Field Selection**: Apenas campos essenciais em queries de listagem
4. **Cart Persistence**: Carrinho persistido entre sessões
5. **Error Handling**: Tratamento robusto de erros evita crashes

### 🚧 Em Andamento

1. **Database Indexes**: Alguns índices podem ser adicionados
2. **Query Optimization**: Algumas queries podem ser otimizadas

---

## 📊 Métricas de Performance

### Frontend

- **First Contentful Paint (FCP)**: ~1.5s (estimado)
- **Time to Interactive (TTI)**: ~3s (estimado)
- **Bundle Size**: 
  - Vendor chunks: ~200-300KB cada (gzipped)
  - Page chunks: ~50-150KB cada (gzipped)

### Backend

- **API Response Time (p95)**: ~200-500ms (sem cache)
- **API Response Time (p95)**: <10ms (com cache)
- **Database Query Time**: ~50-200ms (média)
- **Cache Hit Rate**: ~70-80% (estimado)

---

## 🎯 Recomendações Prioritárias

### Alta Prioridade

1. **Implementar análise de bundle size**
   - Adicionar `vite-bundle-visualizer`
   - Monitorar tamanho de chunks
   - Identificar dependências grandes

2. **Otimização de imagens**
   - Lazy loading de imagens
   - Conversão para WebP
   - CDN para assets estáticos

3. **Connection pooling**
   - Configurar pool para Supabase
   - Monitorar conexões ativas

### Média Prioridade

4. **Query analysis**
   - Logging de queries lentas
   - Análise de planos de execução
   - Otimização de queries N+1

5. **Service Worker**
   - Cache offline
   - Background sync
   - Push notifications

### Baixa Prioridade

6. **Database materialized views**
   - Para relatórios complexos
   - Atualização incremental

7. **CDN para assets**
   - Cloudflare ou similar
   - Cache de imagens e estáticos

---

## 📝 Conclusão

A aplicação Auricapri apresenta **boa performance geral** com:
- ✅ Cache em múltiplas camadas
- ✅ Code splitting e lazy loading
- ✅ Otimizações de banco de dados
- ✅ Rate limiting e proteções
- ✅ Observabilidade com métricas

**Áreas de melhoria:**
- ⚠️ Análise de bundle size
- ⚠️ Otimização de imagens
- ⚠️ Connection pooling
- ⚠️ Query analysis

**Score Geral: 7.5/10** - Boa performance com espaço para otimizações adicionais.

---

## 🧮 Supabase (Egress e Boas Práticas)

### Objetivo Operacional

- Manter consumo do Supabase abaixo de 50% do limite mesmo sob testes intensivos.
- Evitar picos de requisições e retornos de payload desnecessários.

### Boas Práticas (Equipe)

- Evitar `select('*')` em endpoints de alto tráfego; selecionar apenas colunas necessárias.
- Evitar `.select()` após `insert`/`bulk insert` quando o retorno não for usado (reduz egress).
- Preferir cache read-through para leituras repetidas (catálogo, banners, categorias, config).
- Invalidar cache por versão de namespace em writes (evita scan/DEL em massa).
- Manter limites de concorrência para chamadas ao Supabase em cenários de carga.

### Monitoramento em Tempo Real

- Métricas Prometheus adicionadas:
  - `supabase_requests_total{method,table,status_code}`
  - `supabase_response_bytes_total{table}`
  - `supabase_request_duration_ms{method,table,status_code}`
  - `supabase_inflight_requests`
  - `supabase_egress_budget_usage_ratio`

### Alertas (80% do orçamento)

- Alertar quando `supabase_egress_budget_usage_ratio >= 0.8`.

### Variáveis de Ambiente

- `SUPABASE_EGRESS_BUDGET_BYTES_PER_HOUR` (0 desativa alerta por orçamento)
- `SUPABASE_ALERT_THRESHOLD_PERCENT` (padrão: 80)
- `SUPABASE_MAX_CONCURRENT_REQUESTS` (padrão: 20)
- `SUPABASE_MAX_QUEUED_REQUESTS` (padrão: 200)

---

## 🛰️ Tracking / Pixel (Essencial e Pixel por Clima)

### Diretrizes de Dados

- Persistir somente o necessário para campanha/consulta:
  - `event_type`, `session_id`, `user_id` (opcional), `productId/campaignId` (quando aplicável), `metadata.path`.
- Não persistir geolocalização bruta (lat/lon); usar apenas enriquecimento compacto para clima:
  - `weatherCode` e `tempBucket`.
- Filtrar bots por User-Agent antes de processar.

### Proteções de Performance

- Normalizar `event_type` antes de registrar métricas de pixel (evita cardinalidade infinita).
- Buffer/worker com batch para reduzir chamadas ao Supabase sob alto volume.
