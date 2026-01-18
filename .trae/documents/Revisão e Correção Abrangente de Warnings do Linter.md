## Objetivo e Critério de Aceite
- Zerar warnings de lint em todos os projetos (mobile, frontend, backend) executando um lint consistente e repetível.
- Prioridade máxima: eliminar imports não utilizados (e variáveis não usadas associadas), sem quebrar side effects.
- Evidências: relatório categorizado de warnings (antes/depois) + testes/builds executados com sucesso.

## Estado Atual (diagnóstico rápido)
- **Mobile**: possui ESLint configurado e atualmente emite muitos warnings (majoritariamente `@typescript-eslint/no-unused-vars`, `react-native/no-inline-styles`, `no-alert`). Há **dois** configs (`.eslintrc.js` e `.eslintrc.cjs`) na raiz, potencialmente redundantes.
- **Frontend (auricapri)**: não há ESLint configurado nem script `lint`.
- **Backend**: não há ESLint configurado nem script `lint`.

## Estratégia Geral
- Padronizar a execução de lint por projeto (scripts `lint`, `lint:report`, `lint:fix`).
- Produzir um **relatório único** (JSON + Markdown) agregando warnings por tipo/regra e por projeto.
- Corrigir sistematicamente os warnings, começando por imports não utilizados.
- Elevar regras de “unused imports/vars” para **erro** para evitar regressões.

## Passo 1 — Execução de lint e geração de relatório (antes)
- **Mobile**: executar ESLint em `mobile/src` (já é o padrão do script atual) gerando JSON.
- **Frontend**: adicionar ESLint com configuração mínima adequada a React + Vite + TypeScript; criar script `lint` que rode em `auricapri/src`.
- **Backend**: adicionar ESLint com configuração mínima adequada a Node/Express + TypeScript; criar script `lint` que rode em `backend/src` e `backend/shared`.
- Criar um agregador (script Node no diretório `scripts/`) para:
  - ler os JSONs do ESLint de cada projeto
  - sumarizar warnings por regra (ex.: `@typescript-eslint/no-unused-vars`, `unused-imports/no-unused-imports` etc.)
  - gerar `LINT_REPORT.before.md`.

## Passo 2 — Correção de imports não utilizados (prioridade máxima)
- Rodar `eslint --fix` onde aplicável e, em paralelo, revisar arquivos com warnings de “unused imports”.
- Remover imports não referenciados e:
  - validar se algum import existe por **side effect** (ex.: polyfills, setup de libs)
  - quando for side effect, manter e registrar no relatório (`imports-mantidos.md`) com motivo objetivo (ex.: “polyfill obrigatório”).
- Atacar por ordem de impacto:
  1) arquivos com maior quantidade de warnings
  2) arquivos centrais (contexts, services, router)

## Passo 3 — Correção dos demais warnings
- **Unused vars/args**: remover variáveis não usadas ou renomear parâmetros para `_` quando forem necessários por assinatura.
- **react-native/no-inline-styles** (mobile): extrair estilos inline para `StyleSheet.create`.
  - Para estilos dinâmicos: usar funções utilitárias (`getStyles(params)`) ou `useMemo` para criar objetos estáveis.
- **no-alert** (mobile/web): substituir `alert()` por alternativa apropriada:
  - React Native: `Alert.alert(...)` ou o sistema de Toast existente.
  - Web: preferir componente de feedback (toast/modal) se existir; se não, `window.alert` pode ser evitado por UI.
- Ajustar configurações para evitar “falsos positivos” e manter o padrão do projeto.

## Passo 4 — Validação de funcionalidade
- **Mobile**: executar `jest` e um smoke check de build (quando aplicável).
- **Frontend**: executar `vite build` + `npx tsc --noEmit` + Playwright (pelo menos o conjunto base `npm test`).
- **Backend**: executar `npm run type-check` + `npm run build` + smoke run do servidor (subir e bater em `/health`/`/metrics` se disponíveis).

## Passo 5 — Verificação final (zero warnings)
- Reexecutar lint em todos os projetos e gerar `LINT_REPORT.after.md`.
- Garantir que `lint` falhe (exit code != 0) caso qualquer warning reapareça (configurando `--max-warnings 0`).

## Passo 6 — Entrega e versionamento
- Entregar:
  - `LINT_REPORT.before.md` e `LINT_REPORT.after.md`
  - lista de imports mantidos por side effects
  - comandos executados e resultados (build/test) registrados no relatório
- Se você quiser, eu também preparo uma mensagem de commit sugerida e um checklist de revisão.

## Observações Importantes (para evitar regressões)
- Não vou remover imports com side effects sem evidência clara.
- Vou consolidar a configuração duplicada do ESLint no mobile para evitar ambiguidade.
- Vou manter o escopo de regras de lint focado em qualidade e consistência, evitando introduzir centenas de novas exigências que não existiam no projeto.

Se você confirmar este plano, eu começo implementando o ESLint no frontend e backend, gero o relatório “before”, e em seguida faço a limpeza total de warnings com validação completa (tests/build).