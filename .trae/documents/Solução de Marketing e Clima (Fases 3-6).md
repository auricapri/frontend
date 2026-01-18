## Implementação da Solução de Marketing e Clima

Com base no planejamento detalhado em `PLANEJAMENTO_TRACKING_PIXEL_CLIMA.md`, irei proceder com a implementação completa dos módulos de Clima e Marketing.

### **1. Infraestrutura de Banco de Dados**
*   **Nova Migração**: Criar o arquivo `backend/migrations/create_weather_marketing_tables.sql` contendo:
    *   `weather_snapshots`: Para histórico de clima por região.
    *   `weather_rules`: Para configurar gatilhos (ex: se < 15°C -> mostrar casacos).
    *   `campaigns`: Gestão de campanhas de marketing com tags e segmentação.
    *   `user_tags`: Sistema de pontuação de interesses do usuário (com lógica de decaimento).
    *   `campaign_interactions`: Registro de cliques e conversões por campanha.
    *   Função `apply_tag_decay()`: Para manter os perfis de usuário atualizados.

### **2. Backend (Serviços e Repositórios)**
*   **Módulo de Clima**:
    *   `weather.repository.ts`: Persistência de snapshots e consulta de regras.
    *   `weather-personalization.service.ts`: Lógica que cruza o clima atual com as regras para recomendar categorias e produtos.
    *   `weather.routes.ts`: Endpoint `GET /api/weather/recommendations`.
*   **Módulo de Marketing**:
    *   `campaigns.repository.ts`: CRUD de campanhas.
    *   `user-profile.service.ts`: Motor de cálculo de tags baseado em compras e comportamento de navegação.
    *   `campaign-recommendation.service.ts`: Sistema de matching entre tags do usuário e campanhas ativas.
    *   `session-linking.service.ts`: Vinculação de eventos anônimos ao usuário após o login.
    *   `marketing.routes.ts`: Endpoints para gestão de campanhas e perfis de marketing.

### **3. Frontend (UI e Integração)**
*   **Serviços e Hooks**:
    *   `weather.service.ts` e `marketing.api.ts`: Clientes para os novos endpoints.
    *   `useWeatherRecommendations.ts`: Hook para carregar banners e produtos baseados no clima.
*   **Componentes da Loja**:
    *   `WeatherPersonalizedBanner`: Banner dinâmico na Home.
    *   `WeatherProductRecommendations`: Carrossel de produtos recomendado.
*   **Dashboard Admin**:
    *   Expandir o `AdminMarketing.tsx` com abas para Gestão de Campanhas, Perfis de Usuários (com suas tags) e Analytics de Conversão.

### **4. Automação e Manutenção**
*   Integrar os schedulers para:
    *   Atualizar views materializadas diariamente.
    *   Aplicar o decaimento de tags semanalmente.
    *   Recalcular perfis de usuários ativos.

**Deseja que eu comece pela migração do banco de dados agora?**