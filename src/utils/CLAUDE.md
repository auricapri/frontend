# Utils — Regras

## Funções Existentes — NÃO RECRIAR

### `src/utils/image.ts` — Imagens
```typescript
// URL otimizada para tamanho específico (Supabase image transforms)
getOptimizedImageUrl(url, 'medium')
// sizes: thumbnail(300w) | small(450w) | medium(600w) | large(900w) | xlarge(1200w)

// srcSet responsivo completo
generateSrcSet(url, ['thumbnail', 'small', 'medium', 'large'])

// String de sizes para <img sizes="">
CARD_SIZES  // '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'

// Placeholder SVG inline
PLACEHOLDER_IMAGE

// Handler de erro para <img>
handleImageError(event)  // fallback para placeholder

// Verificar se é URL do Supabase Storage
isSupabaseStorageUrl(url)
```

### `src/utils/format.ts` (ou equivalente) — Formatação
```typescript
formatCurrency(value, locale)   // "R$ 99,90" ou "US$ 99.90"
```

## Padrão de Utilitário

```typescript
// src/utils/my-util.ts

// Funções puras — mesma entrada, mesma saída
export function myUtil(input: string): string {
  return input.trim().toLowerCase();
}

// Constantes exportadas
export const MY_CONSTANT = 'value';
```

## Regras

### OBRIGATÓRIO
- Funções puras (sem side effects, sem estado)
- Tipagem completa em parâmetros e retorno
- Um arquivo por domínio de utilitário
- Testes unitários para lógica complexa

### PROIBIDO
- Duplicar funções existentes (`getOptimizedImageUrl` já existe, não recriar)
- Funções com mais de uma responsabilidade
- Importar React ou hooks em utils (utils são agnósticos de framework)
- Estado global em utils
- Comentários para código autoexplicativo

## Antes de criar um novo util

1. Verificar se já existe em `src/utils/`
2. Verificar se já existe em `src/lib/`
3. Verificar se é responsabilidade de um hook (tem estado?)
4. Se é usado em apenas 1 lugar, colocar direto no arquivo que usa

---

## Changelog — Regra Global Obrigatória

Após **qualquer alteração** finalizada (código, configuração, dependências):

1. Atualizar `CHANGELOG.md` na raiz do repositório
2. Incrementar versão seguindo **Semantic Versioning** (`MAJOR.MINOR.PATCH`):
   - `PATCH` — bugfix, ajuste sem breaking change
   - `MINOR` — nova feature ou melhoria retrocompatível
   - `MAJOR` — breaking change, mudança de contrato de API ou refatoração arquitetural
3. Manter `README.md` atualizado com mudanças de API, setup ou deploy

**NUNCA** encerrar uma tarefa sem:
- [ ] `CHANGELOG.md` atualizado com as alterações da sessão
- [ ] Versão incrementada
- [ ] `README.md` refletindo o estado atual do projeto
