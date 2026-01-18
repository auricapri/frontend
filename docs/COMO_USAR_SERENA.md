# Como o Serena Funciona e Como Verificar se Está Funcionando

## 🧠 Como o Serena Funciona

### Conceito Básico

O **Serena** é um servidor MCP (Model Context Protocol) que fornece **navegação semântica** e **edição inteligente** de código. Diferente de uma busca simples por texto, o Serena:

1. **Entende a estrutura do código**: Analisa TypeScript/JavaScript usando Language Servers (LSP)
2. **Mapeia relacionamentos**: Identifica onde classes, funções e tipos são usados
3. **Fornece contexto semântico**: Entende o significado do código, não apenas palavras-chave
4. **Navega entre projetos**: Conecta backend, frontend e mobile de forma unificada

### Arquitetura

```
Cursor (IDE)
    ↓
MCP Protocol
    ↓
Serena MCP Server
    ↓
Language Server (TypeScript/JavaScript)
    ↓
Seu Código (Auricapri)
```

### O que o Serena Faz

- **Busca de Símbolos**: Encontra definições de classes, funções, tipos
- **Referências**: Lista todos os lugares onde um símbolo é usado
- **Navegação**: Move entre arquivos relacionados semanticamente
- **Edição Contextual**: Entende dependências antes de editar
- **Análise de Tipos**: Compreende interfaces e tipos TypeScript

## ✅ Como Verificar se Está Funcionando

### Método 1: Verificar Logs do Cursor

1. Abra o Cursor
2. Vá em **View** → **Output** (ou `Cmd+Shift+U`)
3. Selecione **"MCP"** ou **"serena"** no dropdown
4. Procure por mensagens como:
   - ✅ `"Server initialized"` ou `"Connected to serena"`
   - ❌ Erros como `"realpath: command not found"` (já corrigido)

### Método 2: Testar Comandos no Cursor

Abra o Cursor e faça perguntas sobre o código. Se o Serena estiver funcionando, você verá:

#### Teste 1: Buscar Definição
```
"Onde está definida a classe CartService?"
```

**Resultado esperado**: O Cursor deve abrir `backend/src/services/cart.service.ts` e mostrar a definição.

#### Teste 2: Encontrar Referências
```
"Onde CartService é usado no projeto?"
```

**Resultado esperado**: O Cursor deve listar todos os arquivos que usam `CartService`, como:
- `backend/src/api/routes/cart.routes.ts`
- Outros arquivos que importam ou usam `CartService`

#### Teste 3: Navegação Semântica
```
"Como o OrderService se relaciona com CartService?"
```

**Resultado esperado**: O Cursor deve explicar a relação entre os serviços, mostrando:
- Como `OrderService` usa `CartService`
- Fluxo de dados entre eles
- Arquivos relacionados

#### Teste 4: Busca por Significado
```
"Encontre todos os lugares onde pedidos são criados de forma assíncrona"
```

**Resultado esperado**: O Cursor deve encontrar código que:
- Cria pedidos
- Usa async/await
- Processa de forma assíncrona

### Método 3: Verificar Status do Servidor

Execute no terminal:

```bash
# Verificar se o wrapper script funciona
./scripts/serena-mcp-wrapper.sh --help

# Verificar configuração
./scripts/serena-check.sh
```

### Método 4: Testar Manualmente

1. **Abra um arquivo TypeScript** no projeto (ex: `backend/src/services/cart.service.ts`)
2. **Selecione uma classe ou função** (ex: `CartService`)
3. **Use "Go to Definition"** (F12 ou Cmd+Click)
4. **Use "Find All References"** (Shift+F12)

Se o Serena estiver funcionando, essas ações serão mais precisas e rápidas.

## 🎯 Exemplos Práticos de Uso no Auricapri

### Exemplo 1: Entender Fluxo de Pedidos

**Pergunta**: "Como funciona o fluxo completo de criação de pedidos?"

**O que o Serena faz**:
1. Encontra `OrderService.createOrder()`
2. Rastreia dependências: `OrdersRepository`, `StockService`, `LoyaltyService`
3. Mostra rotas relacionadas: `orders.routes.ts`
4. Conecta com frontend: componentes de checkout

### Exemplo 2: Refatorar Código

**Pergunta**: "Renomeie `TrackingEvent` para `TrackingEventData` em todo o projeto"

**O que o Serena faz**:
1. Encontra todas as definições do tipo
2. Lista todos os usos (imports, tipos, interfaces)
3. Refatora de forma segura mantendo consistência
4. Atualiza arquivos relacionados automaticamente

### Exemplo 3: Encontrar Dependências

**Pergunta**: "Quais serviços dependem do CartService?"

**O que o Serena faz**:
1. Busca por imports de `CartService`
2. Lista arquivos que instanciam ou usam a classe
3. Mostra a hierarquia de dependências
4. Identifica possíveis problemas de acoplamento

### Exemplo 4: Navegar Entre Projetos

**Pergunta**: "Como o frontend chama a API de carrinho?"

**O que o Serena faz**:
1. Encontra `CartService` no backend
2. Localiza rotas em `cart.routes.ts`
3. Busca chamadas no frontend (`auricapri/src/api/cart.api.ts`)
4. Mostra o fluxo completo frontend → backend

## 🔍 Sinais de que Está Funcionando

### ✅ Funcionando Corretamente

- Cursor responde rapidamente a perguntas sobre código
- Navegação entre arquivos é precisa
- "Go to Definition" funciona corretamente
- "Find References" encontra todos os usos
- Refatorações são aplicadas consistentemente
- Logs do MCP mostram conexão estabelecida

### ❌ Não Está Funcionando

- Cursor não encontra definições
- "Find References" retorna vazio ou incorreto
- Erros nos logs do MCP
- Respostas genéricas sem contexto do código
- Navegação não funciona entre arquivos relacionados

## 🛠️ Troubleshooting

### Problema: Cursor não encontra símbolos

**Solução**:
1. Verifique logs do MCP no Cursor
2. Reinicie o Cursor
3. Execute `./scripts/serena-check.sh` para validar
4. Verifique se o arquivo `.serena/project.yml` está correto

### Problema: Navegação lenta

**Solução**:
1. Verifique se `node_modules` está nas exclusões
2. Reduza `max_context_size` em `.serena/project.yml`
3. Exclua mais diretórios grandes (dist, logs)

### Problema: Erros nos logs

**Solução**:
1. Verifique se o wrapper script tem permissão de execução: `chmod +x scripts/serena-mcp-wrapper.sh`
2. Verifique se `uvx` está no PATH
3. Execute manualmente: `./scripts/serena-mcp-wrapper.sh --help`

## 📊 Comparação: Com vs Sem Serena

### Sem Serena
- Busca por texto simples
- Navegação manual entre arquivos
- Refatorações propensas a erros
- Não entende relacionamentos

### Com Serena
- Busca semântica inteligente
- Navegação automática entre relacionamentos
- Refatorações seguras e consistentes
- Entende arquitetura do projeto

## 🎓 Dicas de Uso

1. **Seja específico**: "Onde `CartService.addItem` é chamado?" é melhor que "cart"
2. **Use contexto**: "Como o sistema de tracking se relaciona com marketing?"
3. **Peça explicações**: "Explique como funciona o OrderService"
4. **Refatore com segurança**: "Renomeie X para Y em todo o projeto"
5. **Explore dependências**: "Quais serviços dependem de StockService?"

## 📚 Recursos Adicionais

- Documentação oficial: https://oraios.github.io/serena/
- Repositório: https://github.com/oraios/serena
- Guia de setup: `docs/SERENA_SETUP.md`
