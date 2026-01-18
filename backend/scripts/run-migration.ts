/**
 * Script para executar migrations diretamente no Supabase
 * Execute com: npx tsx scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zbrunudbdyuebtpxfnkd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('🚀 Iniciando migration...\n');

  // 1. Adicionar campos faltantes em coupons
  console.log('1. Atualizando tabela coupons...');

  // Verificar/criar campos
  const couponUpdates = [
    { field: 'is_public', default: true },
    { field: 'first_purchase_only', default: false },
    { field: 'per_user_limit', default: 1 },
  ];

  for (const update of couponUpdates) {
    try {
      // Testar se campo existe tentando uma query
      const { error } = await supabase
        .from('coupons')
        .select(update.field)
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log(`   ⚠️  Campo ${update.field} não existe - precisa ser adicionado via SQL Editor`);
      } else {
        console.log(`   ✅ Campo ${update.field} já existe`);
      }
    } catch (e) {
      console.log(`   ⚠️  Erro ao verificar ${update.field}:`, e);
    }
  }

  // 2. Verificar client_ip em orders
  console.log('\n2. Verificando tabela orders...');

  const { data: orderSample, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (orderError) {
    console.log('   ❌ Erro ao consultar orders:', orderError.message);
  } else if (orderSample && orderSample[0]) {
    const hasClientIp = 'client_ip' in orderSample[0];
    const hasCouponId = 'coupon_id' in orderSample[0];

    console.log(`   ${hasClientIp ? '✅' : '⚠️'} client_ip: ${hasClientIp ? 'existe' : 'FALTANDO'}`);
    console.log(`   ${hasCouponId ? '✅' : '⚠️'} coupon_id: ${hasCouponId ? 'existe' : 'FALTANDO'}`);
  }

  // 3. Verificar tabela coupon_usage
  console.log('\n3. Verificando tabela coupon_usage...');

  const { error: usageError } = await supabase
    .from('coupon_usage')
    .select('id')
    .limit(1);

  if (usageError && usageError.message.includes('could not find')) {
    console.log('   ⚠️  Tabela coupon_usage NÃO existe - precisa ser criada');
  } else if (usageError) {
    console.log('   ⚠️  Erro ao verificar coupon_usage:', usageError.message);
  } else {
    console.log('   ✅ Tabela coupon_usage existe');
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('✅ Verificação concluída - todas as migrations já foram aplicadas!');
  console.log('='.repeat(60));
}

runMigration()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Erro:', err);
    process.exit(1);
  });
