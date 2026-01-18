## Contexto Atual (Base do Projeto)
- Já existe um [TaxCalculationService](file:///Users/marcuslirio/Desktop/auricapri/backend/src/services/tax.service.ts) com MEI/Simples/Presumido/Real e cache de ICMS via tabela `icms_rates`.
- Já existe um [PricingService](file:///Users/marcuslirio/Desktop/auricapri/backend/src/services/pricing.service.ts) que consome o serviço tributário.
- Já existe um [SchedulerService](file:///Users/marcuslirio/Desktop/auricapri/backend/src/services/scheduler.service.ts) com job diário (24h) e lock distribuído via Redis opcional.
- No frontend, o checkout tem inputs de CEP/endereço ainda sem máscara “apagar até vazio” e sem validação robusta (ex.: [AddressForm](file:///Users/marcuslirio/Desktop/auricapri/auricapri/src/components/checkout/AddressForm.tsx)).

## Observação Crítica sobre “API gratuita e sem limites”
- Para regras tributárias completas (ICMS/ISS/PIS/COFINS/IPI/DIFAL/ST por UF/município/NCM/CEST), não existe uma API pública universal que seja simultaneamente **gratuita**, **sem autenticação**, **sem rate limit** e **legalmente confiável**.
- A solução que atende o requisito na prática é: **sincronizar dados abertos (arquivos/dumps) 1x ao dia**, armazenar localmente e fazer o cálculo 100% local. Assim, o runtime não depende de limites externos.

## Arquitetura Proposta (Modular)
### 1) Camada “Tax Data Provider” (integração + resiliência)
- Criar uma interface `TaxDataProvider` no backend (ex.: `getRates(params)`, `getStTable(params)`, `getMunicipalIss(params)`), com implementações:
  - **Provider “SyncedLocal” (padrão)**: lê do banco/cache e nunca chama API externa durante precificação.
  - **Provider “RemoteSync”**: baixa periodicamente dados de fontes abertas (HTTPS) e grava no banco.
- Implementar cliente HTTPS robusto:
  - Retry automático com backoff exponencial + jitter para 429/5xx/timeouts.
  - Timeouts curtos e circuit breaker simples.

### 2) Cache em camadas (memória + banco) com TTL
- **L1 (memória)**: Map/LRU com TTL por chave (ex.: `tax:icms:SP->RJ:ncm:...`).
- **L2 (banco/Supabase)**: tabelas de cache materializado com:
  - `key`, `payload_json`, `expires_at`, `updated_at`, `source_version`.
- TTL configurável via `env` (ex.: 24h para tabelas, 1h para resoluções derivadas).

### 3) Polling diário (24h) para mudanças de alíquotas
- Reutilizar `SchedulerService` para adicionar um job diário `syncTaxData()`:
  - Lock distribuído (já existe) para evitar corrida em múltiplas instâncias.
  - Estratégia “download → validate → stage → swap” (atômica) para evitar dados parciais.

### 4) Fila de requisições + fallback offline
- Criar uma tabela `tax_sync_queue` (banco) para enfileirar downloads/atualizações e reprocessar falhas.
- No runtime:
  - Se o sync falhar, o sistema continua com **último snapshot válido** (cache L2) e registra status.
  - Se houver chamadas “on-demand” (ex.: consulta municipal específica), enfileirar e usar fallback local.

## Motor de Precificação e Tributação (Cálculo Local Completo)
### 1) “Motor” modular
- Criar um “Tax Engine” com módulos independentes:
  - `ICMSModule` (interno/interestadual, benefícios quando aplicável)
  - `DIFALModule` (partilha, FCP quando aplicável)
  - `IPIModule`
  - `PISModule` / `COFINSModule`
  - `ISSModule` (serviços; aplicável apenas quando o tipo de item for serviço)
  - `STModule` (Substituição Tributária por NCM/CEST/UF)
- Entrada do motor deve suportar:
  - UF origem/destino, município destino (código IBGE), NCM (8 dígitos), CEST, tipo do produto, canal (ecommerce/marketplace/wholesale), CFOP quando necessário.
- Saída padronizada:
  - breakdown por imposto + bases de cálculo + alíquotas + observações/regra aplicada.

### 2) Tabelas atualizáveis (ST, NCM/CEST, ISS)
- Definir “schemas” de tabelas e versões:
  - `tax_ncm` (descrição, vigência)
  - `tax_cest`
  - `tax_st_rules`
  - `tax_iss_municipal` (quando disponível por dado aberto)
  - `tax_icms_rates` (substitui/expande `icms_rates` atual)
- Processo de atualização via sync diário e validação de integridade.

### 3) Integração com PricingService
- Atualizar `PricingService` para consumir o novo “Tax Engine” e não apenas `effectiveTaxRate`.
- Manter compatibilidade:
  - feature flag `PRICING_TAX_ENGINE_V2`.
  - execução dupla opcional (v1 vs v2) com log de divergência para rollout seguro.

## Padronização de Máscaras (Frontend)
### 1) Campo monetário
- Implementar componente/utility único de “money input” baseado em **valor em centavos (number/int)**:
  - Remove completamente “0” inicial ao apagar (estado vazio = `''` e cents = `null`).
  - Formatação `pt-BR` (R$ 9.999,99), `en-US` ($9,999.99), `es-AR` ($ 9.999,99).
  - Bloqueio de caracteres não numéricos em tempo real.

### 2) Campo CEP
- Implementar máscara `99999-999` mantendo apenas dígitos internamente.
- Permitir apagar até vazio sem “travar” em `0`.
- Validação de formato (8 dígitos) e disparo de auto-preenchimento.

### 3) Endereço (autocomplete)
- Integrar uma API gratuita de geolocalização/autocomplete com política de uso:
  - Proposta: **Nominatim (OpenStreetMap)** + cache local.
  - Se quiser “sem limites” de verdade: opção de **self-host** Nominatim (ficará no plano como etapa opcional).
- Validar campos obrigatórios e UF/município.

## Funcionalidades Adicionais
### 1) Simulador side-by-side
- Endpoint backend: `POST /pricing/simulate` recebendo múltiplos cenários e retornando comparação.
- UI Admin: tabela comparativa (cenário A vs B) com impostos e margem.

### 2) Relatórios PDF/Excel
- PDF: reutilizar `pdf.service.ts` e templates existentes.
- Excel: gerar **CSV** como baseline (zero dependências) e, opcionalmente, adicionar biblioteca XLSX depois.

### 3) Histórico por 5 anos (compliance)
- Nova tabela `tax_calculation_history` com:
  - request hash, payload de entrada, resultado, versão de tabelas, timestamps.
- Job de manutenção: apenas remoção > 5 anos (se exigido), ou manter integral.

### 4) Dashboard economia tributária
- Persistir métricas agregadas (por dia/canal/UF) e expor endpoint para UI.
- Definir “baseline” (ex.: tributação sem otimização) para medir economia.

## Testes e Qualidade
- Unit tests (Vitest) cobrindo:
  - cada módulo tributário com tabelas de casos (incluindo extremos).
- Integração:
  - mock do provider remoto e validação de cache/TTL/fila.
- Carga:
  - script de load test (k6/autocannon) mirando 1.000 req/min no endpoint de simulação.
- UI:
  - testes Playwright para máscaras de input (desktop + mobile) e cross-browser.

## Internacionalização
- Expandir o modelo de locale:
  - mapear `pt` → `pt-BR`, `en` → `en-US`, `es` → `es-AR` (mantendo compat com o que já existe em `i18n.ts`).
- Centralizar formatação com `Intl.NumberFormat`/`Intl.DateTimeFormat`.

## Plano de Rollback
- Feature flags para:
  - motor tributário v2
  - sync remoto
  - UI masks
- Estratégia de rollout:
  - habilitar em ambiente staging
  - executar “dual-run” (v1/v2) registrando divergências
  - ativar gradualmente
  - rollback instantâneo via flag (sem migrações destrutivas)

## Próxima Ação (após sua confirmação)
- Implementar primeiro o esqueleto do `TaxDataProvider` + cache L1/L2 + job diário de sync + fila, depois plugar o Tax Engine e, por fim, UI masks + simulador + relatórios + testes.
