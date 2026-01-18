## Escopo (O que vamos atacar)
- Reduzir consumo do Supabase (requisições + egress) para ficar <50% mesmo em testes intensivos.
- Revisar/otimizar a lógica de tracking/pixel (básico + clima) para reduzir memória e evitar dados inúteis.
- Entregar: análise, proposta, migração, testes de performance e monitoramento/alertas.

## Diagnóstico Inicial (Hipóteses prováveis do egress 170%)
- Queries retornando dados desnecessários (ex.: inserts com `.select()` retornando linhas inseridas).
- Requisições duplicadas por falta de cache e/ou retries implícitos.
- Cardinalidade alta de métricas e tarefas assíncronas sem backpressure causando degradação e mais chamadas.

## Plano de Trabalho
### 1) Instrumentação do Supabase (monitoramento em tempo real)
- Instrumentar o client do Supabase em `backend/src/config/supabase.ts` usando `fetch` customizado.
- Coletar métricas Prometheus com `prom-client`:
  - `supabase_requests_total{operation,table,status}`
  - `supabase_response_bytes_total{operation,table}` (com base em `content-length` ou tamanho do body)
  - `supabase_request_duration_ms{operation,table}`
- Expor essas métricas no endpoint já usado para Prometheus (onde o projeto expõe `metricsRegistry`).
- Adicionar um “orçamento” configurável (env) para estimar 80% do limite e gerar alerta.

### 2) Auditoria e otimização minuciosa das queries
- Varredura por repositórios que chamam `supabase.from(...)` e classificar por:
  - leitura pesada
  - escrita (insert/update)
  - chamadas repetitivas
- Correções de alto impacto (primeiro lote):
  - Remover `.select()` desnecessário após `insert`/`bulk insert` quando o retorno não é usado.
  - Garantir `select` com colunas mínimas (evitar `*`).
  - Consolidar queries repetidas no mesmo request (ex.: buscar 2x o mesmo dado).

### 3) Cache eficiente (reduzir chamadas e egress)
- Implementar cache read-through em Redis (com fallback seguro quando Redis não estiver disponível), seguindo o padrão já usado em `weather.service.ts`.
- Definir chaves e TTL por domínio:
  - catálogos (produtos, coleções, assets): TTL maior + invalidar quando houver update/admin.
  - dados dinâmicos (carrinho, estoque): TTL curto e/ou sem cache, conforme risco.
- Estratégias para evitar thundering herd:
  - cache de “in-flight” (promise dedup) por chave.
  - stale-while-revalidate para manter latência baixa.

### 4) Rate limiting e proteção contra picos
- Manter `express-rate-limit` nos endpoints críticos (tracking já tem `trackingRateLimiter`).
- Adicionar rate limit específico para endpoints que detonam Supabase (ex.: listagens/catálogos) se necessário.
- Implementar limite de concorrência interno para chamadas ao Supabase (token bucket / fila com tamanho máximo) para evitar rajadas.

### 5) Revisão do tracking/pixel (memória + utilidade + clima)
- Reduzir risco de memória e egress:
  - Normalizar `event_type` antes de registrar `trackingPixelRequestsTotal` (evita cardinalidade infinita em métricas).
  - Implementar backpressure no caminho assíncrono do tracking quando Redis/DB estiver lento.
  - Garantir que o payload persistido seja mínimo.
- Pixel por clima (essencial e enxuto):
  - Receber clima somente com consentimento.
  - Não armazenar geo bruto (lat/lon); persistir apenas dados compactos (ex.: `weatherCode`, `tempBucket` e/ou `weatherTags`).
  - Usar `WeatherService` (já cacheado em Redis) para enrichment.

### 6) Alertas em 80% e dashboard
- Alertas (Prometheus/Grafana):
  - `supabase_response_bytes_total` e `supabase_requests_total` aproximando 80% do orçamento configurado.
  - crescimento de `process_resident_memory_bytes` e `nodejs_heap_size_used_bytes`.
  - `tracking_queue_size` e possíveis drops/overload.
- Dashboard:
  - Top endpoints/repositórios por bytes e requisições.
  - Latência por tipo de operação.

### 7) Testes de performance e critérios de sucesso
- Criar testes de performance (sem depender de produção) que:
  - simulam carga (tracking e endpoints de catálogo)
  - medem memória (`process.memoryUsage`) ao longo do tempo
  - validam redução de chamadas/bytes do Supabase vs baseline
- Critérios:
  - egress estimado <50% do limite em teste
  - memória do processo reduzida ≥50% no cenário problema
  - tracking básico e por clima funcionando

### 8) Documentação para a equipe (boas práticas)
- Atualizar um arquivo já existente (ex.: `RELATORIO_PERFORMANCE.md` ou `ARCHITECTURE.md`) com:
  - padrões de query (select mínimo, evitar select pós-insert)
  - quando usar cache e TTL
  - como ler o dashboard e o orçamento de egress
  - guidelines para tracking (payload mínimo e consentimento)

## Plano de Migração (sem quebra)
- Introduzir flags/env para ativar cache e limites gradualmente.
- Deploy em fases:
  - Fase 1: instrumentação + remoção de `.select()` desnecessário + normalização de métricas.
  - Fase 2: cache read-through + limites de concorrência.
  - Fase 3: clima enxuto no tracking.

Se você aprovar este plano, eu executo: instrumentação do Supabase, otimizações de queries (começando pelo tracking e bulk inserts), cache em Redis, rate limiting interno, testes de performance e documentação.