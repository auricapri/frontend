# Screenshots da Aplicação

Este diretório contém screenshots automáticos gerados pelo Playwright para documentação visual da aplicação.

## 📁 Estrutura de Diretórios

- `full/` - Screenshots da documentação completa
- `complete/` - Screenshots da navegação completa com scroll
- `user-flow/` - Screenshots do fluxo de cadastro e endereço

## 🚀 Como gerar os screenshots

```bash
# Documentação básica (com navegador visível)
npm run docs:headed

# Documentação básica (headless)
npm run docs

# Documentação completa
npm run docs:full

# Navegação completa (todas as telas com scroll)
npm run docs:complete

# Fluxo do usuário (cadastro e endereço)
npm run docs:user-flow

# Todos os testes de documentação
npm run docs:all
```

## 📸 Galeria de Screenshots

### Homepage

![Homepage Completa](full/01-homepage-inicial.png)

### Navbar

![Navbar](full/10-navbar.png)

### Autenticação

![Auth Drawer](full/14-auth-aberto.png)

### Checkout

![Checkout](full/16-checkout.png)

### Mobile

![Mobile Homepage](full/20-mobile-homepage.png)

### Tablet

![Tablet Homepage](full/22-tablet-homepage.png)

## 📊 Estatísticas

Os screenshots são organizados por tipo:

- **Documentação Completa**: Screenshots das principais funcionalidades
- **Navegação Completa**: Screenshots de todas as rotas com scroll progressivo
- **Fluxo do Usuário**: Screenshots do processo de cadastro e checkout

## 🔄 Atualização

Os screenshots são atualizados automaticamente quando você executa os comandos acima.

Para atualizar manualmente, execute:

```bash
npm run docs:all
```

