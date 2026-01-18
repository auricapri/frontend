# Como Ativar o Projeto no Serena

## Problema

Se você ver nos logs do Serena "Available projects: " (vazio), significa que o projeto não está ativo. O Serena precisa que o projeto seja explicitamente ativado para funcionar.

## Solução

O wrapper script foi atualizado para ativar o projeto automaticamente usando o argumento `--project`.

## Verificar se Está Funcionando

1. **Reinicie o Cursor** completamente (Cmd+Q e abra novamente)
2. **Verifique os logs do MCP** (View → Output → MCP)
3. Procure por: `"Available projects: auricapri"` ou similar
4. **Teste uma pergunta**: "Onde está definida a classe CartService?"

## Se Ainda Não Funcionar

### Método 1: Ativar Manualmente via Dashboard

1. Abra o dashboard do Serena: http://127.0.0.1:24283/dashboard/index.html
2. Vá em "Projects"
3. Clique em "Activate" no projeto auricapri

### Método 2: Usar Argumento --project

Atualize o wrapper script para incluir o argumento:

```bash
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --project /Users/marcuslirio/Desktop/auricapri
```

### Método 3: Registrar na Configuração Global

Edite `~/.serena/serena_config.yml` e adicione:

```yaml
projects:
  - name: auricapri
    path: /Users/marcuslirio/Desktop/auricapri
```

## Status Atual

O wrapper script já foi atualizado para ativar o projeto automaticamente. Reinicie o Cursor para aplicar as mudanças.
