import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const reportsDir = path.join(repoRoot, '.lint-reports');

const inputFiles = [
  { project: 'backend', file: path.join(reportsDir, 'eslint.backend.json') },
  { project: 'auricapri', file: path.join(reportsDir, 'eslint.auricapri.json') },
  { project: 'mobile', file: path.join(reportsDir, 'eslint.mobile.json') },
];

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function summarize(eslintJson) {
  const byRule = new Map();
  const bySeverity = new Map();
  let total = 0;

  for (const fileEntry of eslintJson) {
    for (const msg of fileEntry.messages || []) {
      total += 1;
      const ruleId = msg.ruleId || '(sem-regra)';
      byRule.set(ruleId, (byRule.get(ruleId) || 0) + 1);
      const sev = msg.severity === 2 ? 'error' : msg.severity === 1 ? 'warn' : 'other';
      bySeverity.set(sev, (bySeverity.get(sev) || 0) + 1);
    }
  }

  const rulesSorted = [...byRule.entries()].sort((a, b) => b[1] - a[1]);
  return { total, bySeverity: Object.fromEntries(bySeverity), rulesSorted };
}

function mdTable(rows) {
  const header = '| Regra | Ocorrências |\n|---|---:|\n';
  return header + rows.map(([rule, count]) => `| ${rule} | ${count} |`).join('\n') + '\n';
}

let out = '# Relatório de Lint (ESLint)\n\n';
out += `Gerado em: ${new Date().toISOString()}\n\n`;

for (const { project, file } of inputFiles) {
  const data = safeReadJson(file);
  out += `## ${project}\n`;
  out += `- Arquivo: ${path.relative(repoRoot, file)}\n`;
  if (!data) {
    out += '- Status: ausente (rode lint:report neste projeto)\n\n';
    continue;
  }
  const summary = summarize(data);
  out += `- Total: ${summary.total}\n`;
  out += `- Severidade: ${JSON.stringify(summary.bySeverity)}\n\n`;
  out += mdTable(summary.rulesSorted.slice(0, 30));
  out += '\n';
}

process.stdout.write(out);
