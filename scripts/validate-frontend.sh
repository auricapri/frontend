#!/bin/bash

set -e

echo "🔍 Validando Frontend (auricapri)..."
echo ""

cd "$(dirname "$0")/../auricapri" || exit 1

echo "📦 Executando build..."
npm run build

echo ""
echo "🔎 Verificando tipos TypeScript..."
npx tsc --noEmit

echo ""
echo "✅ Frontend validado com sucesso!"
