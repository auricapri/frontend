# Guia de Configuração do Serena MCP

## O que é o Serena?

O [Serena](https://github.com/oraios/serena) é um toolkit poderoso de código que fornece capacidades de **recuperação semântica** e **edição de código** assistida por IA. Ele permite que agentes de IA naveguem e editem código de forma mais inteligente, entendendo a estrutura semântica do projeto, não apenas arquivos individuais.

### Benefícios para o Projeto Auricapri

- **Navegação semântica**: Encontrar símbolos, referências e dependências entre arquivos
- **Edição contextual**: Entender relações entre serviços, repositórios e rotas
- **Busca inteligente**: Localizar código por significado, não apenas por texto
- **Suporte TypeScript**: Análise completa de tipos e interfaces
- **Multi-projeto**: Navega entre backend, frontend e mobile de forma unificada

## Setup Rápido

Para configurar tudo automaticamente, execute:

```bash
./scripts/setup-serena.sh
```

Este script executa todas as etapas necessárias e mostra os próximos passos.

## Pré-requisitos

### 1. Instalar `uv` (Gerenciador de Pacotes Python)

O Serena é gerenciado pelo `uv`. Execute o script de verificação:

```bash
./scripts/check-serena-deps.sh
```

Este script irá:
- Verificar se `uv` está instalado
- Instalar automaticamente se necessário
- Adicionar ao PATH automaticamente
- Validar a instalação

**Instalação Manual (alternativa):**

```bash
# Via curl (recomendado)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Via pip
pip install uv
```

### 2. Verificar Python

O `uv` requer Python 3.8+. Verifique:

```bash
python3 --version
```

## Configuração do Projeto

### Arquivo de Configuração

O arquivo `.serena/project.yml` já está configurado para o projeto Auricapri com:

- **3 projetos**: backend, frontend (auricapri), mobile
- **Language Servers**: TypeScript para todos os projetos
- **Exclusões**: node_modules, dist, arquivos de teste
- **Contexto**: Configurações otimizadas para projetos grandes

### Verificar Configuração

Execute o script de verificação:

```bash
./scripts/serena-check.sh
```

Este script valida:
- Dependências instaladas
- Arquivo de configuração válido
- Estrutura do projeto
- Comando do servidor funcionando

## Configuração do Cursor

### Método 1: Via UI do Cursor (Recomendado)

1. Abra o Cursor
2. Vá em **Settings** (⌘, ou Ctrl+,)
3. Procure por **"Model Context Protocol"** ou **"MCP"**
4. Clique em **"Add Server"** ou **"Configure MCP"**
5. Adicione a seguinte configuração:

**Nome do Servidor**: `serena`

**Comando**: `uvx`

**Argumentos**:
```
--from
git+https://github.com/oraios/serena
serena
start-mcp-server
```

**Variáveis de Ambiente** (opcional):
```
SERENA_PROJECT_CONFIG=/Users/marcuslirio/Desktop/auricapri/.serena/project.yml
SERENA_WORKSPACE_ROOT=/Users/marcuslirio/Desktop/auricapri
```

### Método 2: Via Arquivo de Configuração

Se o Cursor suportar arquivo de configuração MCP, crie ou edite:

**Arquivo**: `.cursor/mcp.json` (na raiz do projeto)

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server"
      ],
      "env": {
        "SERENA_PROJECT_CONFIG": ".serena/project.yml",
        "SERENA_WORKSPACE_ROOT": "/Users/marcuslirio/Desktop/auricapri"
      }
    }
  }
}
```

**Nota**: Ajuste o caminho `SERENA_WORKSPACE_ROOT` para o caminho absoluto do seu projeto.

### Método 3: Usando Script Local

Se preferir iniciar o servidor manualmente:

```bash
./scripts/serena-start.sh
```

Depois configure o Cursor para conectar ao servidor local (normalmente via stdio).

## Verificação da Integração

Após configurar, verifique se o Serena está funcionando:

1. **Reinicie o Cursor** para carregar a nova configuração MCP
2. **Abra um arquivo TypeScript** no projeto
3. **Teste comandos de IA** que envolvem navegação de código
4. **Verifique logs do Cursor** para ver se o servidor MCP está conectado

### Testes Recomendados

1. **Buscar símbolo**: Peça ao Cursor para encontrar onde uma função é definida
2. **Navegar referências**: Peça para encontrar todos os usos de uma classe
3. **Editar contexto**: Peça para refatorar código que toca múltiplos arquivos
4. **Entender dependências**: Peça para explicar como um serviço se relaciona com outros

## Uso no Desenvolvimento

### Casos de Uso Comuns

#### 1. Navegação entre Serviços Relacionados

**Exemplo**: "Encontre onde `CartService` é usado no backend"

O Serena entende que:
- `CartService` está em `backend/src/services/cart.service.ts`
- É usado em `backend/src/api/routes/cart.routes.ts`
- Pode ter dependências em `CartRepository`

#### 2. Refatoração Multi-Arquivo

**Exemplo**: "Renomeie `TrackingEvent` para `TrackingEventData` em todo o projeto"

O Serena encontra todas as referências:
- Definição do tipo
- Imports e exports
- Uso em serviços e repositórios
- Testes relacionados

#### 3. Entender Arquitetura

**Exemplo**: "Como o sistema de tracking se relaciona com marketing?"

O Serena mapeia:
- `tracking.service.ts` → `tracking-queue.service.ts`
- `user-profile.service.ts` → `campaign-recommendation.service.ts`
- Fluxo de dados entre domínios

#### 4. Busca Semântica

**Exemplo**: "Encontre todos os lugares onde eventos são processados de forma assíncrona"

O Serena busca por:
- Padrões de async/await
- Uso de filas (Redis)
- Processamento em background
- Workers e schedulers

## Troubleshooting

### Problema: Servidor MCP não inicia

**Solução**:
1. Verifique se `uv` está instalado: `uv --version`
2. Execute o script de verificação: `./scripts/serena-check.sh`
3. Verifique logs do Cursor para erros específicos
4. Tente iniciar manualmente: `./scripts/serena-start.sh`

### Problema: Cursor não encontra símbolos

**Solução**:
1. Verifique se o arquivo `.serena/project.yml` está correto
2. Certifique-se de que os caminhos dos projetos estão corretos
3. Reinicie o Cursor
4. Verifique se os language servers TypeScript estão funcionando

### Problema: Performance lenta

**Solução**:
1. Verifique se `node_modules` está nas exclusões
2. Reduza o `max_context_size` em `.serena/project.yml`
3. Exclua mais diretórios grandes (dist, logs, etc.)
4. Use `uvx` em vez de instalação local (mais rápido)

### Problema: Erro "uvx not found"

**Solução**:
1. Instale `uv` primeiro: `./scripts/check-serena-deps.sh`
2. Adicione `~/.cargo/bin` ao PATH:
   ```bash
   export PATH="$HOME/.cargo/bin:$PATH"
   ```
3. Adicione ao seu `~/.zshrc` ou `~/.bashrc` para persistir

## Recursos Adicionais

### Documentação Oficial

- [Repositório GitHub](https://github.com/oraios/serena)
- [Documentação Completa](https://oraios.github.io/serena/)
- [Guia de Uso](https://oraios.github.io/serena/02-usage/)
- [Integração com LLMs](https://oraios.github.io/serena/01-about/010_llm-integration.html)

### Comandos Úteis

```bash
# Verificar dependências
./scripts/check-serena-deps.sh

# Verificar configuração
./scripts/serena-check.sh

# Iniciar servidor localmente
./scripts/serena-start.sh

# Testar comando do Serena diretamente
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --help
```

### Personalização

Você pode personalizar o comportamento do Serena editando `.serena/project.yml`:

- **Adicionar mais projetos**: Inclua novos projetos na lista
- **Ajustar exclusões**: Adicione padrões para ignorar arquivos
- **Configurar contexto**: Ajuste `max_context_size` para projetos maiores
- **Habilitar cross-project**: Ative `cross_project_references` para busca entre projetos

## Manutenção

### Atualizar Serena

O Serena é executado via `uvx`, que sempre usa a versão mais recente do GitHub. Para forçar atualização:

```bash
# Limpar cache do uvx
uvx --refresh --from git+https://github.com/oraios/serena serena start-mcp-server --help
```

### Verificar Versão

```bash
uvx --from git+https://github.com/oraios/serena serena --version
```

## Suporte

Se encontrar problemas:

1. Verifique os logs do Cursor (View → Output → MCP)
2. Execute `./scripts/serena-check.sh` para diagnóstico
3. Consulte a [documentação oficial](https://oraios.github.io/serena/)
4. Abra uma issue no [repositório do Serena](https://github.com/oraios/serena/issues)

## Conclusão

O Serena é uma ferramenta poderosa que melhora significativamente a capacidade de navegação e edição de código assistida por IA. Com esta configuração, o Cursor terá acesso a:

- Navegação semântica entre arquivos
- Busca inteligente de código
- Edição contextual baseada em estrutura
- Entendimento de dependências entre módulos

Isso é especialmente útil em projetos grandes como o Auricapri, onde múltiplos domínios e serviços se relacionam de forma complexa.
