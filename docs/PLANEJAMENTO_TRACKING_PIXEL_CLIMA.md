# Planejamento: Pixel de Rastreamento e Ações Baseadas em Clima

## Objetivo

Implementar sistema de rastreamento via pixel HTTP e personalização de conteúdo baseada em condições climáticas para aumentar relevância e conversão no e-commerce de moda.

---

## Parte 1: Pixel de Rastreamento

### O que fazer

#### 1.1 Criar rota de pixel (Backend)

**Arquivo**: `backend/src/api/routes/tracking.routes.ts`

- Rota `GET /api/tracking/pixel.gif` que retorna imagem 1×1 transparente
- Extrair e registrar: IP, User-Agent, query params, referer, timestamp
- Headers otimizados:
  - `Cache-Control: no-cache, no-store, must-revalidate`
  - `Content-Type: image/gif`
  - `Content-Length: 42` (tamanho exato do GIF 1×1)
  - `Connection: close` (fechar conexão imediatamente após resposta)
- Resposta assíncrona (não bloquear resposta da imagem)
- Processar log no event loop após enviar resposta (usar `setImmediate` ou `process.nextTick`)

**Parâmetros esperados na query string**:
- `event`: tipo de evento (view, click, email_open, etc.)
- `userId`: ID do usuário (opcional)
- `sessionId`: ID da sessão
- `productId`: ID do produto (opcional)
- `campaignId`: ID da campanha (opcional)
- `metadata`: JSON stringificado com dados adicionais

#### 1.2 Criar serviço de tracking (Backend)

**Arquivo**: `backend/src/services/tracking.service.ts`

- Processar eventos de forma assíncrona (não bloquear requisição)
- Validar e sanitizar dados recebidos
- **Filtro de bots e crawlers**:
  - Verificar User-Agent contra lista negra de bots conhecidos
  - Lista inclui: Googlebot, Bingbot, Yahoo, FacebookExternalHit, LinkedInBot, TwitterBot, etc.
  - Marcar evento com `is_bot: true` e não processar para analytics
  - Método: `isBotUserAgent(userAgent: string): boolean`
  
  **Lista de bots conhecidos** (configurável):
  ```typescript
  const BOT_USER_AGENTS = [
    'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider',
    'YandexBot', 'Sogou', 'Exabot', 'facebot', 'ia_archiver',
    'FacebookExternalHit', 'LinkedInBot', 'TwitterBot', 'WhatsApp',
    'Applebot', 'Pingdom', 'UptimeRobot', 'StatusCake', 'NewRelic',
    'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'Barkrowler'
  ];
  ```
- **Detecção de tipo de dispositivo**:
  - Analisar User-Agent para determinar: `mobile`, `desktop`, `tablet`
  - Armazenar em `device_type` no evento
- Enriquecer com dados de contexto (geolocalização via IP, se disponível)
- Armazenar em fila (Redis) para processamento em batch
- Integrar com sistema de métricas existente (Prometheus)

**Eventos a rastrear**:
- `page_view`: visualização de página
- `product_view`: visualização de produto
- `email_open`: abertura de e-mail
- `email_click`: clique em link de e-mail
- `cart_add`: adicionar ao carrinho
- `cart_remove`: remover do carrinho
- `checkout_start`: início de checkout
- `purchase`: compra concluída

#### 1.3 Criar repositório de eventos (Backend)

**Arquivo**: `backend/src/repositories/tracking.repository.ts`

- Tabela `tracking_events` no Supabase:
  - `id` (UUID, PK)
  - `event_type` (text)
  - `user_id` (UUID, nullable, FK para users)
  - `session_id` (text)
  - `ip_address` (inet)
  - `user_agent` (text)
  - `referer` (text, nullable)
  - `metadata` (jsonb)
  - `is_bot` (boolean, default false) - indica se é bot/crawler
  - `device_type` (text) - mobile, desktop, tablet
  - `created_at` (timestamp)
  - Índices: `event_type`, `user_id`, `session_id`, `created_at`, `is_bot`
  - **Particionamento**: tabela particionada por mês (`created_at`) para performance

- Métodos:
  - `insertEvent(event: TrackingEvent): Promise<void>`
  - `getEventsByUser(userId: string, limit: number): Promise<TrackingEvent[]>`
  - `getEventsBySession(sessionId: string): Promise<TrackingEvent[]>`
  - `getEventsByType(eventType: string, startDate: Date, endDate: Date): Promise<TrackingEvent[]>`
  - `linkSessionToUser(sessionId: string, userId: string): Promise<void>` - vincular sessão anônima a usuário

**Materialized Views para Performance**:
- Criar `tracking_events_daily_aggregate` (atualizada diariamente):
  - Agrega eventos por: `date`, `event_type`, `user_id`, `device_type`
  - Facilita queries do dashboard admin sem consultar tabela gigante
- Criar `tracking_events_hourly_aggregate` (atualizada a cada hora):
  - Para métricas em tempo real do dashboard

#### 1.4 Criar pixel 1×1 transparente (Backend)

**Arquivo**: `backend/src/assets/pixel.png` ou gerar em memória

- Imagem PNG 1×1 transparente (44 bytes)
- Alternativa: gerar GIF 1×1 em memória (menor ainda)

#### 1.5 Implementar processamento assíncrono (Backend)

**Arquivo**: `backend/src/services/tracking-queue.service.ts`

- Usar Redis como fila de eventos
- Worker que processa eventos em batch a cada N segundos
- Inserir no banco em lote (bulk insert)
- Retry automático para falhas
- Rate limiting para evitar sobrecarga
- **Filtro de bots**: não adicionar eventos de bots à fila (economiza recursos)

#### 1.6 Integrar no frontend

**Arquivo**: `auricapri/src/services/tracking.service.ts`

- Classe `TrackingService` que gera URLs de pixel
- Métodos:
  - `trackPageView(path: string, metadata?: Record<string, unknown>): void`
  - `trackProductView(productId: string, metadata?: Record<string, unknown>): void`
  - `trackEmailOpen(emailId: string, userId?: string): void`
  - `trackEmailClick(emailId: string, link: string, userId?: string): void`
  - `trackCartAdd(productId: string, variantId: string, quantity: number): void`
  - `trackPurchase(orderId: string, total: number, items: CartItem[]): void`

**Arquivo**: `auricapri/src/hooks/useTracking.ts`

- Hook React para facilitar uso:
  ```typescript
  const { trackEvent } = useTracking();
  trackEvent('product_view', { productId: '123' });
  ```

**Integrações**:
- Adicionar pixel em templates de e-mail (HTML)
- Adicionar tracking em componentes de produto
- Adicionar tracking em fluxo de checkout

#### 1.7 Métricas e observabilidade

- Adicionar métricas Prometheus:
  - `tracking_events_total{event_type}`: contador de eventos por tipo
  - `tracking_pixel_requests_total`: total de requisições de pixel
  - `tracking_queue_size`: tamanho da fila Redis
  - `tracking_processing_duration_ms`: tempo de processamento

- Logs estruturados via Winston:
  - Eventos importantes (erros, rate limits)
  - Performance (tempo de processamento)

---

## Implementação (Status Atual)

### Backend

#### Endpoints

- `GET /api/tracking/pixel.gif`
  - Retorna GIF 1×1 com headers `no-cache` e responde imediatamente.
  - Processamento do evento ocorre de forma assíncrona após o envio da imagem.
  - Parâmetros suportados:
    - `event` (string): tipo do evento.
    - `userId` (string, opcional)
    - `sessionId` (string, opcional; se ausente, é gerado)
    - `productId` (string, opcional)
    - `campaignId` (string, opcional)
    - `metadata` (JSON string, opcional; limite de 4KB)

- `POST /api/tracking/event`
  - Endpoint para envio confiável (via `sendBeacon`/`fetch`) com payload JSON.
  - Responde `204` e processa assíncrono.
  - Corpo suportado:
    - `event` ou `event_type` (string)
    - `userId` (string, opcional)
    - `sessionId` (string, opcional)
    - `productId` (string, opcional)
    - `campaignId` (string, opcional)
    - `metadata` (object, opcional)
    - `consent` (object, opcional): `{ analytics: boolean, geolocation: boolean }`

#### Fila e Persistência
- Eventos são enfileirados no Redis (`tracking:events:v1`) quando disponível.
- Um worker em batch faz `bulk insert` no Supabase.
- Se Redis não estiver configurado, o evento é inserido diretamente.

#### Clima (Enriquecimento)
- `GET /api/weather/current?lat={lat}&lon={lon}`
  - Integração com Open-Meteo (sem API key) com cache em Redis (TTL 1h).
- O tracking enriquece eventos com clima apenas quando:
  - `metadata.consent.geolocation === true`
  - `metadata.geo` contém `{ lat, lon }`

#### LGPD / Privacidade
- Bot filter por User-Agent: eventos marcados como bot não entram na fila.
- IP é pseudonimizado por padrão:
  - `ip_hash` sempre que IP estiver disponível.
  - `ip_address` só é armazenado se `TRACKING_STORE_RAW_IP=true`.
- Geolocalização só é coletada/enviada se o consentimento permitir.

### Frontend (Web)

#### Serviço e Sessão
- Serviço: `auricapri/src/services/tracking.service.ts`
- Hook: `auricapri/src/hooks/useTracking.ts`
- `sessionId` persistido em `localStorage` (`tracking_session_id`).
- Fila offline em `localStorage` (`tracking_event_queue`) com flush automático quando online.

#### Integrações Aplicadas
- `page_view`: ao mudar de view (`App.tsx`).
- `product_view`: ao abrir página de produto.
- `cart_add` / `cart_remove`: no fluxo de carrinho.
- `checkout_start` e `purchase`: no início de checkout e após criação do pedido.

#### Coleta de Geo + Clima
- Consentimento padrão: `{ analytics: true, geolocation: false }`.
- Se `geolocation=true`, o frontend solicita `navigator.geolocation` e consulta clima via `/api/weather/current`.
- Eventos enriquecidos são enviados via `sendBeacon` quando possível.

#### Testes Cross-browser
- O suite Playwright executa Chromium/WebKit + Mobile Chrome/Mobile Safari por padrão. O projeto Firefox é opcional via `PLAYWRIGHT_ENABLE_FIREFOX=true` (pode exigir permissões de sandbox no ambiente).


## Parte 2: Rastreamento e Ações Baseadas em Clima

### O que fazer

#### 2.1 Integrar API de clima (Backend)

**Arquivo**: `backend/src/services/weather.service.ts`

- Integrar com OpenWeatherMap API (ou alternativa)
- Cachear resultados no Redis (TTL: 1 hora por localização)
- Métodos:
  - `getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData>`
  - `getWeatherByIP(ipAddress: string): Promise<WeatherData>`
  - `getWeatherByPostalCode(postalCode: string, country: string): Promise<WeatherData>`

**Dados de clima necessários**:
- Temperatura atual
- Condição (sunny, cloudy, rainy, snowy, etc.)
- Umidade
- Previsão para próximas horas (opcional)

**Variável de ambiente**: `OPENWEATHER_API_KEY`

#### 2.2 Criar repositório de dados climáticos (Backend)

**Arquivo**: `backend/src/repositories/weather.repository.ts`

- Tabela `weather_snapshots` no Supabase:
  - `id` (UUID, PK)
  - `location` (text) - cidade/região
  - `latitude` (float)
  - `longitude` (float)
  - `temperature` (float)
  - `condition` (text)
  - `humidity` (float)
  - `snapshot_date` (timestamp)
  - Índices: `location`, `snapshot_date`

- Métodos:
  - `saveSnapshot(snapshot: WeatherSnapshot): Promise<void>`
  - `getLatestByLocation(location: string): Promise<WeatherSnapshot | null>`
  - `getHistoricalData(location: string, days: number): Promise<WeatherSnapshot[]>`

#### 2.3 Criar serviço de personalização por clima (Backend)

**Arquivo**: `backend/src/services/weather-personalization.service.ts`

- **Matriz de Recomendação Clima x Produto** (configurável via tabela `weather_rules`):

| Condição Climática | Ação Sugerida | Tag de Campanha | Categorias/Produtos |
|-------------------|---------------|-----------------|---------------------|
| Temp < 15°C | Banner de Casacos/Lã | `heavy_winter` | Casacos, Blusas de lã, Acessórios de inverno |
| Temp 15-20°C | Roupas intermediárias | `light_winter` | Cardigans, Jaquetas leves |
| Chuva (Rain) | Calçados fechados/Acessórios | `rainy_day` | Botas, Impermeáveis, Guarda-chuvas |
| Temp > 28°C | Vestidos/Moda Praia | `summer_vibe` | Vestidos, Biquínis, Roupas leves, Chapéus |
| Temp 25-28°C | Roupas frescas | `warm_weather` | Camisetas, Shorts, Sandálias |
| Noite + Frio | Pijamas/Linha Home | `cozy_night` | Pijamas, Roupões, Meias |
| Sol + Calor | Proteção solar | `sunny_day` | Óculos, Chapéus, Protetor solar |

- Métodos:
  - `getRecommendedCategories(weather: WeatherData): string[]`
  - `getRecommendedProducts(weather: WeatherData, limit: number): Promise<Product[]>`
  - `getPersonalizedBanner(weather: WeatherData): Banner | null`
  - `getWeatherTags(weather: WeatherData): string[]` - retorna tags baseadas em clima

#### 2.4 Criar endpoint de recomendações por clima (Backend)

**Arquivo**: `backend/src/api/routes/weather.routes.ts`

- `GET /api/weather/recommendations?ip={ip}` ou `?postalCode={code}`
- Retorna: produtos recomendados, categorias, banner personalizado
- Cache: 1 hora por localização

#### 2.5 Integrar no frontend

**Arquivo**: `auricapri/src/services/weather.service.ts`

- Classe `WeatherService`:
  - `getRecommendations(ipOrPostalCode: string): Promise<WeatherRecommendations>`
  - `getCurrentWeather(location: string): Promise<WeatherData>`

**Arquivo**: `auricapri/src/hooks/useWeatherRecommendations.ts`

- Hook React:
  ```typescript
  const { recommendations, isLoading } = useWeatherRecommendations();
  ```

**Componentes**:
- `WeatherPersonalizedBanner`: banner que muda baseado no clima
- `WeatherProductRecommendations`: seção de produtos recomendados por clima
- Integrar na home page e páginas de produto

#### 2.6 Campanhas automáticas por clima (Backend)

**Arquivo**: `backend/src/services/weather-campaign.service.ts`

- Sistema de regras configuráveis:
  - Quando temperatura < X: disparar campanha de casacos
  - Quando chuva detectada: disparar campanha de impermeáveis
  - Quando temperatura > Y: disparar campanha de verão

- Integração com sistema de notificações existente
- Agendar envios de e-mail/push baseados em clima

#### 2.7 Analytics de clima (Backend)

**Arquivo**: `backend/src/services/weather-analytics.service.ts`

- Correlacionar eventos de tracking com dados climáticos
- Métricas:
  - Taxa de conversão por condição climática
  - Produtos mais vendidos por temperatura
  - Efetividade de campanhas baseadas em clima

- Endpoint: `GET /api/weather/analytics?startDate={date}&endDate={date}`

---

## Parte 3: Dashboard de Marketing - Visão por Usuário e Campanhas

### O que fazer

#### 3.1 Sistema de Tags para Campanhas (Backend)

**Arquivo**: `backend/src/repositories/campaigns.repository.ts`

- Tabela `campaigns` no Supabase:
  - `id` (UUID, PK)
  - `name` (text) - nome da campanha
  - `description` (text, nullable)
  - `tags` (text[]) - array de tags (ex: ['winter', 'casacos', 'premium'])
  - `target_segments` (jsonb) - critérios de segmentação
  - `weather_conditions` (jsonb, nullable) - condições climáticas que disparam a campanha
  - `is_active` (boolean)
  - `start_date` (timestamp, nullable)
  - `end_date` (timestamp, nullable)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
  - Índices: `tags`, `is_active`, `start_date`, `end_date`

- Tabela `campaign_tags` (opcional, para normalização):
  - `id` (UUID, PK)
  - `campaign_id` (UUID, FK para campaigns)
  - `tag` (text)
  - Índice: `campaign_id`, `tag`

- Métodos:
  - `createCampaign(campaign: Campaign): Promise<Campaign>`
  - `updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign>`
  - `getCampaignsByTags(tags: string[]): Promise<Campaign[]>`
  - `getActiveCampaigns(): Promise<Campaign[]>`
  - `getCampaignById(id: string): Promise<Campaign | null>`

#### 3.2 Sistema de Perfil de Usuário com Tags (Backend)

**Arquivo**: `backend/src/services/user-profile.service.ts`

- **Scheduler para manutenção automática**:
  - Executar `applyTagDecay()` semanalmente (domingo 2h)
  - Executar `refresh_tracking_aggregates()` diariamente (meia-noite)
  - Executar `calculateUserTags()` para usuários ativos (diariamente)

- Enriquecer perfil do usuário com tags baseadas em:
  - Histórico de compras (categorias mais compradas)
  - Eventos de tracking (produtos visualizados, clicados)
  - Dados climáticos da localização do usuário
  - Comportamento de navegação
  - Preferências explícitas (se houver)

**Sistema de Tag Decay (Decaimento)**:
- Evitar que usuário fique "preso" a perfil antigo
- Tags não atualizadas há 90 dias perdem 20% do score a cada semana
- Decaimento exponencial: `new_score = old_score * (0.8 ^ weeks_since_update)`
- Tags com score < 0.1 são removidas automaticamente
- Método: `applyTagDecay(userId: string): Promise<void>` (executado semanalmente)

**Cold Start (Usuário Novo)**:
- Para usuários sem histórico, usar geolocalização por IP
- Criar tags temporárias de contexto imediatamente:
  - `context_hot_region`: se temperatura média > 25°C
  - `context_cold_region`: se temperatura média < 15°C
  - `context_rainy_region`: se chove frequentemente
- Tags de contexto têm score inicial 0.3 e são substituídas por tags reais quando houver dados

**Cálculo automático de tags** (executado periodicamente ou sob demanda):

- **Tags baseadas em compras**:
  - `winter_lover`: se comprou > 3 produtos de inverno nos últimos 6 meses
  - `summer_lover`: se comprou > 3 produtos de verão nos últimos 6 meses
  - `premium_buyer`: se ticket médio > R$ 500
  - `frequent_buyer`: se comprou > 5 vezes no último ano
  - `casual_style`: se > 60% das compras são categorias casuais
  - `formal_style`: se > 60% das compras são categorias formais

- **Tags baseadas em tracking**:
  - `high_engagement`: se visualizou > 20 produtos na última semana
  - `cart_abandoner`: se abandonou carrinho > 3 vezes
  - `browser_only`: se nunca comprou mas navega frequentemente

- **Tags baseadas em clima**:
  - `cold_weather_location`: se temperatura média da localização < 15°C
  - `hot_weather_location`: se temperatura média da localização > 25°C
  - `rainy_location`: se chove frequentemente na localização

- **Score das tags** (0-1):
  - Calculado baseado em frequência, recência e intensidade
  - Tags mais recentes têm peso maior
  - Tags baseadas em compras têm peso maior que tags de tracking

- Tabela `user_tags` no Supabase:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK para users)
  - `tag` (text) - tag do usuário (ex: 'winter_lover', 'casual_style', 'premium_buyer')
  - `score` (float) - relevância da tag (0-1)
  - `source` (text) - origem da tag ('purchase', 'tracking', 'weather', 'explicit', 'context')
  - `last_seen_at` (timestamp) - última vez que a tag foi atualizada (para decay)
  - `interaction_count` (integer) - contador de interações que geraram/atualizaram a tag
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
  - Índices: `user_id`, `tag`, `score`, `last_seen_at`

- Métodos:
  - `calculateUserTags(userId: string): Promise<UserTag[]>`
  - `updateUserTags(userId: string): Promise<void>`
  - `getUserTags(userId: string): Promise<UserTag[]>`
  - `getUsersByTag(tag: string, limit: number): Promise<UserProfile[]>`
  - `applyTagDecay(userId: string): Promise<void>` - aplicar decaimento de tags antigas
  - `createContextTagsForNewUser(sessionId: string, ipAddress: string): Promise<void>` - cold start

#### 3.3 Serviço de Recomendação de Campanhas (Backend)

**Arquivo**: `backend/src/services/campaign-recommendation.service.ts`

- Algoritmo de matching entre tags de usuário e tags de campanha
- Score de relevância baseado em:
  - Overlap de tags (tags em comum)
  - Score das tags do usuário
  - Histórico de interação com campanhas similares
  - Condições climáticas atuais (se aplicável)
  - Status da campanha (ativa, dentro do período)

- Métodos:
  - `getRecommendedCampaignsForUser(userId: string, limit?: number): Promise<CampaignRecommendation[]>`
  - `getCampaignScore(userId: string, campaignId: string): Promise<number>`
  - `getTopCampaignsForUser(userId: string, topN: number): Promise<Campaign[]>`

**Tipo `CampaignRecommendation`**:
```typescript
interface CampaignRecommendation {
  campaign: Campaign;
  score: number;
  matchingTags: string[];
  reasons: string[]; // explicações do porquê foi recomendada
}
```

#### 3.4 Endpoints de API para Admin (Backend)

**Arquivo**: `backend/src/api/routes/marketing.routes.ts`

- `GET /api/marketing/campaigns`: listar todas as campanhas
- `POST /api/marketing/campaigns`: criar campanha
- `PUT /api/marketing/campaigns/:id`: atualizar campanha
- `DELETE /api/marketing/campaigns/:id`: deletar campanha
- `GET /api/marketing/campaigns/:id/recommendations`: usuários recomendados para a campanha
- `GET /api/marketing/users/:userId/campaigns`: campanhas recomendadas para o usuário
- `GET /api/marketing/users/:userId/tags`: tags do usuário
- `GET /api/marketing/users/:userId/profile`: perfil completo do usuário para marketing
- `GET /api/marketing/analytics/campaigns/:id`: analytics da campanha
- `GET /api/marketing/analytics/users/:userId`: analytics do usuário

**Tipo `UserMarketingProfile`**:
```typescript
interface UserMarketingProfile {
  userId: string;
  user: UserProfile;
  tags: UserTag[];
  recommendedCampaigns: CampaignRecommendation[];
  purchaseHistory: {
    totalOrders: number;
    totalSpent: number;
    favoriteCategories: string[];
    lastPurchaseDate: string | null;
  };
  trackingData: {
    totalPageViews: number;
    totalProductViews: number;
    mostViewedCategories: string[];
    lastActivityDate: string;
  };
  weatherContext: {
    currentLocation: string;
    currentWeather: WeatherData | null;
    weatherBasedRecommendations: string[];
  };
}
```

#### 3.5 Componente AdminMarketing Expandido (Frontend)

**Arquivo**: `auricapri/src/components/admin/AdminMarketing.tsx`

- Expandir componente existente com novas abas:
  1. **Banners** (já existe)
  2. **Campanhas** - gestão de campanhas e tags
  3. **Usuários** - visão por usuário com recomendações
  4. **Analytics** - métricas de campanhas

**Aba Campanhas**:
- Lista de campanhas com filtros (ativas, tags, período)
- Criar/editar campanha com:
  - Nome, descrição
  - Tags (input com autocomplete/sugestões)
  - Segmentação (critérios de público-alvo)
  - Condições climáticas (opcional)
  - Período de vigência
- Visualização de performance (taxa de abertura, cliques, conversões)

**Aba Usuários**:
- Busca de usuário (por email, ID, nome)
- Visualização do perfil de marketing do usuário:
  - Tags do usuário com scores
  - Campanhas recomendadas (ordenadas por score)
  - Histórico de interações com campanhas
  - Dados de compra e navegação
  - Contexto climático atual
- Ação: "Enviar campanha" - disparar campanha específica para o usuário

**Aba Analytics**:
- Dashboard com métricas agregadas:
  - Campanhas mais efetivas
  - Tags mais populares
  - Taxa de conversão por tipo de campanha
  - Distribuição de usuários por tags
  - Performance de campanhas baseadas em clima

#### 3.6 Componentes Auxiliares (Frontend)

**Arquivo**: `auricapri/src/components/admin/AdminCampaignEditor.tsx`

- Modal/editor para criar/editar campanha
- Campos:
  - Informações básicas (nome, descrição)
  - Tags (multi-select com sugestões)
  - Segmentação (checkboxes: idade, localização, histórico de compra, etc.)
  - Condições climáticas (temperatura, condição, umidade)
  - Período de vigência
  - Status (ativa/inativa)

**Arquivo**: `auricapri/src/components/admin/AdminUserMarketingProfile.tsx`

- Componente que exibe perfil completo do usuário
- Seções:
  - Informações básicas
  - Tags e scores (gráfico de barras)
  - Campanhas recomendadas (cards com score e razões)
  - Histórico de compras
  - Eventos de tracking recentes
  - Contexto climático

**Arquivo**: `auricapri/src/components/admin/AdminCampaignRecommendations.tsx`

- Lista de usuários recomendados para uma campanha específica
- Filtros: score mínimo, tags específicas, localização
- Ações: enviar campanha para usuários selecionados

#### 3.7 Serviços Frontend

**Arquivo**: `auricapri/src/api/marketing.api.ts`

- Classe `MarketingApi`:
  - `getCampaigns(): Promise<Campaign[]>`
  - `createCampaign(campaign: Campaign): Promise<Campaign>`
  - `updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign>`
  - `deleteCampaign(id: string): Promise<void>`
  - `getUserMarketingProfile(userId: string): Promise<UserMarketingProfile>`
  - `getRecommendedCampaignsForUser(userId: string): Promise<CampaignRecommendation[]>`
  - `getUsersForCampaign(campaignId: string, filters?: CampaignUserFilters): Promise<UserProfile[]>`
  - `getCampaignAnalytics(campaignId: string, startDate?: string, endDate?: string): Promise<CampaignAnalytics>`
  - `sendCampaignToUser(campaignId: string, userId: string): Promise<void>`

**Arquivo**: `auricapri/src/services/marketing.service.ts`

- Lógica de negócio no frontend:
  - Validação de campanhas
  - Formatação de dados para exibição
  - Cálculos de scores (se necessário no frontend)

#### 3.8 Integração com Sistema de Notificações

- Quando admin seleciona "Enviar campanha" para usuário:
  - Criar notificação (e-mail ou push)
  - Registrar evento de tracking (`campaign_sent`)
  - Agendar envio (se aplicável)

- Tracking de interações com campanhas:
  - `campaign_sent`: campanha enviada
  - `campaign_opened`: campanha aberta (via pixel)
  - `campaign_clicked`: clique em link da campanha
  - `campaign_converted`: conversão após interação com campanha

#### 3.9 Sistema Anônimo-para-Conhecido

**Arquivo**: `backend/src/services/session-linking.service.ts`

- Rastrear eventos por `sessionId` antes do login
- Quando usuário faz login, vincular retroativamente:
  - Buscar todos os eventos com `sessionId` e `user_id IS NULL`
  - Atualizar `user_id` para o ID do usuário autenticado
  - Recalcular tags do usuário com histórico completo
  - Vincular carrinho anônimo (já existe em `CartService.mergeCarts`)
  - Criar tags de contexto se for primeiro acesso

- Métodos:
  - `linkSessionToUser(sessionId: string, userId: string): Promise<void>`
  - `getAnonymousSessionEvents(sessionId: string): Promise<TrackingEvent[]>`
  - `mergeAnonymousProfile(sessionId: string, userId: string): Promise<void>`
  - `linkAnonymousEventsToUser(sessionId: string, userId: string): Promise<number>` - retorna quantidade de eventos vinculados

- Executar automaticamente após login bem-sucedido
- Integrar com middleware de autenticação existente

#### 3.10 Sugestões de UX para o Admin

**Preview de Público em Tempo Real**:
- Ao criar/editar campanha com tags, mostrar contador dinâmico:
  - "Essa campanha atingirá **1.240 usuários**"
  - Atualizar em tempo real conforme tags são adicionadas/removidas
  - Mostrar breakdown: "850 com tag `premium_buyer`, 390 com tag `winter_lover`"

**A/B Test Integrado**:
- Rastrear origem da compra:
  - `source: 'weather_recommendation'` - veio de recomendação climática
  - `source: 'campaign'` - veio de campanha
  - `source: 'organic'` - navegação orgânica
- Dashboard mostra ROI por fonte:
  - "Recomendações climáticas: 12% de conversão vs 3% orgânico"
  - "Campanha X: R$ 45.000 em vendas, ROI de 320%"

**Filtros Avançados no Dashboard**:
- Filtrar usuários por múltiplas tags (AND/OR)
- Filtrar por localização geográfica
- Filtrar por comportamento (última compra, ticket médio, etc.)
- Exportar lista de usuários para campanha externa

#### 3.11 Fluxo de Uso do Admin

**Cenário 1: Visualizar campanhas recomendadas para um usuário**

1. Admin acessa aba "Marketing" → "Usuários"
2. Busca usuário por email/ID/nome
3. Sistema exibe:
   - **Tags do usuário** (ex: `winter_lover: 0.85`, `premium_buyer: 0.72`, `casual_style: 0.45`)
   - **Campanhas recomendadas** ordenadas por score:
     - Campanha "Casacos de Inverno" (score: 0.92)
       - Tags em comum: `winter_lover`, `premium_buyer`
       - Razões: "Usuário comprou 3 casacos no último inverno", "Temperatura atual: 12°C"
     - Campanha "Coleção Premium" (score: 0.78)
       - Tags em comum: `premium_buyer`
       - Razões: "Ticket médio acima de R$ 500", "Comprou produtos premium 5 vezes"
4. Admin pode clicar em "Enviar campanha" para disparar notificação

**Cenário 2: Visualizar usuários recomendados para uma campanha**

1. Admin acessa aba "Marketing" → "Campanhas"
2. Seleciona campanha (ex: "Casacos de Inverno")
3. Clica em "Ver usuários recomendados"
4. Sistema exibe lista de usuários com:
   - Score de match com a campanha
   - Tags em comum
   - Última interação
5. Admin pode selecionar múltiplos usuários e enviar campanha em lote

**Cenário 3: Criar campanha e ver recomendações automáticas**

1. Admin cria nova campanha com tags: `winter`, `casacos`, `premium`
2. Sistema automaticamente calcula usuários recomendados
3. Admin visualiza preview de quantos usuários seriam atingidos
4. Ao salvar, sistema atualiza recomendações para todos os usuários

---

## Ordem de Implementação

### Fase 1: Pixel Básico (Semana 1)
1. Criar rota de pixel (`/api/tracking/pixel.gif`)
2. Criar serviço de tracking básico
3. Criar repositório e tabela `tracking_events`
4. Integrar no frontend (tracking de page views)

### Fase 2: Tracking Completo (Semana 2)
1. Implementar fila Redis para processamento assíncrono
2. Adicionar todos os tipos de eventos
3. Integrar tracking em componentes críticos (produto, carrinho, checkout)
4. Adicionar métricas Prometheus

### Fase 3: Clima Básico (Semana 3)
1. Integrar API de clima
2. Criar serviço de personalização por clima
3. Criar endpoint de recomendações
4. Integrar no frontend (banner personalizado)

### Fase 4: Clima Avançado (Semana 4)
1. Implementar campanhas automáticas
2. Criar analytics de clima
3. Otimizar cache e performance
4. Testes e ajustes

### Fase 5: Dashboard de Marketing (Semana 5-6)
1. Criar sistema de tags e campanhas (backend)
2. Implementar cálculo de tags de usuário com decay
3. Implementar cold start para usuários novos
4. Criar serviço de recomendação de campanhas
5. Desenvolver endpoints de API para admin
6. Expandir componente AdminMarketing (frontend)
7. Criar componentes auxiliares (editor, perfil de usuário)
8. Implementar preview de público em tempo real
9. Integrar com sistema de notificações
10. Testes e refinamentos

### Fase 6: Otimizações e Robustez (Semana 7)
1. Implementar filtro de bots no tracking
2. Configurar particionamento de tabelas
3. Criar materialized views e funções de refresh
4. Implementar sistema anônimo-para-conhecido
5. Configurar schedulers de manutenção automática
6. Adicionar A/B testing integrado
7. Otimizar performance de queries
8. Testes de carga e ajustes finais

---

## Considerações Técnicas

### Performance
- Pixel deve responder em < 50ms
- Processamento de eventos em background (não bloquear requisição)
- Cache agressivo para dados de clima (1 hora)
- Batch processing de eventos (inserir 100-1000 por vez)

### Privacidade e LGPD
- Não armazenar IP completo (hash ou truncar últimos octetos)
- Respeitar consentimento do usuário (verificar `user_consents`)
- Permitir opt-out de tracking
- Dados anonimizados após N dias (política de retenção)

### Escalabilidade
- Fila Redis permite processamento distribuído
- Tabela `tracking_events` com particionamento por data (se necessário)
- Índices otimizados para queries frequentes
- Rate limiting para evitar abuso

### Monitoramento
- Alertas para:
  - Fila Redis > 10.000 eventos
  - Taxa de erro > 1%
  - Latência de pixel > 100ms
  - Taxa de bots > 30% (pode indicar problema)
  - Materialized views não atualizadas há > 2 horas
- Dashboard de métricas (Grafana ou similar)

### Manutenção Automática
- **Scheduler de tarefas** (integrar com `scheduler.service.ts` existente):
  - Refresh de materialized views: diariamente (meia-noite)
  - Aplicar tag decay: semanalmente (domingo 2h)
  - Calcular tags de usuários ativos: diariamente (3h)
  - Limpar eventos antigos (> 90 dias): mensalmente
  - Criar novas partições de tabela: mensalmente (1º do mês)

---

## Dependências Externas

### APIs Necessárias
- **OpenWeatherMap API**: `https://openweathermap.org/api`
  - Plano gratuito: 60 calls/minuto
  - Alternativas: WeatherAPI, AccuWeather

### Bibliotecas NPM
- `ioredis`: cliente Redis (já pode estar em uso)
- `axios` ou `node-fetch`: HTTP client para APIs de clima
- `sharp` (opcional): gerar pixel em memória se necessário

---

## Estrutura de Arquivos

```
backend/src/
├── api/routes/
│   ├── tracking.routes.ts          # Rotas de pixel
│   ├── weather.routes.ts           # Rotas de clima
│   └── marketing.routes.ts         # Rotas de marketing/admin
├── services/
│   ├── tracking.service.ts         # Lógica de tracking
│   ├── tracking-queue.service.ts   # Fila de eventos
│   ├── weather.service.ts          # Integração API clima
│   ├── weather-personalization.service.ts
│   ├── weather-campaign.service.ts
│   ├── weather-analytics.service.ts
│   ├── user-profile.service.ts     # Cálculo de tags de usuário
│   ├── campaign-recommendation.service.ts  # Recomendações de campanhas
│   └── session-linking.service.ts  # Sistema anônimo-para-conhecido
├── repositories/
│   ├── tracking.repository.ts      # Acesso a tracking_events
│   ├── weather.repository.ts       # Acesso a weather_snapshots
│   └── campaigns.repository.ts     # Acesso a campaigns e user_tags
└── types/
    ├── tracking.types.ts           # Tipos de eventos
    ├── weather.types.ts           # Tipos de clima
    └── marketing.types.ts         # Tipos de campanhas e marketing

auricapri/src/
├── services/
│   ├── tracking.service.ts         # Cliente de tracking
│   ├── weather.service.ts          # Cliente de clima
│   └── marketing.service.ts        # Lógica de marketing (frontend)
├── api/
│   └── marketing.api.ts           # API client de marketing
├── hooks/
│   ├── useTracking.ts
│   ├── useWeatherRecommendations.ts
│   └── useMarketing.ts            # Hook para dados de marketing
└── components/
    ├── admin/
    │   ├── AdminMarketing.tsx     # Componente principal (expandido)
    │   ├── AdminCampaignEditor.tsx
    │   ├── AdminUserMarketingProfile.tsx
    │   └── AdminCampaignRecommendations.tsx
    ├── WeatherPersonalizedBanner.tsx
    └── WeatherProductRecommendations.tsx
```

---

## Migrations Necessárias

### Migration 1: tracking_events (com particionamento)
```sql
-- Tabela principal (partição)
CREATE TABLE tracking_events (
  id UUID DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  metadata JSONB DEFAULT '{}',
  is_bot BOOLEAN DEFAULT false,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partições mensais (exemplo para 2024-2025)
CREATE TABLE tracking_events_2024_01 PARTITION OF tracking_events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE tracking_events_2024_02 PARTITION OF tracking_events
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... criar partições para cada mês

-- Índices locais em cada partição
CREATE INDEX idx_tracking_events_event_type ON tracking_events(event_type);
CREATE INDEX idx_tracking_events_user_id ON tracking_events(user_id);
CREATE INDEX idx_tracking_events_session_id ON tracking_events(session_id);
CREATE INDEX idx_tracking_events_created_at ON tracking_events(created_at);
CREATE INDEX idx_tracking_events_is_bot ON tracking_events(is_bot);
CREATE INDEX idx_tracking_events_device_type ON tracking_events(device_type);

-- Materialized View para agregação diária
CREATE MATERIALIZED VIEW tracking_events_daily_aggregate AS
SELECT
  DATE(created_at) as event_date,
  event_type,
  user_id,
  device_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users
FROM tracking_events
WHERE is_bot = false
GROUP BY DATE(created_at), event_type, user_id, device_type;

CREATE UNIQUE INDEX idx_tracking_daily_agg_unique 
  ON tracking_events_daily_aggregate(event_date, event_type, user_id, device_type);

-- Materialized View para agregação horária (últimas 24h)
CREATE MATERIALIZED VIEW tracking_events_hourly_aggregate AS
SELECT
  DATE_TRUNC('hour', created_at) as event_hour,
  event_type,
  device_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users
FROM tracking_events
WHERE is_bot = false
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), event_type, device_type;

CREATE UNIQUE INDEX idx_tracking_hourly_agg_unique 
  ON tracking_events_hourly_aggregate(event_hour, event_type, device_type);

-- Função para refresh automático (executar via cron)
CREATE OR REPLACE FUNCTION refresh_tracking_aggregates()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tracking_events_daily_aggregate;
  REFRESH MATERIALIZED VIEW CONCURRENTLY tracking_events_hourly_aggregate;
END;
$$ LANGUAGE plpgsql;
```

### Migration 2: weather_snapshots
```sql
CREATE TABLE weather_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  temperature DOUBLE PRECISION,
  condition TEXT,
  humidity DOUBLE PRECISION,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_weather_snapshots_location ON weather_snapshots(location);
CREATE INDEX idx_weather_snapshots_snapshot_date ON weather_snapshots(snapshot_date);
```

### Migration 3: campaigns
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  target_segments JSONB DEFAULT '{}',
  weather_conditions JSONB,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaigns_tags ON campaigns USING GIN(tags);
CREATE INDEX idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX idx_campaigns_end_date ON campaigns(end_date);
```

### Migration 4: user_tags (com suporte a decay)
```sql
CREATE TABLE user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  score DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (score >= 0 AND score <= 1),
  source TEXT NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interaction_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tag)
);

CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX idx_user_tags_tag ON user_tags(tag);
CREATE INDEX idx_user_tags_score ON user_tags(score);
CREATE INDEX idx_user_tags_user_tag ON user_tags(user_id, tag);
CREATE INDEX idx_user_tags_last_seen ON user_tags(last_seen_at);

-- Função para aplicar decay automático (executar semanalmente)
CREATE OR REPLACE FUNCTION apply_tag_decay()
RETURNS void AS $$
BEGIN
  UPDATE user_tags
  SET 
    score = score * POWER(0.8, EXTRACT(EPOCH FROM (NOW() - last_seen_at)) / (7 * 24 * 3600)),
    updated_at = NOW()
  WHERE 
    last_seen_at < NOW() - INTERVAL '90 days'
    AND score > 0.1;
  
  -- Remover tags com score muito baixo
  DELETE FROM user_tags WHERE score < 0.1;
END;
$$ LANGUAGE plpgsql;
```

### Migration 5: weather_rules (configuração de regras climáticas)
```sql
CREATE TABLE weather_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  min_temp FLOAT,
  max_temp FLOAT,
  condition_trigger TEXT,
  action_metadata JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_weather_rules_active ON weather_rules(is_active);
CREATE INDEX idx_weather_rules_priority ON weather_rules(priority);

-- Inserir regras padrão
INSERT INTO weather_rules (rule_name, min_temp, max_temp, condition_trigger, action_metadata, priority) VALUES
  ('Heavy Winter', NULL, 15, NULL, '{"tags": ["heavy_winter"], "categories": ["Casacos", "Blusas de Lã"]}', 10),
  ('Light Winter', 15, 20, NULL, '{"tags": ["light_winter"], "categories": ["Cardigans", "Jaquetas"]}', 8),
  ('Rainy Day', NULL, NULL, 'Rain', '{"tags": ["rainy_day"], "categories": ["Botas", "Impermeáveis"]}', 9),
  ('Summer Vibe', 28, NULL, NULL, '{"tags": ["summer_vibe"], "categories": ["Vestidos", "Biquínis"]}', 10),
  ('Warm Weather', 25, 28, NULL, '{"tags": ["warm_weather"], "categories": ["Camisetas", "Shorts"]}', 7),
  ('Sunny Day', NULL, NULL, 'Clear', '{"tags": ["sunny_day"], "categories": ["Óculos", "Chapéus"]}', 6);
```

### Migration 6: campaign_interactions (para tracking de interações)
```sql
CREATE TABLE campaign_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  interaction_type TEXT NOT NULL,
  source TEXT, -- 'weather_recommendation', 'campaign', 'organic'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_interactions_campaign_id ON campaign_interactions(campaign_id);
CREATE INDEX idx_campaign_interactions_user_id ON campaign_interactions(user_id);
CREATE INDEX idx_campaign_interactions_type ON campaign_interactions(interaction_type);
CREATE INDEX idx_campaign_interactions_source ON campaign_interactions(source);
CREATE INDEX idx_campaign_interactions_created_at ON campaign_interactions(created_at);
```

---

## Melhorias de Robustez Implementadas

### 1. Filtro de Bots e Crawlers
- ✅ Lista negra de bots conhecidos (Googlebot, Bingbot, etc.)
- ✅ Marcação de eventos como `is_bot: true`
- ✅ Não processa eventos de bots para analytics
- ✅ Economiza recursos e melhora precisão das métricas

### 2. Otimização de Performance
- ✅ Particionamento de tabela `tracking_events` por mês
- ✅ Materialized views para agregações (diária e horária)
- ✅ Headers otimizados no pixel (Content-Length, Connection: close)
- ✅ Processamento assíncrono após envio da resposta

### 3. Sistema de Tag Decay
- ✅ Tags antigas perdem relevância automaticamente
- ✅ Decaimento exponencial (20% por semana após 90 dias)
- ✅ Remoção automática de tags com score < 0.1
- ✅ Evita perfis "presos" a comportamentos antigos

### 4. Cold Start para Usuários Novos
- ✅ Tags de contexto baseadas em geolocalização
- ✅ Personalização imediata mesmo sem histórico
- ✅ Substituição automática por tags reais quando houver dados

### 5. Sistema Anônimo-para-Conhecido
- ✅ Vinculação retroativa de eventos de sessão anônima
- ✅ Histórico completo desde o primeiro acesso
- ✅ Recalculo automático de tags após login

### 6. Matriz de Recomendação Clima x Produto
- ✅ Regras configuráveis via tabela `weather_rules`
- ✅ Admin pode ajustar sem alterar código
- ✅ Priorização de regras por relevância

### 7. UX Melhorada para Admin
- ✅ Preview de público em tempo real
- ✅ A/B testing integrado (ROI por fonte)
- ✅ Filtros avançados e exportação de dados

### 8. Manutenção Automática
- ✅ Schedulers para refresh de views
- ✅ Aplicação automática de tag decay
- ✅ Limpeza automática de dados antigos
- ✅ Criação automática de novas partições

---

## Próximos Passos

1. **Aprovação do planejamento**: revisar e ajustar conforme necessário
2. **Setup de ambiente**: configurar variáveis de ambiente (OpenWeather API key)
3. **Criação de migrations**: executar SQL de criação de tabelas (com particionamento)
4. **Configuração de schedulers**: integrar tarefas automáticas com sistema existente
5. **Implementação Fase 1**: começar com pixel básico (com filtro de bots)
6. **Testes**: validar funcionamento e performance (incluir testes de carga)
7. **Deploy gradual**: começar em staging, depois produção
8. **Monitoramento**: configurar alertas e dashboards de métricas
