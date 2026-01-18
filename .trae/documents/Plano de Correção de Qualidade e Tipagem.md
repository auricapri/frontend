Vou realizar uma intervenção completa focada na remoção de `any`, melhoria de logs e segurança, conforme o relatório de qualidade.

### 1. Remoção de `any` e `as any` (Prioridade Máxima)
Vou refatorar os arquivos críticos identificados para substituir tipagens genéricas por interfaces seguras:

*   **Backend**:
    *   `src/api/middleware/auth.middleware.ts`: Tipar tratamento de erros e objetos de requisição.
    *   `src/api/middleware/error.middleware.ts`: Remover asserções inseguras de `userId`.
    *   `src/services/pdf.service.ts` e rotas: Tipar dados de entrada e saída.
*   **Frontend (Auricapri)**:
    *   `CheckoutView.tsx`: Definir interfaces para dados de endereço e respostas de API.
    *   `AdminEditorModal.tsx`: Tipar props e estados do modal.
*   **Mobile**:
    *   `NativeRouter.tsx`: Tipar corretamente as props de navegação.
    *   `users.api.ts`: Garantir retornos tipados nas chamadas de API.

### 2. Padronização de Logging
*   **Backend**: Substituir todas as ocorrências de `console.log/warn/error` pelo `logger` estruturado (`winston`) já configurado no projeto.
*   **Frontend/Mobile**: Centralizar logs em um utilitário que possa ser controlado em produção.

### 3. Segurança e Testes (Urgente)
*   **Vulnerabilidades**: Executar `npm audit fix` no backend para corrigir vulnerabilidades conhecidas.
*   **Testes**: Instalar `vitest` no backend e criar o primeiro conjunto de testes unitários (focando em Services críticos como `CartService` ou `OrderService`) para iniciar a cobertura exigida.

### 4. Migração de Banco de Dados
*   O arquivo `create_cart_sessions.sql` está pronto. Como não tenho acesso direto ao terminal do banco de dados em produção, vou validar o código e garantir que ele está pronto para ser executado via Dashboard do Supabase.

Vou começar pelas correções de tipagem e segurança no backend, que são a base da estabilidade.
