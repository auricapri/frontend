# Validar Todos os Projetos

Executa build e lint em todos os projetos (auricapri, backend, mobile) para garantir que não há erros antes de finalizar uma tarefa.

## Script

```bash
./scripts/validate-all.sh
```

## Comandos Executados

1. **Frontend (auricapri)**: `npm run build` e verificação de tipos TypeScript
2. **Backend**: `npm run type-check` e `npm run build`
3. **Mobile**: `npm run lint` e verificação de tipos TypeScript

## Uso

Execute este comando sempre que finalizar uma tarefa que modificou código em múltiplos projetos ou quando precisar validar todo o monorepo.

O script falhará se qualquer projeto tiver erros, garantindo que nenhum código com problemas seja considerado completo.
