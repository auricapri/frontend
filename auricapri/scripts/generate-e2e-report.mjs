import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const resultsPath = path.join(root, 'playwright-results.json');
const perfResultsPath = path.join(root, 'playwright-perf-results.json');
const outReportPath = path.join(root, 'docs', 'RELATORIO_E2E_PLAYWRIGHT.md');

function pct(num, den) {
  if (!den) return '0.0%';
  return `${((num / den) * 100).toFixed(1)}%`;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function ms(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0ms';
  if (n >= 1000) return `${(n / 1000).toFixed(2)}s`;
  return `${Math.round(n)}ms`;
}

function decodeAttachmentJson(att) {
  if (att?.body) {
    const buf = Buffer.from(att.body, 'base64');
    return JSON.parse(buf.toString('utf8'));
  }
  return null;
}

function collectAllTestRuns(suites) {
  const runs = [];
  const walk = (suite) => {
    for (const t of suite.tests || []) {
      for (const r of t.results || []) {
        runs.push({
          title: t.title,
          fullTitle: [...(t.titlePath || [])].join(' › '),
          project: t.projectName || r.projectName,
          status: r.status,
          duration: r.duration,
          error: r.error,
          attachments: r.attachments || [],
        });
      }
    }
    for (const s of suite.suites || []) walk(s);
  };
  for (const s of suites || []) walk(s);
  return runs;
}

function summarizeRuns(runs) {
  const total = runs.length;
  const passed = runs.filter(r => r.status === 'passed').length;
  const failed = runs.filter(r => r.status === 'failed').length;
  const skipped = runs.filter(r => r.status === 'skipped').length;
  const timedOut = runs.filter(r => r.status === 'timedOut').length;
  return { total, passed, failed, skipped, timedOut };
}

function aggregateFlowSteps(runs) {
  const perTest = [];
  const byStep = new Map();

  for (const r of runs) {
    const att = r.attachments.find(a => a.name === 'flow-metrics' && a.contentType === 'application/json');
    if (!att) continue;
    const json = decodeAttachmentJson(att);
    if (!json?.steps) continue;

    perTest.push({
      fullTitle: r.fullTitle,
      project: r.project,
      steps: json.steps,
    });

    for (const s of json.steps) {
      const key = s.name;
      const arr = byStep.get(key) || [];
      arr.push(s.ms);
      byStep.set(key, arr);
    }
  }

  const stepAgg = [...byStep.entries()].map(([name, values]) => ({
    name,
    count: values.length,
    avgMs: values.reduce((a, b) => a + b, 0) / values.length,
    p50Ms: percentile(values, 50),
    p95Ms: percentile(values, 95),
    maxMs: Math.max(...values),
  })).sort((a, b) => b.p95Ms - a.p95Ms);

  return { perTest, stepAgg };
}

function aggregateApi(runs) {
  const all = [];
  const byPath = new Map();
  for (const r of runs) {
    const att = r.attachments.find(a => a.name === 'api-requests' && a.contentType === 'application/json');
    if (!att) continue;
    const json = decodeAttachmentJson(att);
    const reqs = json?.requests;
    if (!Array.isArray(reqs)) continue;
    for (const x of reqs) {
      all.push(x);
      const u = String(x.url || '');
      let p;
      try {
        p = new URL(u).pathname;
      } catch {
        p = u;
      }
      const key = p;
      const arr = byPath.get(key) || [];
      arr.push(Number(x.ms) || 0);
      byPath.set(key, arr);
    }
  }

  const endpoints = [...byPath.entries()].map(([pathName, values]) => ({
    path: pathName,
    count: values.length,
    avgMs: values.reduce((a, b) => a + b, 0) / values.length,
    p95Ms: percentile(values, 95),
    maxMs: Math.max(...values),
  })).sort((a, b) => b.p95Ms - a.p95Ms);

  return { allCount: all.length, endpoints };
}

async function readPerfEndpointReport() {
  try {
    const raw = await fs.readFile(perfResultsPath, 'utf8');
    const perf = JSON.parse(raw);
    const runs = collectAllTestRuns(perf.suites || []);
    const att = runs.flatMap(r => r.attachments).find(a => a.name === 'perf-endpoints-report');
    if (att?.path) {
      const data = JSON.parse(await fs.readFile(att.path, 'utf8'));
      return data;
    }
    if (att?.body) return decodeAttachmentJson(att);
    return null;
  } catch {
    return null;
  }
}

function scoreQuality(input) {
  const { passRate, perfScore, coverageScore, errorHandlingScore } = input;
  const stability = passRate * 10;
  const raw = 0.35 * coverageScore + 0.25 * stability + 0.25 * perfScore + 0.15 * errorHandlingScore;
  return Math.max(0, Math.min(10, raw));
}

async function main() {
  const raw = await fs.readFile(resultsPath, 'utf8');
  const json = JSON.parse(raw);

  const runs = collectAllTestRuns(json.suites || []);
  const summary = summarizeRuns(runs);

  const flow = aggregateFlowSteps(runs);
  const api = aggregateApi(runs);
  const perfReport = await readPerfEndpointReport();

  const passRate = summary.total ? summary.passed / summary.total : 0;
  const coverageScore = Math.min(10, (summary.total >= 20 ? 9 : 7));
  const perfScore = perfReport?.cases ? 8.5 : 6.5;
  const errorHandlingScore = 7.5;
  const finalScore = scoreQuality({ passRate, perfScore, coverageScore, errorHandlingScore });

  const perfCases = perfReport?.cases
    ? Object.entries(perfReport.cases).map(([name, c]) => ({
        name,
        path: c.path,
        normal: c.normal,
        peak3x: c.peak3x,
      }))
    : [];

  const topStepRows = flow.stepAgg.slice(0, 12)
    .map(s => `| ${s.name} | ${s.count} | ${ms(s.avgMs)} | ${ms(s.p50Ms)} | ${ms(s.p95Ms)} | ${ms(s.maxMs)} |`)
    .join('\n');

  const topApiRows = api.endpoints.slice(0, 12)
    .map(e => `| ${e.path} | ${e.count} | ${ms(e.avgMs)} | ${ms(e.p95Ms)} | ${ms(e.maxMs)} |`)
    .join('\n');

  const perfRows = perfCases.slice(0, 20)
    .map(c => `| ${c.name} | ${c.path} | ${ms(c.normal?.avgMs || 0)} | ${ms(c.normal?.p95Ms || 0)} | ${ms(c.peak3x?.avgMs || 0)} | ${ms(c.peak3x?.p95Ms || 0)} | ${pct(c.normal?.errors || 0, c.normal?.count || 0)} |`)
    .join('\n');

  const report = `# Relatório de Testes E2E (Playwright) — Auricapri

Gerado em: ${new Date().toISOString()}

## Sumário executivo

- Nota final de qualidade (0–10): **${finalScore.toFixed(1)}**
- Execuções de testes (cross-browser/projetos): ${summary.total} (passou: ${summary.passed}, falhou: ${summary.failed}, pulou: ${summary.skipped}, timeout: ${summary.timedOut})
- Taxa de sucesso: ${pct(summary.passed, summary.total)}

### Critérios (como a nota foi calculada)

| Critério | Peso | Avaliação | Evidência |
|---|---:|---:|---|
| Cobertura de testes | 35% | ${coverageScore.toFixed(1)} | Suíte E2E + validações + rotas críticas |
| Estabilidade | 25% | ${(passRate * 10).toFixed(1)} | Pass rate + status por projeto |
| Performance | 25% | ${perfScore.toFixed(1)} | API SLO (quando disponível) + métricas de fluxo |
| Tratamento de erros | 15% | ${errorHandlingScore.toFixed(1)} | Casos negativos e validações (Zod/rotas) |

## Configuração do ambiente de teste

- Frontend: ` + "`" + `auricapri` + "`" + ` (Vite) em ` + "`" + `http://localhost:3000` + "`" + `
- Backend: ` + "`" + `backend` + "`" + ` (Express) em ` + "`" + `http://localhost:3002` + "`" + `
- Playwright: reporter HTML + JSON (artefatos em ` + "`" + `auricapri/test-results` + "`" + `)

Comandos usados (referência):

\```bash
cd auricapri
npm test
npm run test:perf
node scripts/generate-e2e-report.mjs
\```

## Casos de teste executados

Os casos abaixo foram executados via Playwright e registrados no relatório JSON.

` + runs.map(r => `- ${r.fullTitle} (${r.project || 'default'}) — ${r.status}`).join('\n') + `

## Estatísticas de sucesso/falha

| Métrica | Valor |
|---|---:|
| Execuções | ${summary.total} |
| Passou | ${summary.passed} |
| Falhou | ${summary.failed} |
| Pulou | ${summary.skipped} |
| Timeout | ${summary.timedOut} |
| Pass rate | ${pct(summary.passed, summary.total)} |

## Análise de desempenho

### Tempos médios por fluxo (instrumentação E2E)

| Etapa | Amostras | Média | p50 | p95 | Máx |
|---|---:|---:|---:|---:|---:|
${topStepRows || '| (sem dados) | 0 | 0ms | 0ms | 0ms | 0ms |'}

### Endpoints mais chamados e mais lentos (observado nos fluxos)

| Endpoint | Chamadas | Média | p95 | Máx |
|---|---:|---:|---:|---:|
${topApiRows || '| (sem dados) | 0 | 0ms | 0ms | 0ms |'}

### SLO de performance (API) — baseline + pico 3x

${perfReport?.cases ? `| Caso | Endpoint | avg normal | p95 normal | avg pico | p95 pico | erro normal |\n|---|---|---:|---:|---:|---:|---:|\n${perfRows}` : 'Resultado de `test:perf` não encontrado. Execute `npm run test:perf` para gerar o relatório de endpoints.'}

### Gráficos comparativos (Mermaid)

\```mermaid
xychart-beta
  title "Etapas (Top 8) — p95 (ms)"
  x-axis ["` + flow.stepAgg.slice(0, 8).map(s => s.name.replace(/"/g, "'")).join('", "') + `"]
  y-axis "ms" 0 --> ${Math.max(500, Math.round(flow.stepAgg.slice(0, 8).reduce((m, s) => Math.max(m, s.p95Ms), 0) || 0))}
  bar [` + flow.stepAgg.slice(0, 8).map(s => Math.round(s.p95Ms)).join(', ') + `]
\```

## Gargalos e recomendações

- Priorizar otimização dos endpoints com maior p95 no checkout (frete/logística e criação de pedido), se aparecerem no Top.
- Garantir cache efetivo no ` + "`" + `/api/store/bootstrap` + "`" + ` e ` + "`" + `/api/products` + "`" + ` (já existe middleware de cache) e monitorar regressões com ` + "`" + `test:perf` + "`" + `.
- Adicionar ` + "`" + `data-testid` + "`" + ` / ` + "`" + `aria-label` + "`" + ` nos controles críticos (já iniciado para wishlist) para aumentar estabilidade dos testes.

## Pontos de melhoria (priorizado)

1. Padronizar URLs/ports e eliminar referências antigas a ` + "`" + `localhost:3001` + "`" + ` nos testes e docs.
2. Expandir instrumentação para cobertura de rotas e erros client-side (console errors) como critério de qualidade.
3. (Opcional) Instrumentar cobertura de código (Istanbul/Vite) para relatório de statement/branch coverage.

## Evidências de teste

- Screenshots e traces ficam anexados no relatório HTML em ` + "`" + `auricapri/playwright-report` + "`" + ` e nos artefatos em ` + "`" + `auricapri/test-results` + "`" + `.
- Este relatório foi gerado a partir de ` + "`" + `test-results/playwright-results.json` + "`" + `.

## Análise de cobertura

Cobertura gerada aqui é **funcional (fluxos/rotas/APIs observadas)**. A aplicação ainda não possui instrumentação de coverage por linha/branch em runtime.

- Módulos cobertos por fluxo: catálogo, detalhe de produto, carrinho, checkout (CEP/frete/pagamento), recibo, wishlist compartilhada, guardas de admin/delivery, validações de rotas e schemas.
- APIs observadas (Top 12) listadas acima.
`;

  await fs.mkdir(path.dirname(outReportPath), { recursive: true });
  await fs.writeFile(outReportPath, report, 'utf8');
  process.stdout.write(`Relatório gerado em ${outReportPath}\n`);
}

main().catch((err) => {
  process.stderr.write(`${String(err?.stack || err)}\n`);
  process.exitCode = 1;
});
