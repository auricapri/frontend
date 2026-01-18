
import dotenv from 'dotenv';
import { isEncrypted } from './src/utils/crypto';
import path from 'path';
import fs from 'fs';

dotenv.config();

const SENSITIVE_KEYS = [
  'OPEN_WEATHER_MAP_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'REDIS_URL'
];

console.log('\n--- VERIFICAÇÃO DE SEGURANÇA DE CREDENCIAIS ---');

let allSecure = true;

SENSITIVE_KEYS.forEach(key => {
  const value = process.env[key];
  if (!value) {
    console.log(`[INFO] ${key}: Não definida no ambiente.`);
    return;
  }

  if (isEncrypted(value)) {
    console.log(`[OK] ${key}: Criptografada.`);
  } else {
    console.warn(`[AVISO] ${key}: EXPOSTA (Não criptografada)!`);
    allSecure = false;
  }
});

if (allSecure) {
  console.log('\n✅ Todas as chaves sensíveis detectadas estão protegidas.');
} else {
  console.log('\n❌ Algumas chaves estão expostas. Use o script encrypt-key.ts para protegê-las.');
}
console.log('-----------------------------------------------\n');
