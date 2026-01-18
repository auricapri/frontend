#!/bin/bash

# Wrapper script para executar o Serena MCP Server com ambiente correto
# Este script garante que todos os comandos necessários estejam no PATH

# Configurar PATH mínimo necessário
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/Users/marcuslirio/.local/bin"

# Configurar variáveis de ambiente do Serena
export SERENA_PROJECT_CONFIG="/Users/marcuslirio/Desktop/auricapri/.serena/project.yml"
export SERENA_WORKSPACE_ROOT="/Users/marcuslirio/Desktop/auricapri"

# Executar uvx com o Serena, ativando o projeto automaticamente
exec uvx --from git+https://github.com/oraios/serena serena start-mcp-server --project "$SERENA_WORKSPACE_ROOT" "$@"
