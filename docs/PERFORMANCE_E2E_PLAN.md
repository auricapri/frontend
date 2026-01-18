# Plano de Testes de Performance End-to-End (E2E)

## 1. Introdução
Este documento detalha a estratégia de testes de performance para validar a escalabilidade e estabilidade do fluxo completo de compra na plataforma Auricapri.

## 2. Cenários de Teste (Fluxo E2E)
O teste deve simular uma jornada de usuário real:
1. **Bootstrap**: Carregamento inicial da loja e configurações.
2. **Descoberta**: Listagem de produtos e aplicação de filtros.
3. **Seleção**: Visualização de detalhes de um produto específico.
4. **Carrinho**: Adição de item e cálculo de frete/impostos.
5. **Checkout**: Preenchimento de endereço e seleção de pagamento.
6. **Confirmação**: Finalização do pedido e recebimento do status.

## 3. Ambiente e Ferramentas
- **Primária**: [Playwright Performance](file:///Users/marcuslirio/Desktop/auricapri/auricapri/playwright.perf.config.ts) (já integrado).
- **Carga Massiva**: Recomenda-se **k6** para testes de estresse >1000 VU (Virtual Users) devido à eficiência de memória.
- **Monitoramento**: Integração com New Relic ou Datadog para correlacionar latência de API com consumo de recursos (CPU/RAM).

## 4. Critérios de Medição (SLOs)
| Métrica | Meta (Normal) | Meta (Pico 3x) |
| :--- | :--- | :--- |
| **P95 Latency (API)** | < 250ms | < 400ms |
| **Throughput (RPS)** | > 50 req/s | > 150 req/s |
| **Taxa de Erro** | < 0.1% | < 1% |
| **Time to Interactive** | < 2s | < 3.5s |

## 5. Processo de Execução
1. **Baseline**: Execução com 10 usuários simultâneos para estabelecer a métrica base.
2. **Stress Test**: Aumento progressivo (Ramp-up) até 100 usuários simultâneos em 5 minutos.
3. **Soak/Endurance**: Carga constante de 30 usuários por 1 hora para detectar memory leaks.
4. **Peak Test**: Simulação de tráfego de "Black Friday" (pico repentino de 3x a carga normal).

## 6. Análise e Otimização
### Pontos Críticos Identificados
- **Queries de Relacionamento**: `/api/collections/products/relations` é um ponto de atenção.
- **Cálculo de Impostos**: O `tax.service.ts` no backend deve ser monitorado durante o checkout.
- **Cache de Sessão**: Validar se o `cart-cache.service.ts` está reduzindo hits no banco de dados.

### Recomendações
- **Implementar Prefetching**: Usar o hook `usePrefetch` em áreas de alto tráfego.
- **Compressão Gzip/Brotli**: Garantir que todos os assets e respostas JSON sejam comprimidos.
- **Otimização de DB**: Adicionar índices em colunas de busca frequente nos repositórios.

---
*Última atualização: 2026-01-13*
