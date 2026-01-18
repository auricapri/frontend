# Validar Backend

Executa build e type-check no projeto backend para garantir que não há erros.

## Script

```bash
./scripts/validate-backend.sh
```

## Comandos Executados

1. `cd backend && npm run type-check`
2. `cd backend && npm run build`

## Uso

Execute este comando quando finalizar uma tarefa que modificou código no backend.

O script falhará se houver erros de type-check ou build, garantindo que nenhum código com problemas seja considerado completo.
