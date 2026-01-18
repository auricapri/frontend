#!/bin/bash

# Script para verificar e instalar dependências do Serena
# Serena requer o gerenciador de pacotes Python 'uv'

set -e

echo "🔍 Verificando dependências do Serena..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se uv está instalado
check_uv() {
    if command -v uv &> /dev/null; then
        echo -e "${GREEN}✅ uv está instalado${NC}"
        uv --version
        return 0
    else
        echo -e "${YELLOW}⚠️  uv não está instalado${NC}"
        return 1
    fi
}

# Instalar uv via curl (método recomendado)
install_uv_curl() {
    echo "📦 Instalando uv via curl..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    
    # Adicionar ao PATH se necessário
    if [ -f "$HOME/.local/bin/uv" ]; then
        export PATH="$HOME/.local/bin:$PATH"
        echo "✅ uv instalado em ~/.local/bin/uv"
        
        # Tentar adicionar ao shell profile automaticamente
        add_to_path "$HOME/.local/bin"
    elif [ -f "$HOME/.cargo/bin/uv" ]; then
        export PATH="$HOME/.cargo/bin:$PATH"
        echo "✅ uv instalado em ~/.cargo/bin/uv"
        add_to_path "$HOME/.cargo/bin"
    fi
}

# Adicionar ao PATH no shell profile
add_to_path() {
    local path_to_add="$1"
    local shell_profile=""
    
    # Detectar shell e profile
    if [ -n "$ZSH_VERSION" ]; then
        shell_profile="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        shell_profile="$HOME/.bashrc"
    else
        shell_profile="$HOME/.profile"
    fi
    
    # Verificar se já está no PATH
    if grep -q "$path_to_add" "$shell_profile" 2>/dev/null; then
        echo "✅ PATH já configurado em $shell_profile"
        return 0
    fi
    
    # Adicionar ao profile
    echo "" >> "$shell_profile"
    echo "# Added by Serena setup script" >> "$shell_profile"
    echo "export PATH=\"$path_to_add:\$PATH\"" >> "$shell_profile"
    echo "✅ Adicionado ao PATH em $shell_profile"
    echo "💡 Execute 'source $shell_profile' ou reinicie o terminal"
}

# Instalar uv via pip (alternativa)
install_uv_pip() {
    echo "📦 Instalando uv via pip..."
    if command -v pip &> /dev/null; then
        pip install uv
    elif command -v pip3 &> /dev/null; then
        pip3 install uv
    else
        echo -e "${RED}❌ pip não encontrado. Por favor, instale Python e pip primeiro.${NC}"
        return 1
    fi
}

# Verificar Python
check_python() {
    if command -v python3 &> /dev/null; then
        echo -e "${GREEN}✅ Python3 está instalado${NC}"
        python3 --version
        return 0
    else
        echo -e "${RED}❌ Python3 não está instalado${NC}"
        echo "Por favor, instale Python3 primeiro:"
        echo "  macOS: brew install python3"
        echo "  Linux: sudo apt-get install python3 python3-pip"
        return 1
    fi
}

# Main
main() {
    if check_uv; then
        echo -e "${GREEN}✅ Todas as dependências estão instaladas!${NC}"
        exit 0
    fi
    
    echo "📋 uv não está instalado. Vamos instalar..."
    
    # Verificar Python primeiro
    if ! check_python; then
        exit 1
    fi
    
    # Tentar instalar via curl primeiro (método recomendado)
    if install_uv_curl; then
        if check_uv; then
            echo -e "${GREEN}✅ uv instalado com sucesso!${NC}"
            exit 0
        fi
    fi
    
    # Se curl falhar, tentar pip
    echo "🔄 Tentando método alternativo (pip)..."
    if install_uv_pip; then
        if check_uv; then
            echo -e "${GREEN}✅ uv instalado com sucesso via pip!${NC}"
            exit 0
        fi
    fi
    
    echo -e "${RED}❌ Falha ao instalar uv${NC}"
    echo "Por favor, instale manualmente:"
    echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
}

main "$@"
