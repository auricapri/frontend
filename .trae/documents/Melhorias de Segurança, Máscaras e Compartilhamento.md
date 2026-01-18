# Plano de Correção e Melhorias: Admin, Segurança e Usabilidade

Este plano prioriza a correção da inatividade no painel administrativo e integra as melhorias de segurança e usabilidade solicitadas.

## 1. Correção da Inatividade no Painel Admin (Marketing)
### **Ativação das Funcionalidades de Campanha**
- **Componente `AdminMarketing.tsx`**: 
  - Adicionar a prop `onCampaignEdit`.
  - Implementar handlers de clique nos botões "Nova Campanha" e "Editar".
  - Adicionar estados de erro e carregamento com feedback visual claro (toasts/alerts).
- **Componente `AdminDashboard.tsx`**:
  - Gerenciar o estado de edição de campanhas (`editingCampaign`).
  - Implementar a lógica de salvamento (`handleSaveCampaign`) chamando a `MarketingApi`.
- **Novo Componente `AdminCampaignEditor.tsx`**:
  - Criar um formulário modal para edição completa de campanhas (Nome, Descrição, Tags, Datas de Vigência e Status).

## 2. Segurança de Dados Sensíveis (Backend)
### **Criptografia e Gestão de Chaves**
- **Utilitário `crypto.ts`**: Implementar criptografia AES-256-CBC para proteger a `OPEN_WEATHER_MAP_API_KEY`.
- **Configuração `env.ts`**: Automatizar a descriptografia de chaves no carregamento do ambiente.
- **Scripts de Manutenção**:
  - `encrypt-key.ts`: Para criptografar chaves de forma segura.
  - `check-secrets.ts`: Para garantir que nenhuma credencial em texto plano seja commitada.

## 3. Máscaras de Campos e Usabilidade (Frontend)
### **Padronização de Entradas**
- **Utilitário `masks.ts`**: Implementar máscaras robustas para Telefone, CPF/CNPJ e Cartão de Crédito.
- **Integração**: Aplicar as máscaras nos fluxos de Checkout, Endereço e Pagamento, garantindo funcionamento em todos os navegadores.

## 4. Compartilhamento e Tratamento de URLs
### **Robustez nos Links**
- **Wishlist**: Corrigir integração com WhatsApp (API `wa.me`) e adicionar compartilhamento social (Facebook/Twitter).
- **URLs Externas**: Criar um handler de redirecionamento com logging de falhas e páginas de fallback (erro personalizado).

## 5. Testes e Validação
- Implementar testes automatizados para validar a segurança (criptografia), máscaras de campo e fluxos de compartilhamento.

Deseja que eu comece pela correção da inatividade no painel de Marketing agora?