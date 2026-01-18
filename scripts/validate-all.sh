#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔍 Validando todos os projetos..."
echo ""

VALIDATION_FAILED=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Validando Frontend (auricapri)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if ! "$SCRIPT_DIR/validate-frontend.sh"; then
  VALIDATION_FAILED=1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  Validando Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if ! "$SCRIPT_DIR/validate-backend.sh"; then
  VALIDATION_FAILED=1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Validando Mobile"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if ! "$SCRIPT_DIR/validate-mobile.sh"; then
  VALIDATION_FAILED=1
fi

echo ""
if [ $VALIDATION_FAILED -eq 1 ]; then
  echo "❌ Validação falhou em um ou mais projetos!"
  exit 1
else
  echo "✅ Todos os projetos foram validados com sucesso!"
  exit 0
fi
