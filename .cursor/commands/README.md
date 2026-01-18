# Comandos do Cursor

Este diretório contém comandos personalizados para o Cursor IDE que ajudam a validar o código antes de finalizar tarefas.

## Comandos Disponíveis

### validate-all
Valida todos os projetos (frontend, backend, mobile) executando build e lint.

**Uso**: Execute quando modificar código em múltiplos projetos ou precisar validar todo o monorepo.

### validate-frontend
Valida apenas o projeto frontend (auricapri) executando build e type-check.

**Uso**: Execute quando modificar código apenas no frontend.

### validate-backend
Valida apenas o projeto backend executando type-check e build.

**Uso**: Execute quando modificar código apenas no backend.

### validate-mobile
Valida apenas o projeto mobile executando lint e type-check.

**Uso**: Execute quando modificar código apenas no mobile.

## Scripts Shell

Os comandos utilizam scripts shell localizados em `scripts/`:
- `scripts/validate-all.sh`
- `scripts/validate-frontend.sh`
- `scripts/validate-backend.sh`
- `scripts/validate-mobile.sh`

## Regras Importantes

⚠️ **NUNCA** considere uma tarefa completa sem executar a validação apropriada.

⚠️ **SEMPRE** corrija todos os erros antes de finalizar uma tarefa.

⚠️ **NUNCA** entregue código com erros de build, lint ou type-check.
