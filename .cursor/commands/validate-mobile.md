# Validar Mobile

Executa lint e verificação de tipos TypeScript no projeto mobile para garantir que não há erros.

## Script

```bash
./scripts/validate-mobile.sh
```

## Comandos Executados

1. `cd mobile && npm run lint`
2. Verificação de tipos TypeScript via `npx tsc --noEmit`

## Uso

Execute este comando quando finalizar uma tarefa que modificou código no mobile.

O script falhará se houver erros de lint ou type-check, garantindo que nenhum código com problemas seja considerado completo.
