# Configuração do Serena

Este diretório contém a configuração do [Serena MCP](https://github.com/oraios/serena) para o projeto Auricapri.

## Setup Rápido

Execute o script de setup completo:

```bash
./scripts/setup-serena.sh
```

Este script irá:
1. ✅ Instalar dependências (uv)
2. ✅ Verificar configuração
3. ✅ Testar o Serena
4. ✅ Mostrar próximos passos

## Configuração do Cursor

### Método Rápido (UI)

1. Abra **Settings** no Cursor (⌘, ou Ctrl+,)
2. Procure por **"Model Context Protocol"** ou **"MCP"**
3. Adicione servidor:
   - **Nome**: `serena`
   - **Comando**: `uvx`
   - **Args**: 
     ```
     --from
     git+https://github.com/oraios/serena
     serena
     start-mcp-server
     ```
4. Reinicie o Cursor

### Método Alternativo (Arquivo)

Use o arquivo de exemplo: `.cursor-mcp-config.json.example`

Copie para `.cursor/mcp.json` e ajuste os caminhos se necessário.

## Verificação

Para verificar se tudo está funcionando:

```bash
./scripts/serena-check.sh
```

## Documentação Completa

Veja `docs/SERENA_SETUP.md` para documentação completa, troubleshooting e exemplos de uso.
