#!/bin/bash

set -e

echo "🔍 Validando Backend..."
echo ""

cd "$(dirname "$0")/../backend" || exit 1

echo "🔎 Verificando tipos TypeScript..."
npm run type-check

echo ""
echo "📦 Executando build..."
npm run build

echo ""
echo "✅ Backend validado com sucesso!"
