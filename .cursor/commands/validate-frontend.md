# Validar Frontend (auricapri)

Executa build e verificação de tipos TypeScript no projeto frontend para garantir que não há erros.

## Script

```bash
./scripts/validate-frontend.sh
```

## Comandos Executados

1. `cd auricapri && npm run build`
2. Verificação de tipos TypeScript via `npx tsc --noEmit`

## Uso

Execute este comando quando finalizar uma tarefa que modificou código no frontend.

O script falhará se houver erros de build ou type-check, garantindo que nenhum código com problemas seja considerado completo.
