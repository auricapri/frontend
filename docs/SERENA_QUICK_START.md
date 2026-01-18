# Serena MCP - Guia Rápido

## ✅ Setup Completo em 1 Comando

```bash
./scripts/setup-serena.sh
```

## 🎯 Configurar no Cursor

1. **Settings** → **Model Context Protocol** (ou **MCP**)
2. **Add Server**:
   - Nome: `serena`
   - Comando: `uvx`
   - Args:
     ```
     --from
     git+https://github.com/oraios/serena
     serena
     start-mcp-server
     ```
3. **Reiniciar Cursor**

## ✅ Verificar

```bash
./scripts/serena-check.sh
```

## 📚 Documentação Completa

Veja `docs/SERENA_SETUP.md` para detalhes completos.

## 🚀 Uso

Após configurar, o Cursor terá acesso a:
- Navegação semântica entre arquivos
- Busca inteligente de código
- Edição contextual multi-arquivo
- Entendimento de dependências

**Exemplo**: "Encontre onde CartService é usado" ou "Refatore TrackingEvent em todo o projeto"
