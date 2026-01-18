## Plano Integrado: Refatoração de Documentação e Plano de Testes de Performance E2E

Este plano visa atender tanto à refatoração da documentação de componentização quanto à criação de uma estratégia robusta de testes de performance end-to-end.

### 1. Refatoração de [REFACTORING_COMPONENTIZACAO.md](file:///Users/marcuslirio/Desktop/auricapri/docs/REFACTORING_COMPONENTIZACAO.md)
- **Otimização de Tokens**: Redução de ~20% através da consolidação de seções repetitivas (ex: remover "Benefícios" individuais e criar uma seção global).
- **Simplificação**: Remover metadados secundários (estimativas de linhas em diagramas) e simplificar a linguagem técnica.
- **Manutenção**: Preservar todos os conceitos-chave e links internos.

### 2. Implementação do Plano de Testes de Performance E2E
Criarei um novo documento [PERFORMANCE_E2E_PLAN.md](file:///Users/marcuslirio/Desktop/auricapri/docs/PERFORMANCE_E2E_PLAN.md) com:
- **Cenário de Fluxo Completo**: Jornada do usuário desde a Landing Page até a confirmação de pedido (Bootstrap -> Busca -> Produto -> Carrinho -> Checkout -> Pagamento).
- **Infraestrutura**: Aproveitamento da configuração existente do Playwright ([playwright.perf.config.ts](file:///Users/marcuslirio/Desktop/auricapri/auricapri/playwright.perf.config.ts)) e recomendações para ferramentas de carga massiva (JMeter/k6).
- **Métricas de Medição**:
    - **Tempo de Resposta**: Latência por etapa (P50, P95, P99).
    - **Throughput**: Requisições por segundo (RPS) suportadas.
    - **Recursos**: Monitoramento de CPU/Memória do backend e consumo de banda.
- **Processo de Execução**:
    - **Baseline**: Carga normal (usuário único).
    - **Stress/Peak**: Simulação de pico de tráfego (3x a 10x o normal).
    - **Endurance**: Teste de estabilidade por períodos prolongados.
- **Análise e Diagnóstico**: Metodologia para identificar gargalos (ex: queries lentas, payloads grandes) e recomendações de otimização (cache, compressão, etc.).

### 3. Verificação e Validação
- **Medição de Tokens**: Comparação do volume de dados antes e depois da refatoração.
- **Revisão Técnica**: Garantir que o plano de performance seja executável com a infraestrutura atual do projeto.

Deseja que eu inicie a implementação de ambos os documentos?