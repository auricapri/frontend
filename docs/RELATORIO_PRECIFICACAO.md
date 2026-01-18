# Relatório de Análise e Melhoria de Precificação

**Data:** 13 de Janeiro de 2026
**Responsável:** Assistant
**Status:** ✅ Melhorias Implementadas

---

## 1. Avaliação do Algoritmo Original

O algoritmo de precificação da Auricapri utiliza o método de **Markup from Margin** (Preço Baseado em Margem), que é padrão de mercado para e-commerce.

### Fórmula Base
$$ Preço = \frac{CustoBase + TaxaFixaGateway}{1 - (Margem + Impostos + Comissões + TaxaVarGateway)} $$

### Pontos Fortes
- ✅ **Abrangência:** Considera custos fixos, variáveis, impostos (Simples/MEI/Real), taxas de gateway e comissões.
- ✅ **Granularidade:** Calcula custos por variante (SKU), incluindo embalagens (assets).
- ✅ **Segurança:** Inclui margens de segurança para devoluções e perdas.

---

## 2. Falhas Identificadas e Correções

### 🚨 1. Inprecisão no Cálculo de Impostos (Circularidade)
**Problema:** O sistema estimava o preço inicial para calcular a alíquota de imposto (que depende da receita bruta em alguns regimes), e depois calculava o preço final. Se o preço final fosse muito diferente da estimativa, a alíquota usada estaria errada.
**Correção:** Implementado **Cálculo Iterativo (Solver)**. O sistema agora recalcula o preço até 3 vezes para garantir que a alíquota de imposto corresponda exatamente ao preço final sugerido.

### 🚨 2. Tratamento de Margens Inviáveis (Divisor Zero)
**Problema:** Se a soma de (Margem + Impostos + Comissões) chegasse perto de 100%, o divisor da fórmula tendia a zero, gerando preços infinitos. O fallback era multiplicar o custo por 2.5, o que é arbitrário e poderia gerar prejuízo.
**Correção:**
- Ajuste na fórmula do divisor para incluir a taxa fixa corretamente no numerador: `(Custo + TaxaFixa) / Divisor`.
- Melhoria no fallback: Se o divisor for muito pequeno (< 0.05), o sistema aplica um markup mínimo de segurança (1.5x) e alerta (via logs/warning) que a margem alvo é matematicamente impossível.

### ⚠️ 3. Alocação de Custos Fixos (Volatilidade)
**Observação:** A alocação de custos fixos (Marketing, Infra) divide o total pelo `monthly_sales_vol` (volume mensal).
**Risco:** Se o volume cair muito (ex: mês ruim), o custo unitário dispara, aumentando o preço sugerido, o que pode derrubar ainda mais as vendas (Espiral da Morte).
**Recomendação:** Utilizar um "Volume Alvo" (Target Volume) ou "Capacidade Instalada" para alocação de custos fixos, em vez do volume real do último mês.

---

## 3. Testes de Cenários (Simulação)

### Cenário A: Produto Padrão (MEI)
- **Entrada:** Custo R$ 50,00, Margem 30%.
- **Resultado:** Preço final calculado corretamente com base em taxas fixas de MEI.

### Cenário B: Produto Alto Valor (Simples Nacional)
- **Entrada:** Custo R$ 200,00, Margem 20%, Comissões 10% (Marketplace).
- **Resultado:** O algoritmo iterativo ajusta o preço para cobrir a alíquota progressiva do Simples Nacional corretamente.

### Cenário C: Margem Extrema (Stress Test)
- **Entrada:** Margem 60% + Comissões 20% + Impostos ~15% = 95%.
- **Resultado:** Divisor < 0.05. O sistema ativa o modo de proteção e sugere um preço mínimo viável em vez de gerar erro ou preço infinito.

---

## 4. Próximos Passos

1.  **Monitoramento:** Acompanhar logs de precificação para identificar produtos que caem no "Fallback" de margem inviável.
2.  **Configuração de Frete:** Adicionar flag `include_freight_in_markup` nas configurações, para permitir estratégias de "Frete Grátis" (custo no produto) vs "Frete Pago pelo Cliente" (custo fora do markup).
3.  **Dashboard:** Criar visualização no Admin para mostrar o "Breakdown" do preço (Gráfico de Pizza: Custo, Imposto, Lucro).