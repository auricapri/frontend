/**
 * Script para executar UMA migration no Supabase
 * Execute com: SUPABASE_ACCESS_TOKEN=seu_token npx tsx scripts/run-single-migration.ts nome_arquivo.sql
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_REF = 'zbrunudbdyuebtpxfnkd';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

if (!ACCESS_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN nao configurada');
  process.exit(1);
}

const filename = process.argv[2];
if (!filename) {
  console.error('Uso: npx tsx scripts/run-single-migration.ts arquivo.sql');
  process.exit(1);
}

async function executeSql(sql: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: errorText };
  }

  return { success: true };
}

async function run() {
  const filepath = path.join(__dirname, '..', 'migrations', filename);

  if (!fs.existsSync(filepath)) {
    console.error(`Arquivo nao encontrado: ${filepath}`);
    process.exit(1);
  }

  console.log(`Executando: ${filename}`);
  const sql = fs.readFileSync(filepath, 'utf-8');
  const result = await executeSql(sql);

  if (result.success) {
    console.log('OK - Migration executada com sucesso');
  } else {
    console.error('ERRO:', result.error);
    process.exit(1);
  }
}

run();
