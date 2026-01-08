# Documentação Visual da Aplicação

Bem-vindo à documentação visual completa da aplicação Auricapri, gerada automaticamente pelo Playwright.

## 📚 Documentações Disponíveis

### 1. [Documentação Completa](./DOCUMENTACAO_COMPLETA.md)
Documentação abrangente de todas as funcionalidades e páginas da aplicação.

![Homepage](screenshots/full/01-homepage-inicial.png)

### 2. [Navegação Completa](./NAVEGACAO_COMPLETA.md)
Navegação automatizada por todas as telas com scroll progressivo.

![Navegação](screenshots/complete/00-homepage-topo.png)

### 3. [Fluxo do Usuário](./FLUXO_USUARIO.md)
Simulação completa do cadastro e preenchimento de endereço.

![Fluxo](screenshots/user-flow/01-homepage.png)

### 4. [Documentação Visual](./DOCUMENTACAO_VISUAL.md)
Documentação visual básica das principais telas.

## 🎯 Visão Geral

Esta documentação foi gerada automaticamente usando Playwright para:

- ✅ Capturar screenshots de todas as páginas
- ✅ Documentar o fluxo completo do usuário
- ✅ Testar diferentes viewports (mobile, tablet, desktop)
- ✅ Simular interações (cadastro, login, checkout)
- ✅ Gerar relatórios automáticos

## 🚀 Comandos Rápidos

```bash
# Gerar toda a documentação
npm run docs:all

# Documentação completa
npm run docs:complete

# Fluxo do usuário
npm run docs:user-flow

# Documentação básica
npm run docs
```

## 📸 Galeria de Screenshots

> 📖 **[Ver Galeria Completa](./GALERIA.md)** - Todas as imagens em um só lugar

### Preview Rápido

#### Homepage
![Homepage](screenshots/full/01-homepage-inicial.png)

#### Navbar
![Navbar](screenshots/full/10-navbar.png)

#### Autenticação
![Auth](screenshots/full/14-auth-aberto.png)

#### Checkout
![Checkout](screenshots/full/16-checkout.png)

#### Mobile
![Mobile](screenshots/full/20-mobile-homepage.png)

#### Tablet
![Tablet](screenshots/full/22-tablet-homepage.png)

## 📂 Estrutura de Diretórios

```
docs/
├── README.md (este arquivo)
├── DOCUMENTACAO_COMPLETA.md
├── NAVEGACAO_COMPLETA.md
├── FLUXO_USUARIO.md
├── DOCUMENTACAO_VISUAL.md
└── screenshots/
    ├── full/          # Documentação completa
    ├── complete/       # Navegação completa
    └── user-flow/      # Fluxo do usuário
```

## 🔄 Atualização

Para atualizar toda a documentação visual:

```bash
npm run docs:all
```

Isso irá:
1. Navegar por todas as telas
2. Fazer scroll em cada página
3. Simular cadastro e preenchimento de endereço
4. Capturar screenshots de tudo
5. Gerar relatórios atualizados

## 📝 Notas

- Os screenshots são atualizados a cada execução
- Alguns screenshots podem variar dependendo dos dados disponíveis
- Os formulários são preenchidos mas não submetidos (para evitar dados de teste)

## 🎨 Visualização

Todas as imagens estão incluídas nos arquivos Markdown e aparecerão automaticamente no preview do editor ou em visualizadores Markdown.

