#!/bin/bash

set -e

echo "🔍 Validando Mobile..."
echo ""

cd "$(dirname "$0")/../mobile" || exit 1

echo ""
echo "🔎 Executando lint..."
npm run lint

if [ "${MOBILE_TYPECHECK:-0}" = "1" ]; then
  echo ""
  echo "🔎 Verificando tipos TypeScript..."
  npx tsc --noEmit
fi

echo ""
echo "✅ Mobile validado com sucesso!"
