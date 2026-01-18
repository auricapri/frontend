#!/bin/bash

# Script para iniciar o servidor MCP do Serena localmente
# Útil para desenvolvimento e testes

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERENA_CONFIG="${PROJECT_ROOT}/.serena/project.yml"

echo -e "${BLUE}🚀 Iniciando servidor MCP do Serena...${NC}"
echo ""

# Adicionar uv ao PATH se necessário
if [ -d "$HOME/.local/bin" ]; then
    export PATH="$HOME/.local/bin:$PATH"
fi
if [ -d "$HOME/.cargo/bin" ]; then
    export PATH="$HOME/.cargo/bin:$PATH"
fi

# Verificar dependências
echo "🔍 Verificando dependências..."
if ! command -v uv &> /dev/null && ! command -v uvx &> /dev/null; then
    echo -e "${RED}❌ uv não está instalado${NC}"
    echo "Executando script de instalação..."
    "${PROJECT_ROOT}/scripts/check-serena-deps.sh"
    
    # Adicionar ao PATH novamente após instalação
    if [ -d "$HOME/.local/bin" ]; then
        export PATH="$HOME/.local/bin:$PATH"
    fi
    if [ -d "$HOME/.cargo/bin" ]; then
        export PATH="$HOME/.cargo/bin:$PATH"
    fi
    
    # Verificar novamente após tentativa de instalação
    if ! command -v uv &> /dev/null && ! command -v uvx &> /dev/null; then
        echo -e "${RED}❌ Falha ao instalar uv. Por favor, instale manualmente.${NC}"
        exit 1
    fi
fi

# Verificar se configuração existe
if [ ! -f "$SERENA_CONFIG" ]; then
    echo -e "${YELLOW}⚠️  Arquivo de configuração não encontrado: ${SERENA_CONFIG}${NC}"
    echo "Criando configuração padrão..."
    # O arquivo já deve existir, mas vamos verificar
    exit 1
fi

echo -e "${GREEN}✅ Configuração encontrada: ${SERENA_CONFIG}${NC}"
echo ""

# Determinar comando (uvx ou uv)
if command -v uvx &> /dev/null; then
    CMD="uvx"
    echo -e "${GREEN}✅ Usando uvx (execução direta)${NC}"
elif command -v uv &> /dev/null; then
    CMD="uv"
    echo -e "${GREEN}✅ Usando uv${NC}"
else
    echo -e "${RED}❌ Nem uv nem uvx estão disponíveis${NC}"
    exit 1
fi

# Configurar variáveis de ambiente
export SERENA_PROJECT_CONFIG="$SERENA_CONFIG"
export SERENA_WORKSPACE_ROOT="$PROJECT_ROOT"

echo ""
echo -e "${BLUE}📋 Configuração:${NC}"
echo "  Workspace: $PROJECT_ROOT"
echo "  Config: $SERENA_CONFIG"
echo ""

# Iniciar servidor
echo -e "${BLUE}🚀 Iniciando servidor MCP do Serena...${NC}"
echo "  Comando: $CMD --from git+https://github.com/oraios/serena serena start-mcp-server"
echo ""
echo -e "${YELLOW}💡 Dica: Configure o Cursor para usar este servidor MCP${NC}"
echo -e "${YELLOW}💡 Pressione Ctrl+C para parar o servidor${NC}"
echo ""

# Executar servidor
if [ "$CMD" = "uvx" ]; then
    exec uvx --from git+https://github.com/oraios/serena serena start-mcp-server
else
    exec uv run --from git+https://github.com/oraios/serena serena start-mcp-server
fi
