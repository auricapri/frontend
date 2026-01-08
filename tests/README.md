# Testes E2E com Playwright

Este diretório contém os testes end-to-end (E2E) da aplicação usando Playwright.

## Estrutura

- `example.spec.ts` - Testes básicos da homepage e navegação
- `auth.spec.ts` - Testes relacionados à autenticação

## Executando os Testes

```bash
# Executar todos os testes
npm run test

# Executar com UI interativa
npm run test:ui

# Executar em modo debug
npm run test:debug

# Executar com navegador visível
npm run test:headed

# Ver relatório HTML
npm run test:report
```

## Configuração

Os testes estão configurados para:
- Iniciar automaticamente o servidor de desenvolvimento (`npm run dev`)
- Executar em múltiplos navegadores (Chrome, Firefox, Safari)
- Testar em viewports mobile e desktop
- Gerar screenshots em caso de falha
- Gerar trace para debugging

## Adicionando Novos Testes

Crie novos arquivos `.spec.ts` neste diretório seguindo o padrão:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Seu teste aqui
  });
});
```

## Dicas

- Use `data-testid` nos componentes React para facilitar a seleção de elementos
- Use `page.waitForLoadState('networkidle')` para aguardar carregamento completo
- Use `page.waitForTimeout()` apenas quando necessário (prefira esperas baseadas em elementos)
- Capture screenshots e traces para debugging de falhas

