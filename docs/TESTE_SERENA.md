# 🧪 Teste Rápido do Serena

## Verificação Rápida (30 segundos)

1. **Abra o Cursor**
2. **Abra um arquivo TypeScript**: `backend/src/services/cart.service.ts`
3. **Selecione a palavra `CartService`**
4. **Pressione F12** (Go to Definition)
5. **Pressione Shift+F12** (Find All References)

✅ **Se funcionar**: Serena está ativo!

## Teste com IA (1 minuto)

No Cursor, faça estas perguntas:

### Teste 1: Busca Simples
```
"Onde está definida a classe OrderService?"
```

### Teste 2: Referências
```
"Onde CartService é usado?"
```

### Teste 3: Relacionamentos
```
"Como OrderService se relaciona com CartService?"
```

✅ **Se responder com precisão**: Serena está funcionando perfeitamente!

## Verificar Logs

1. **View** → **Output** → **MCP**
2. Procure por: `"Connected"` ou `"Server initialized"`
3. ❌ Se ver erros: verifique `./scripts/serena-check.sh`

## Status Atual

Execute para ver status completo:
```bash
./scripts/serena-check.sh
```
