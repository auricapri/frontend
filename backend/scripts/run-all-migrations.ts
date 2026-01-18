/**
 * Script para executar TODAS as migrations no Supabase
 * Execute com: SUPABASE_ACCESS_TOKEN=seu_token npx tsx scripts/run-all-migrations.ts
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
  console.error('Execute: SUPABASE_ACCESS_TOKEN=seu_token npx tsx scripts/run-all-migrations.ts');
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

async function runMigrations() {
  console.log('='.repeat(60));
  console.log('  AURICAPRI - Executando Migrations no Supabase');
  console.log('='.repeat(60));
  console.log(`Projeto: ${PROJECT_REF}\n`);

  // Lista de arquivos de migration em ordem
  const migrationFiles = [
    'create_cart_sessions.sql',
    'create_order_reviews.sql',
    'create_product_reviews.sql',
    'create_suppliers.sql',
    'create_delivery_tables.sql',
    'optimize_performance_indexes.sql',
    'create_tax_data_tables.sql',
    'create_tax_rule_tables.sql',
    'create_tax_calculation_history.sql',
    'create_tracking_events.sql',
    'create_tracking_aggregates.sql',
    'create_weather_marketing_tables.sql',
    'add_affiliate_code_to_profiles.sql',
    'add_missing_performance_indexes.sql',
  ];

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  let successCount = 0;
  let errorCount = 0;

  for (const filename of migrationFiles) {
    const filepath = path.join(migrationsDir, filename);

    if (!fs.existsSync(filepath)) {
      console.log(`[SKIP] ${filename} - arquivo nao encontrado`);
      continue;
    }

    console.log(`[...] Executando: ${filename}`);

    const sql = fs.readFileSync(filepath, 'utf-8');
    const result = await executeSql(sql);

    if (result.success) {
      console.log(`[OK]  ${filename}`);
      successCount++;
    } else {
      console.log(`[ERRO] ${filename}: ${result.error}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  Resultado: ${successCount} sucesso, ${errorCount} erros`);
  console.log('='.repeat(60));

  if (errorCount > 0) {
    process.exit(1);
  }
}

runMigrations()
  .then(() => {
    console.log('\nMigrations concluidas!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nErro fatal:', err);
    process.exit(1);
  });
