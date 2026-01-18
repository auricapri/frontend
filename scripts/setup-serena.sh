#!/bin/bash

# Script completo de setup do Serena
# Executa todas as etapas necessárias para configurar o Serena

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🚀 Setup Completo do Serena MCP${NC}"
echo ""

# Passo 1: Instalar dependências
echo -e "${BLUE}📦 Passo 1: Instalando dependências...${NC}"
"${PROJECT_ROOT}/scripts/check-serena-deps.sh"

# Adicionar ao PATH
if [ -d "$HOME/.local/bin" ]; then
    export PATH="$HOME/.local/bin:$PATH"
fi
if [ -d "$HOME/.cargo/bin" ]; then
    export PATH="$HOME/.cargo/bin:$PATH"
fi

echo ""

# Passo 2: Verificar configuração
echo -e "${BLUE}🔍 Passo 2: Verificando configuração...${NC}"
"${PROJECT_ROOT}/scripts/serena-check.sh"

echo ""

# Passo 3: Testar Serena
echo -e "${BLUE}🧪 Passo 3: Testando Serena...${NC}"
if command -v uvx &> /dev/null || command -v uv &> /dev/null; then
    echo "   Testando comando do Serena..."
    if uvx --from git+https://github.com/oraios/serena serena --help &>/dev/null; then
        echo -e "${GREEN}   ✅ Serena está funcionando!${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Não foi possível testar (pode ser normal na primeira execução)${NC}"
    fi
else
    echo -e "${RED}   ❌ uv/uvx não encontrado no PATH${NC}"
fi

echo ""

# Passo 4: Informações finais
echo -e "${BLUE}📋 Passo 4: Configuração do Cursor${NC}"
echo ""
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo ""
echo "1. Configure o Cursor para usar o Serena MCP:"
echo "   - Abra Settings (⌘, ou Ctrl+,)"
echo "   - Procure por 'Model Context Protocol' ou 'MCP'"
echo "   - Adicione servidor com:"
echo "     Comando: uvx"
echo "     Args: --from git+https://github.com/oraios/serena serena start-mcp-server"
echo ""
echo "2. Ou use o arquivo de exemplo:"
echo "   .cursor-mcp-config.json.example"
echo ""
echo "3. Reinicie o Cursor após configurar"
echo ""
echo "4. Veja a documentação completa em:"
echo "   docs/SERENA_SETUP.md"
echo ""
