
import { encrypt } from './src/utils/crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MASTER_KEY = process.env.MASTER_KEY;

if (!MASTER_KEY || MASTER_KEY.length !== 32) {
  console.error('ERRO: MASTER_KEY deve estar definida no .env e ter exatamente 32 caracteres.');
  process.exit(1);
}

const keyToEncrypt = process.argv[2];
const valueToEncrypt = process.argv[3];

if (!keyToEncrypt || !valueToEncrypt) {
  console.log('Uso: npx ts-node encrypt-key.ts <NOME_DA_CHAVE> <VALOR>');
  console.log('Exemplo: npx ts-node encrypt-key.ts OPEN_WEATHER_MAP_API_KEY abc123xyz');
  process.exit(0);
}

try {
  const encryptedValue = encrypt(valueToEncrypt, MASTER_KEY);
  console.log('\n--- RESULTADO DA CRIPTOGRAFIA ---');
  console.log(`${keyToEncrypt}=${encryptedValue}`);
  console.log('---------------------------------\n');
  console.log('Copie a linha acima e substitua no seu arquivo .env');
} catch (err: unknown) {
  console.error('Erro ao criptografar:', err instanceof Error ? err.message : String(err));
}
