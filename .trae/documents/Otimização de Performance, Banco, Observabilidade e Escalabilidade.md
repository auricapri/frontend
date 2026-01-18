## Objetivo e Resultado Esperado
- Reduzir custo operacional (CPU/DB/banda e chamadas externas) mantendo ou melhorando latência, throughput e disponibilidade.
- Garantir melhoria mensurável com baseline e comparação antes/depois (P50/P95, CPU/RAM, tempo de queries, taxa de erros, volume de chamadas externas).
- SLO: 300ms por endpoint em pico; operação normal com P95 < 250ms.

## Escopo (baseado no que já existe no projeto)
- Backend Express/Bun + Supabase/Postgres + Redis (já presente).
- Frontend React/Vite (cache local já presente).
- Sem mudanças quebrando compatibilidade de API; ajustes serão retrocompatíveis (defaults, parâmetros opcionais).

## Fase 0 — Baseline Mensurável (antes de mudar código)
- Definir endpoints críticos e cenários de carga: /api/products, /api/cart (add/update), /api/orders (list/byUser), /api/logistics.
- Coletar métricas:
  - Backend: P50/P95 por rota via logs do requestLogger (já existe em backend/src/api/middleware/request-logger.middleware.ts).
  - Banco: top queries e latência no Supabase (Logs/Query Performance) + EXPLAIN (ANALYZE, BUFFERS) das queries mais lentas.
  - Recursos: CPU/RAM do processo e uso de Redis.
  - Externos: contagem de chamadas Mapbox e ViaCEP (por log/contador).
- Registrar baseline numa seção nova dentro da documentação existente (sem criar arquivo novo), para comparação.

### Baseline automatizado com Playwright (API)
- Objetivo: medir média, P50/P95/P99 e taxa de erros sob carga normal e pico 3x.
- Comando:
  - `cd auricapri && npm run test:perf`
- Saídas:
  - `auricapri/playwright-perf-results.json`
  - Relatório anexado por teste em `test-results/**/perf-endpoints-report.json`
- Critérios:
  - Normal: P95 <= 250ms e erro <= 1%.
  - Pico (3x): P95 <= 300ms e erro <= 1%.

## Fase 1 — Otimizações de “alto impacto / baixo risco” (custo e performance)
### 1) Remover I/O caro e logs não estruturados
- Remover escrita em arquivo .cursor/debug.log e console.log em hot paths (encontrado em products.routes.ts e products.repository.ts).
- Padronizar logs via Winston (backend/src/config/logger.ts) e adicionar log de “slow request” (ex.: >300ms) com rota e duração.

### 2) Tornar backend mais “stateless” para escalar horizontalmente
- Evitar dependências de filesystem local em produção:
  - Ajustar logger para privilegiar stdout em produção (file transports opcionais), adequado para múltiplas instâncias.
- Scheduler:
  - Hoje o scheduler inicia no boot (backend/src/services/scheduler.service.ts). Em escala horizontal, isso roda em todas as instâncias.
  - Implementar proteção: ou habilitar scheduler em apenas 1 instância via env, ou usar lock distribuído no Redis (TTL) para garantir execução única.

### 3) Reduzir payload e leituras desnecessárias do banco
- Introduzir paginação nos endpoints de listagem (orders/products/suppliers/reviews) com defaults conservadores.
- Evitar select('*') quando possível em listas públicas (retornar campos necessários; detalhes permanecem no endpoint de detalhe).

## Fase 2 — Banco de Dados (impacto grande em latência)
- Criar/ajustar índices alinhados a WHERE + ORDER BY mais usados:
  - orders (user_id, created_at desc), orders (created_at desc)
  - payments (order_id, created_at desc)
  - cart_sessions (unique session_key), cart_sessions (expires_at)
  - supplier_reviews (supplier_id, created_at desc)
  - delivery_pickups (supplier_id) e (supplier_id, picked_up_by)
  - freight_quotes_cache: índice/unique conforme onConflict usado (origin_cep,destination_cep,weight_g,provider,service_code)
- Validar cada mudança com EXPLAIN (ANALYZE, BUFFERS) no Supabase e comparar antes/depois.

## Fase 3 — Cache Estratégico (reduzir custo e latência)
### 1) Corrigir gargalo principal no carrinho
- Hoje CartService carrega catálogo inteiro e assets inteiros a cada add/update.
- Refatorar para:
  - Buscar em lote apenas variants/estoques necessários (IN variantIds) e apenas assets correlacionados.
  - Adicionar cache em Redis para “catálogo mínimo”/assets com TTL curto (60–120s) e invalidação em operações admin.

### 2) Cache para dados estáticos
- Cachear no backend (Redis): store_config, banners, collections, size_guides (TTL 5–15min).
- Manter cache do frontend já existente; alinhar invalidation patterns com endpoints que alteram dados.

### Implementação atual (backend + frontend)
- Backend:
  - Cache Redis + HTTP Cache-Control para dados públicos (store/categories, store/banners, store/config, store/size-guides).
  - Cache Redis para CRUD lists (collections, coupons, assets) com invalidação em operações admin.
  - Endpoint agregado `GET /api/store/bootstrap` para reduzir o fan-out do frontend e estabilizar P95 sob carga.
- Frontend:
  - `useStoreData` prioriza `GET /api/store/bootstrap` e mantém fallback para chamadas legadas.

## Fase 4 — Minimizar chamadas externas (Mapbox/ViaCEP)
- GeocodingService:
  - Remover token hardcoded e exigir MAPBOX_TOKEN via env (evita vazamento e custo inesperado).
  - Substituir cache em memória por cache Redis (compartilhado entre instâncias) e adicionar rate limiting/backoff.
- LogisticsService:
  - Cachear resultado do ViaCEP (Redis TTL 24h) para evitar chamadas repetidas.
  - Padronizar logging (sem console.error).

## Fase 5 — Monitoramento contínuo e métricas (observabilidade)
- Expor métricas do backend:
  - Implementar endpoint /metrics (Prometheus) com contadores e histogramas por rota/status/latência.
  - Medir: requests_total, request_duration_ms (p95), external_calls_total, cache_hit_miss, db_call_duration (onde aplicável).
- Adicionar correlação:
  - request-id por requisição e propagação nos logs.
- Opcional (se fizer sentido): instrumentação OpenTelemetry (tracing) para ver “onde o tempo vai” (rota → serviço → Supabase).

### Dashboards e alertas (Prometheus/Grafana)
- P95 por rota (5m):
  - `histogram_quantile(0.95, sum(rate(http_request_duration_ms_bucket[5m])) by (le, route))`
- P99 por rota (5m):
  - `histogram_quantile(0.99, sum(rate(http_request_duration_ms_bucket[5m])) by (le, route))`
- Erro por rota (5m):
  - `sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (route) / sum(rate(http_requests_total[5m])) by (route)`
- Throughput (RPS):
  - `sum(rate(http_requests_total[1m]))`
- Alertas:
  - Warning (aproximação do SLO): P95 > 250ms por 10m.
  - Critical (violação de SLO): P95 > 300ms por 5m.
  - Erros: errorRate 5xx > 1% por 5m.

## Fase 6 — Código limpo, manutenível e menor complexidade ciclomática
- Aplicar refactors guiados por hotspots:
  - Rotas mais longas viram rotas finas + services.
  - Extrair funções pequenas e puras em serviços (reduz complexidade e facilita testes).
- Padronizar tratamento de erros e retornos.

## Verificação em staging (obrigatória antes de produção)
- Rodar validação existente (scripts/validate-all.sh) para build/typecheck.
- Rodar carga controlada (autocannon/k6) nos mesmos cenários do baseline.
- Comparar:
  - Latência P50/P95 por endpoint, throughput, CPU/RAM, tempo de queries (Supabase), volume de chamadas externas.

## Entregáveis
- Lista priorizada de mudanças (P0/P1/P2) com estimativa de impacto (latência/custo) e risco.
- Índices e ajustes de DB aplicados em staging com evidência via EXPLAIN.
- Melhorias implementadas no backend/frontend (cache, paginação, redução de payload, remoção de I/O caro).
- Monitoramento contínuo (métricas + logs correlacionados).
- Documentação existente atualizada com arquitetura revisada e tabela de “antes/depois”.

## Registro antes/depois
- Preencher esta tabela sempre que uma otimização for aplicada:
  - Data
  - Endpoint(s)
  - Cenário (normal/pico)
  - Antes: avg/P50/P95/P99 e erro%
  - Depois: avg/P50/P95/P99 e erro%
  - Trade-offs
  - Plano de rollback

### Resultado atual (após mudanças) — 2026-01-13 (PERF_MODE=quick)
- /api/store/bootstrap
  - Normal: P95 42.6ms, erro 0%
  - Pico 3x: P95 86.1ms, erro 0%
- /api/products
  - Normal: P95 34.7ms, erro 0%
  - Pico 3x: P95 75.0ms, erro 0%
- /api/collections
  - Normal: P95 21.1ms, erro 0%
  - Pico 3x: P95 33.1ms, erro 0%
- /api/collections/products/relations
  - Normal: P95 24.5ms, erro 0%
  - Pico 3x: P95 52.1ms, erro 0%
- /api/store/config
  - Normal: P95 28.0ms, erro 0%
  - Pico 3x: P95 40.6ms, erro 0%
- /api/coupons
  - Normal: P95 25.5ms, erro 0%
  - Pico 3x: P95 204.4ms, erro 0%
- /api/assets
  - Normal: P95 28.5ms, erro 0%
  - Pico 3x: P95 37.1ms, erro 0%
- /api/store/size-guides
  - Normal: P95 34.9ms, erro 0%
  - Pico 3x: P95 65.1ms, erro 0%

## Primeira onda de implementação (ordem sugerida)
1) Remover debug file writes/console logs em hot paths + slow request logging.
2) Fixar gargalo do carrinho (queries seletivas + cache Redis).
3) Índices do banco + EXPLAIN.
4) Cache de dados estáticos.
5) External calls: Mapbox/ViaCEP com cache Redis + token via env.
6) /metrics + request-id.
7) Refactors focados em reduzir complexidade onde houver maior ganho.
