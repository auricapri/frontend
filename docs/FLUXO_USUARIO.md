# Documentação - Fluxo do Usuário

Esta documentação mostra a simulação completa do fluxo de cadastro e preenchimento de endereço na aplicação.

## 🎯 O que é Simulado

O Playwright simula dois fluxos principais:

### 1. Cadastro Completo
- ✅ Abertura do drawer de autenticação
- ✅ Alternância para modo de cadastro
- ✅ Preenchimento do formulário de cadastro:
  - Nome completo
  - Email
  - Senha
- ✅ Navegação para checkout
- ✅ Preenchimento do formulário de endereço:
  - CEP (com busca automática)
  - Número
  - Complemento

### 2. Login e Endereço
- ✅ Abertura do drawer de autenticação
- ✅ Preenchimento do formulário de login:
  - Email
  - Senha
- ✅ Navegação para checkout
- ✅ Preenchimento do formulário de endereço

## 📸 Screenshots Gerados

### Fluxo de Cadastro

1. **Homepage inicial**
   ![Homepage](screenshots/user-flow/01-homepage.png)

2. **Drawer de autenticação aberto**
   ![Auth Drawer](screenshots/user-flow/02-auth-drawer-aberto.png)

3. **Formulário de cadastro completo**
   ![Cadastro Completo](screenshots/user-flow/07-formulario-cadastro-completo.png)

4. **Checkout inicial**
   ![Checkout Inicial](screenshots/user-flow/08-checkout-inicial.png)

5. **Formulário de endereço completo**
   ![Endereço Completo](screenshots/user-flow/12-endereco-completo.png)

6. **Checkout após scroll**
   ![Checkout Scroll](screenshots/user-flow/13-checkout-scroll.png)

7. **Checkout final**
   ![Checkout Final](screenshots/user-flow/14-checkout-final.png)

### Fluxo de Login

8. **Endereço preenchido após login**
   ![Endereço Login](screenshots/user-flow/17-endereco-login.png)

## 🚀 Como Executar

### Simular Fluxo do Usuário:
```bash
npm run docs:user-flow
```

### Executar Todos os Testes de Documentação:
```bash
npm run docs:all
```

## ⚙️ Dados de Teste Utilizados

### Cadastro:
- **Nome**: João Silva
- **Email**: teste{timestamp}@example.com (único a cada execução)
- **Senha**: senha123456

### Endereço:
- **CEP**: 01310-100 (Avenida Paulista, São Paulo)
- **Número**: 123
- **Complemento**: Apto 45

### Login:
- **Email**: usuario@example.com
- **Senha**: senha123456
- **CEP**: 04547-130
- **Número**: 456
- **Complemento**: Bloco B

## ⚠️ Notas Importantes

1. **Não Submete Dados Reais**: Os formulários são preenchidos mas NÃO são submetidos para evitar criar dados de teste no banco.

2. **Busca de CEP**: Quando o CEP é preenchido, o sistema aguarda a busca automática (2 segundos) antes de continuar.

3. **Seletores Adaptativos**: Os testes usam múltiplos seletores para encontrar elementos, garantindo compatibilidade mesmo se a estrutura mudar.

4. **Screenshots em Cada Etapa**: Cada ação importante é documentada com screenshot.

## 📂 Localização

- **Screenshots**: `docs/screenshots/user-flow/`
- **Teste**: `tests/user-flow.spec.ts`
- **Configuração**: `playwright.docs.config.ts`

## 🔄 Fluxo Completo Visualizado

O teste mostra visualmente:
1. Como o usuário acessa a autenticação
2. Como preenche o formulário de cadastro
3. Como navega para o checkout
4. Como preenche o endereço passo a passo
5. Como o formulário fica completo

## 🎨 Visualização

Durante a execução, você verá:
- Chrome abrindo e navegando
- Formulários sendo preenchidos automaticamente
- Drawers abrindo e fechando
- Navegação entre páginas
- Screenshots sendo capturados em cada etapa

## ✅ Garantias

O sistema garante que:
- ✅ Todos os campos são preenchidos corretamente
- ✅ Screenshots são capturados em cada etapa
- ✅ O fluxo completo é documentado
- ✅ Não cria dados reais no banco (formulários não são submetidos)

