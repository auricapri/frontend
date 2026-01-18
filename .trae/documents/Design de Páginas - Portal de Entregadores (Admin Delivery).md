# Design de Páginas — Portal de Entregadores (Admin Delivery)

## Global Styles (desktop-first)
- **Layout base:** CSS Grid (container central) + Flexbox (alinhamentos internos).
- **Grid:** container 1200px máx, 24px gutter, 8px spacing scale.
- **Cores (tokens):**
  - Background: `#0B1220` (dark) / `#FFFFFF` (light, opcional)
  - Surface: `#111B2E`
  - Primary: `#3B82F6`
  - Success: `#22C55E`
  - Warning: `#F59E0B`
  - Danger: `#EF4444`
  - Text: `#E5E7EB` / Muted: `#94A3B8`
- **Tipografia:** base 14–16px; títulos 20/24/28px; números de KPI com 28–32px.
- **Botões:**
  - Primary (aceite/confirmar), Secondary (voltar/fechar), Danger (reportar ocorrência).
  - Hover: +6% brilho; Disabled: 40% opacidade.
- **Estados:** loading (skeleton), empty state (mensagem + ação “Atualizar”), error state (toast + retry).

---

## Página 1 — Login de Entregadores (Admin Delivery)

### Layout
- **Sistema:** Grid 2 colunas (desktop): esquerda (branding + instruções), direita (card de login).
- **Responsivo:** abaixo de 768px vira 1 coluna; card ocupa 100% largura.

### Meta Information
- Title: `Login • Entregas`
- Description: `Acesso ao portal de entregadores com MFA.`
- Open Graph: título/descrição iguais; `og:type=website`.

### Page Structure
1. **Header mínimo (topo):** logo + nome do sistema.
2. **Card de autenticação (surface):** formulário + etapa MFA.
3. **Rodapé discreto:** texto “Acesso restrito”.

### Sections & Components
- **Form Login**
  - Campos: e-mail, senha.
  - CTA primário: “Entrar”.
  - Mensagens: erro de credenciais; conta inativa.
- **Etapa MFA (após login)**
  - Campo: código TOTP.
  - CTA primário: “Verificar”.
  - Link secundário: “Tentar novamente”.
- **Controle de acesso (estado da tela)**
  - Se papel inválido: tela/alerta “Acesso negado” + CTA “Sair”.

---

## Página 2 — Painel de Pedidos do Dia

### Layout
- **Sistema:** Grid com 3 áreas (desktop):
  1) Top bar (fixa), 2) Coluna esquerda (lista), 3) Coluna direita (detalhes em drawer/painel), 4) Painel lateral opcional (notificações).
- **Responsivo:**
  - Tablet: detalhes viram drawer sobre a lista.
  - Mobile: lista em tela cheia; detalhes em página/drawer full-screen.

### Meta Information
- Title: `Pedidos do Dia • Entregas`
- Description: `Operação diária: aceite, ocorrências, avaliação, histórico e notificações.`
- Open Graph: título/descrição iguais; `og:type=website`.

### Page Structure
1. **Top Bar:** logo pequeno + data do dia + chip do papel (Delivery/Admin) + botão “Sair”.
2. **KPI Strip:** cards compactos (Total, Pendentes, Aceitos, Ocorrências).
3. **Main Content:** lista + detalhes.
4. **Tabs secundárias:** “Hoje” | “Histórico” | “Notificações”.

### Sections & Components
- **Lista de pedidos (coluna esquerda)**
  - Filtros mínimos: status (pendente/aceito/ocorrência/finalizado) + busca por fornecedor/código.
  - Agrupamento: seções por **Fornecedor** (accordion) com contadores (itens pendentes/aceitos/ocorrências).
  - Item: código do pedido + status badge + endereço resumido.
  - Ação: clicar abre detalhes do fornecedor/pedido no painel/drawer.
- **Detalhes do pedido (painel/drawer)**
  - Blocos: dados completos do fornecedor (nome, contato, endereço), identificação do pedido, observações, trilha recente (últimos eventos).
  - Seção “Produtos a recolher”: lista de itens com quantidade e **variante**.
    - Cada item mostra: nome do produto, variante (cor/tamanho etc.), descrição detalhada e thumbnail (imagem da variante).
  - CTAs:
    - Primary: “Aceitar tudo do fornecedor” (confirmação modal).
    - Secondary: “Aceitar item” (em cada linha de produto).
    - Danger: “Reportar ocorrência” (modal com tipo + descrição + captura de evidência por câmera).
    - Secondary: “Avaliar fornecedor” (nota 1–5 + comentário opcional; habilitar após coleta concluída).
- **Histórico (tab)**
  - Tabela: pedidos finalizados com data e status; filtro por período.
  - Detalhe em modo leitura ao selecionar.
- **Notificações (tab/painel)**
  - Lista cronológica; itens com estado não-lido.
  - Ação: “Marcar como lida”; clique abre contexto (pedido relacionado quando houver).
- **Feedback & segurança**
  - Toasts para sucesso/erro; bloqueio visual quando sessão expirar; redirecionar para login.
  - Indicador “Sincronizado”/“Atualizando” (quando usar Realtime ou refresh).
