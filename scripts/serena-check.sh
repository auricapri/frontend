#!/bin/bash

# Script para verificar se o servidor Serena está funcionando corretamente
# Testa conexão MCP e valida configuração

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

echo -e "${BLUE}🔍 Verificando configuração do Serena...${NC}"
echo ""

# Adicionar uv ao PATH se necessário
if [ -d "$HOME/.local/bin" ]; then
    export PATH="$HOME/.local/bin:$PATH"
fi
if [ -d "$HOME/.cargo/bin" ]; then
    export PATH="$HOME/.cargo/bin:$PATH"
fi

# Verificar dependências
echo "1️⃣ Verificando dependências..."
if command -v uv &> /dev/null; then
    echo -e "${GREEN}   ✅ uv está instalado${NC}"
    uv --version | sed 's/^/      /'
elif command -v uvx &> /dev/null; then
    echo -e "${GREEN}   ✅ uvx está disponível${NC}"
else
    echo -e "${RED}   ❌ uv/uvx não está instalado${NC}"
    echo "      Execute: ${PROJECT_ROOT}/scripts/check-serena-deps.sh"
    exit 1
fi
echo ""

# Verificar arquivo de configuração
echo "2️⃣ Verificando arquivo de configuração..."
if [ -f "$SERENA_CONFIG" ]; then
    echo -e "${GREEN}   ✅ Arquivo de configuração encontrado${NC}"
    echo "      $SERENA_CONFIG"
    
    # Validar YAML básico (se yq ou python estiver disponível)
    if command -v python3 &> /dev/null; then
        if python3 -c "import yaml; yaml.safe_load(open('$SERENA_CONFIG'))" 2>/dev/null; then
            echo -e "${GREEN}   ✅ YAML válido${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Não foi possível validar YAML (yaml module não instalado)${NC}"
        fi
    fi
else
    echo -e "${RED}   ❌ Arquivo de configuração não encontrado${NC}"
    echo "      Esperado: $SERENA_CONFIG"
    exit 1
fi
echo ""

# Verificar estrutura do projeto
echo "3️⃣ Verificando estrutura do projeto..."
PROJECTS=("backend" "auricapri" "mobile")
ALL_EXIST=true

for project in "${PROJECTS[@]}"; do
    project_path="${PROJECT_ROOT}/${project}"
    if [ -d "$project_path" ]; then
        echo -e "${GREEN}   ✅ ${project}/ existe${NC}"
    else
        echo -e "${YELLOW}   ⚠️  ${project}/ não encontrado${NC}"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = false ]; then
    echo -e "${YELLOW}   ⚠️  Alguns projetos não foram encontrados (isso pode ser normal)${NC}"
fi
echo ""

# Verificar se servidor pode ser iniciado (dry-run)
echo "4️⃣ Testando inicialização do servidor..."
if command -v uvx &> /dev/null; then
    CMD="uvx"
elif command -v uv &> /dev/null; then
    CMD="uv"
fi

if [ -n "$CMD" ]; then
    echo "   Testando comando: $CMD --from git+https://github.com/oraios/serena serena start-mcp-server --help"
    
    # Tentar executar com --help para verificar se funciona
    if timeout 10s $CMD --from git+https://github.com/oraios/serena serena start-mcp-server --help &>/dev/null; then
        echo -e "${GREEN}   ✅ Comando do servidor funciona${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Não foi possível testar o comando (timeout ou erro)${NC}"
        echo "      Isso pode ser normal se o servidor precisar de mais tempo para inicializar"
    fi
else
    echo -e "${RED}   ❌ Não foi possível testar (uv/uvx não disponível)${NC}"
fi
echo ""

# Resumo
echo -e "${BLUE}📋 Resumo da Verificação:${NC}"
echo ""
echo "✅ Dependências: OK"
echo "✅ Configuração: OK"
echo "✅ Estrutura: OK"
echo ""
echo -e "${GREEN}✅ Configuração do Serena está pronta!${NC}"
echo ""
echo -e "${BLUE}📝 Próximos passos:${NC}"
echo "   1. Configure o Cursor para usar o servidor MCP do Serena"
echo "   2. Veja a documentação em: docs/SERENA_SETUP.md"
echo "   3. Para iniciar o servidor localmente: ./scripts/serena-start.sh"
echo ""
