# Changelog

Todas as mudancas notaveis neste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semantico](https://semver.org/lang/pt-BR/).

## [1.4.7] - 2026-03-15

### Corrigido
- **i18n.ts** (4 locales): barra de benefícios corrigida — `'FRETE GRÁTIS EM TODOS OS PEDIDOS'` / `'FREE SHIPPING ON ALL ORDERS'` / `'ENVÍO GRATIS EN TODOS LOS PEDIDOS'` / `'LIVRAISON GRATUITE SUR TOUTES LES COMMANDES'` (antes indicavam limite R$299 que não existe)
- **ProductCard.tsx**: `hasFreeShipping` agora sempre `true` para todos os produtos VAREJO (antes exigia `has_free_shipping === true || price >= 299`, incompatível com política de frete grátis sem mínimo)
- **ShippingReturnsPage.tsx**: seção Envios reescrita — frete grátis sem valor mínimo, PAC 7–15 dias úteis, expressa seg–qui; seção Parcelamento adicionada (1–3x sem juros, 4–10x com juros, PIX 5% desconto, boleto 3 dias)

## [1.4.6] - 2026-03-15

### Adicionado
- **ShippingSelectionModal**: modal de seleção de frete exibido após confirmar endereço (VAREJO) — mostra opção grátis (PAC) + expresso + opções de transportadora da API; "Para alterar, role até embaixo"
- **useShippingCalculation**: para VAREJO, agora também consulta `calculateShippingOptions` em paralelo — `shippingOptions` passa a conter opções pagas de transportadora; novo estado `selectedVarejoCarrierOption` + `setVarejoCarrierOption`
- **ShippingStep (sidebar)**: VAREJO agora exibe todas as opções de transportadora além de grátis/expresso; seleção de carrier via `setVarejoCarrierOption`
- **useCheckoutState**: `shippingCost` considera `selectedVarejoCarrierOption.real_cost` quando transportadora paga é selecionada no VAREJO

### Alterado
- **AddressStep**: botão "Confirmar e Pagar" abre `ShippingSelectionModal` para VAREJO; para ATACADO continua indo direto ao passo 2 (opções já disponíveis na sidebar)

## [1.4.5] - 2026-03-15

### Corrigido
- **checkout (todos os componentes)**: todas as classes `font-black`, `font-bold`, `font-semibold`, `font-serif` e `italic` substituídas por `font-normal` — texto legível em todo o fluxo de checkout
- **PixPaymentSection**: padding externo reduzido (`p-10 md:p-16` → `p-5`), `space-y-8` → `gap-5`, QR code ampliado (`w-40` → `w-52`), código PIX com `text-xs` legível, botão "Copiar" ocupa largura total
- **BoletoSection**: padding externo reduzido, linha digitável exibida em `font-mono text-sm` sem truncar, botões Copiar/PDF com tamanho confortável, textos explicativos em `text-sm` (antes `text-[10px]`)

## [1.4.4] - 2026-03-13

### Corrigido
- **CheckoutSidebar**: desconto `preAppliedDiscount` (cupons do produto) estava aparecendo ANTES do subtotal; movido para depois do subtotal — todos os descontos ficam abaixo do subtotal
- **CheckoutSidebar**: valores dos descontos não quebravam para a linha de baixo no mobile — adicionado `flex-shrink-0` em todos os spans de valor e `gap-3` nas linhas; `tracking-wide md:tracking-widest` evita overflow em telas pequenas
- **CheckoutSidebar**: labels abreviados para mobile: "Bundle (15%)", "Cupom X", "Cashback", "Desconto (cupons)" — evita overflow lateral
- **ShippingStep**: linha de frete com `flex-shrink-0` nos dois lados e `tracking-wide md:tracking-widest`; prazo simplificado para "{days} dias úteis" sem "Prazo Estimado:" que quebrava no mobile

## [1.4.3] - 2026-03-12

### Adicionado
- **AccessoryPromoModal**: modal de boas-vindas com animação, exibe promoção de 15% de desconto em acessórios ao comprar com roupa; aparece após 2s na primeira visita da sessão
- **CartDrawer**: exibe desconto bundle nos itens acessório (badge Sparkles + preço tachado + preço violeta), banner violeta no topo e linha de desconto no footer
- **CheckoutSidebar**: linha "Desconto Acessório + Roupa (15%)" no resumo de totais
- **useCheckoutState / useCheckoutTotals**: cálculo server-side do bundle discount integrado ao fluxo de totais do checkout
- **BenefitsBar**: banner top_bar adicionado ao Supabase — "PROMOÇÃO: ACESSÓRIOS COM 15% DE DESCONTO AO COMPRAR COM QUALQUER ROUPA"
- **AddressesTab**: formulário inline de criação de endereço com busca de CEP via ViaCEP, limite de 3 endereços com mensagem, botão condicional
- **useAddresses**: `handleCreateAddress` para criar endereço diretamente no perfil do usuário

## [1.4.2] - 2026-03-12

### Corrigido
- **useAuth**: `mergeCart` enviava o JSON completo do localStorage (`{"data":"...","expiry":...}`) como sessionId — causava 400 Validation error no backend; agora faz parse correto e extrai apenas o campo `data`

### Adicionado
- **AboutUs**: redesign completo da página — coluna esquerda com imagem sticky + quote overlay; coluna direita com manifesto da marca, valores (Elegância, Autenticidade, Qualidade), assinatura dos fundadores e barra de stats
- **store_config**: texto "Sobre a Marca" atualizado no banco em PT e EN com história da Auricapri, origem do nome e manifesto

## [1.4.1] - 2026-03-12

### Corrigido
- **useProductImages**: quando qualquer variante tem `variant_images`, `base_images` (foto vton do fornecedor) não é mais incluída na galeria — elimina a 3ª imagem fantasma em Lisboa, Mônaco, Florença e outros produtos com imagens AI

## [1.4.0] - 2026-03-12

### Corrigido
- **pricingService**: modo atacado usava `cost_price` (sempre null no DB) para calcular preço — trocado para `wholesale_price` diretamente; todos os produtos agora exibem preço atacado correto
- **filterProductsForMode**: produtos sem variantes cadastradas não aparecem mais no grid (evita exibição de preço R$ 0,00 em varejo)
- **Conjunto Lisboa**: imagens das variantes azul e preto corrigidas de URL CDN morto para Supabase Storage

## [1.3.9] - 2026-03-12

### Corrigido
- **GalleryPage**: logo "AURICAPRI" na nav interna da galeria agora navega para a home ao ser clicado

## [1.3.8] - 2026-03-12

### Adicionado
- **NavbarDesktop**: aba "Início" no lado esquerdo da navbar desktop para navegação rápida à home
- **GalleryPage**: lightbox ao clicar em imagem — overlay escuro com imagem ampliada, botões "Comprar" e "Ver produto" sem sair da galeria

### Corrigido
- **GalleryPage**: Vestido Trancoso removido da galeria (imagem quebrada no storage)
- **NavbarMobileBar / NavbarDesktop**: tipo `onNavigate` atualizado para incluir `'gallery'`

### Conteúdo
- Imagens AI geradas e publicadas para 6 coleções (Blazers, Conjuntos do Dia, Novas Chegadas, Vestidos para Festas, Plus Size, Coleção Vício)
- Novo banner hero — Lençóis Maranhenses, formato panorâmico

## [1.3.7] - 2026-03-12

### Corrigido
- **GalleryPage**: clique em "Ver produto" abria página em branco — `onNavigate('product', slug)` passava o slug como `targetSection` sem o objeto `product`; corrigido para `onNavigate('product', undefined, img.product)`

## [1.3.6] - 2026-03-11

### Alterado
- **Hero**: h1 principal recebe `font-serif` (Playfair Display)
- **NavbarMobile**: `bg-white` → `bg-paper` no menu fullscreen
- **NavbarSearch**: `bg-white` → `bg-paper` no dropdown de sugestões (mantida `bg-white/90` do overlay — variante de opacidade)
- **FAQModal**: `bg-white` → `bg-paper` no painel e header do modal; h2 do título recebe `font-serif`
- **TermsConsentModal**: `bg-white` → `bg-paper` no painel do modal; h2 do título recebe `font-serif`
- **Modal** (ui): `bg-white` → `bg-paper` no painel; h2 do título recebe `font-serif`
- **Drawer** (ui): `bg-white` → `bg-paper` no painel; h2 do título recebe `font-serif`
- **AbandonedCartToast**: `bg-white` → `bg-paper` no container wrapper
- **OrderResultOverlay**: `bg-white` → `bg-paper` no overlay fullscreen; h1 recebe `font-serif`
- **OrderReceipt**: `bg-white` → `bg-paper` no container de página, no papel do recibo, no footer mobile e na seção de avaliações; h1 "AURICAPRI" recebe `font-serif`
- **WeatherPersonalizedBanner**: `bg-white` → `bg-paper` no botão de categoria; h3 do título recebe `font-serif`

## [1.3.5] - 2026-03-11

### Alterado
- **FilterModal**: `bg-white` → `bg-paper` no painel do modal de filtros
- **FilterBottomSheet**: `bg-white` → `bg-paper` no container e footer do bottom sheet de filtros
- **FilterSidebar**: `bg-white` → `bg-paper` no painel lateral de filtros
- **RelatedProducts**: `bg-white` → `bg-paper` no container da seção; h2 do título recebe `font-serif`
- **QuickAddModal**: `bg-white` → `bg-paper` no painel do modal; h3 do nome do produto recebe `font-serif`
- **HotspotPopup**: `bg-white` → `bg-paper` nos dois estados do popup (loading e normal)
- **GarmentTryOnModal**: `bg-white` → `bg-paper` no ConsentModal, painel principal e footer do modal
- **ProductGrid**: h2 da seção de Coleções recebe `font-serif`

## [1.3.4] - 2026-03-11

### Corrigido
- **GalleryPage**: espaçamento extra no header removido — spacer `h-32` eliminado (galeria é standalone sem navbar principal); sub-nav agora `sticky top-0`
- **GalleryPage**: cor do header corrigida de `bg-paper/80 backdrop-blur-md` para `bg-paper` sólido — cor idêntica ao restante do background
- **GalleryPage**: lightbox mobile completamente refeito — container `overflow-y-auto`, botão fechar sticky no topo, imagem com `max-h-[50vh]` no mobile, fonte do título reduzida (`text-2xl` mobile → `text-5xl` desktop), `safe-area-inset-bottom` no info
- **GalleryPage**: footer adicionado — mesmo Footer da home renderizado via AppRouter após o conteúdo da galeria

### Alterado
- **NavbarMobileBar**: nome da loja agora usa `font-serif` (Playfair Display) — consistência com galeria
- **NavbarDesktop**: nome da loja agora usa `font-serif` (Playfair Display) — consistência com galeria

## [1.3.3] - 2026-03-11

### Adicionado
- **ContactPage**: nova pagina `/contact` com canais de atendimento (Instagram, WhatsApp, Email) — design consistente com tema paper
- **Roteamento**: `'contact'` adicionado ao AppView type, AppRouter e useNavigation; `/contact` agora renderiza a ContactPage

### Corrigido
- **GalleryPage**: botao "Contato" agora navega para `/contact` em vez de redirecionar para home
- **Instagram**: URL corrigida para `auricapri.oficial` em Footer e GalleryPage
- **CollectionDetail**: `bg-white` substituido por `bg-paper` — pagina de colecao nao aparece mais branca
- **ProductGrid**: `bg-white` substituido por `bg-paper` — grid de produtos usa tom papel

### Alterado
- **Cor de fundo global**: Background alterado de branco para `#FAF8F0` (paper) — token Tailwind `paper`, CSS variable `--color-paper`, body inline style e splash screen
- **Playfair Display**: fonte serif adicionada ao Tailwind config e carregada via Google Fonts
- **AppLayout**: root div usa `bg-paper` em vez de `bg-white`
- **Navbar**: background solido usa `bg-paper/90` em vez de `bg-white/90`
- **CartDrawer**: background usa `bg-paper` em vez de `bg-white`

## [1.3.2] - 2026-03-11

### Corrigido
- **GalleryPage**: botao "Colecoes" corrigido de `onNavigate('collection')` para `onNavigate('home', 'collection')` — evita pagina branca ao tentar navegar para `/collection` sem slug
- **GalleryPage**: botao "Contato" corrigido de `onNavigate('home', 'contact')` para `onNavigate('home')` — nao existe secao com `id="contact"` na home; o contato esta disponivel no `id="footer-contact"` no rodape da home page

## [1.3.1] - 2026-03-11

### Corrigido
- **GalleryPage**: nav flutuante corrigido — removido `pt-32 md:pt-24` do elemento `<nav>` e adicionado `<div className="h-32 md:h-24 flex-shrink-0" />` como spacer antes do nav; esqueleto de loading ajustado de `pt-40` para `pt-32 md:pt-24`

## [1.3.0] - 2026-03-11

### Adicionado
- **GalleryPage**: redesign completo inspirado no AI Studio — header "Curadoria de Estilo", busca em tempo real, masonry animado com Framer Motion, hover overlay escuro, lightbox com imagem grande + ações
- **motion**: dependência `motion` (Framer Motion v12) instalada

## [1.2.3] - 2026-03-09

### Melhorado
- **CartDrawer**: design do mobile melhorado — imagem maior (`w-28 h-36`), nome do produto `text-xs`, preço `font-semibold`, padding lateral reduzido (`px-4`), espaçamento entre itens `space-y-5`, footer compacto no mobile

## [1.2.2] - 2026-03-09

### Corrigido
- **NavbarMobile**: perfil do usuario movido para dentro do scroll container — impedia o footer de aparecer em telas pequenas
- **NavbarSearch**: sugestoes de busca agora mostram ate 10 itens (era 5) com scroll (`max-h-[400px] overflow-y-auto`)

### Melhorado
- **ProductGridBody**: layout alterado de grid uniforme para colunas masonry (`columns-2 md:columns-3 lg:columns-4`), imagens em portrait `3/4` — visual estilo Pinterest

## [1.2.1] - 2026-03-09

### Adicionado
- **index.tsx**: Banner de versão no console do browser — mostra `Auricapri v{version}` para verificar cache
- **vite.config.ts**: `__APP_VERSION__` e `__APP_NAME__` injetados via Vite define na build
- **src/vite-env.d.ts**: Declarações TypeScript para `__APP_VERSION__` e `__APP_NAME__`

## [1.2.0] - 2026-03-05

### Refatorado
- **PaymentStep.tsx**: 779L → 289L + 4 subcomponentes (CreditCardForm, PixPaymentSection, BoletoSection, CashbackToggle)
- **ProductGrid.tsx**: 692L → 332L + 6 subcomponentes (ProductFilters, ProductPagination, ProductGridSkeleton, ProductGridBody, CollectionCard, CartIncentiveBanner)
- **Navbar.tsx**: 637L → 194L + 5 subcomponentes (NavbarMobileBar, NavbarDesktop, NavbarSearch, NavbarMobile, NavbarUserMenu)
- **10 componentes** convertidos de useEffect+fetch para React Query (useQuery/useMutation com staleTime, queryKey, invalidation)
  - CouponsDrawer, DeliveryHistoryPanel, DeliveryNotificationsPanel, DeliveryDashboard, OrderReceipt, GarmentTryOnModal, FaceSwapModal, ReturnRequestForm, useOrders, useAddresses

### Melhorado
- **20 arquivos** com imagens otimizadas: 9 com `getOptimizedImageUrl` (produto/colecao), 11 com `loading="lazy" decoding="async"`
- **CashbackToggle** agora visivel para TODOS os metodos de pagamento (nao apenas cartao)
- **UserProfileView**: queries ativadas sob demanda por tab (enabled flag)
- **DeliveryNotificationsPanel**: updates otimistas via queryClient.setQueryData

## [1.1.2] - 2026-03-04

### Corrigido
- AuthDrawer: OAuth redirect agora usa `window.location.href` em vez de `window.location.origin + '/'` — usuário retorna à wishlist após login com Google/Apple
- SharedWishlistPage: botões de compra desabilitados quando dono da wishlist não tem endereço cadastrado

### Adicionado
- SharedWishlistPage: exibe cidade/estado de entrega (endereço do dono) acima dos produtos
- SharedWishlistPage: aviso quando dono não tem endereço cadastrado
- SharedWishlistPage: checkout inicia direto no passo de Pagamento (endereço vem do dono via backend)
- CheckoutViewV2: props `initialStep` e `giftDeliveryLocation` para checkout de presente
- WishlistDrawer: aviso de que o dono deve ter endereço cadastrado antes de compartilhar
- wishlist.api.ts: método `getDeliveryInfo` para buscar cidade/estado do endereço do dono

## [1.1.1] - 2026-03-04

### Corrigido
- SharedWishlistPage: substituídos `alert()` por abertura do AuthDrawer ao tentar comprar sem login
- SharedWishlistPage: removido `disabled` no botão principal para não-logados — agora abre login ao clicar
- SharedWishlistPage: removidos `alert()` de erro/sucesso do pedido

### Adicionado
- SharedWishlistPage: banner de incentivo ao login para usuários não autenticados com botão "Entrar / Criar conta"
- SharedWishlistPage: prop `onOpenAuth` passada via AppRouter usando `app.setIsAuthOpen(true)`

## [1.1.0] - 2026-02-19

### Performance
- Self-hosted Inter font — substituiu Google Fonts CDN por woff2 local (elimina ~835ms render-blocking)
- Mapbox carregado on-demand — removido do index.html, carrega apenas no checkout (step endereco)
- Meta Pixel deferido — carrega no primeiro scroll/click/touch, nao mais sincrono
- Google Fonts reduzido de 9 pesos para 3 (300, 400, 700)
- CSS inline limpo — manteve apenas splash screen, moveu scrollbar/print/animations para bundle
- Drawers lazy-loaded — CartDrawer, WishlistDrawer, CouponsDrawer, AuthDrawer, FAQModal via React.lazy()
- Logo SVG eliminado — substituiu 2MB SVG (traced bitmap) por texto CSS "AURICAPRI" em LoadingSpinner, LoadingModal, AppLayout
- Supabase preconnect adicionado no index.html
- GTM dns-prefetch adicionado
- srcSet habilitado por padrao no OptimizedImage
- Imagens de produto otimizadas com Supabase transforms em ProductCard, CartDrawer, ChatProductCard, OrderProductReviewPage, ProductReviewForm
- Deletados 8.2MB de arquivos nao usados (logo-original-large.png, logo-auricapri-2.svg, logo-auricapri.svg)

### SEO / Indexacao
- Vercel Security Challenge resolvido — .com.br agora retorna 200 (antes 403 para todos)
- Redirect .com → .com.br (308 permanente) via vercel.json — corrige conteudo duplicado
- Canonical tag no HTML estatico (`<link rel="canonical">`)
- 7 OG tags adicionadas (title, description, type, url, site_name, locale)
- JSON-LD Organization + WebSite schema no index.html (fallback para crawlers sem JS)
- Sitemap expandido — removeu rotas mortas, adicionou /novidades e /shipping (10 URLs)
- robots.txt endurecido — bloqueou /reset-password, /delivery, /order-review, /request-return
- Google Search Console verificado via DNS TXT record no Cloudflare
- SEOHead com React Helmet em todas as paginas publicas (title, description, OG, canonical, hreflang, JSON-LD)
- Product schema com AggregateRating e Review items
- BreadcrumbList schema em paginas de produto
- CollectionPage schema em paginas de colecao

### Acessibilidade
- Touch targets corrigidos — CookieBanner e TermsConsentModal botoes com min 44px
- aria-labels adicionados em CookieBanner ("Rejeitar cookies", "Aceitar cookies", "Fechar banner")
- aria-label no TermsConsentModal ("Fechar")
- Contraste de texto corrigido no TermsConsentModal (text-neutral-400 → text-neutral-500)
- Hero heading order corrigido (subtitle como <p> com order-1, titulo como <h1> com order-2)

### Corrigido
- Console data leaks removidos — nenhum console.log expoe dados de usuario em producao
- Meta tag deprecated removida (http-equiv="X-UA-Compatible")
- Botao "Descobrir" no Hero — reduzido de px-16/py-6 para px-8/py-4, centralizado com self-center
- 403 em rotas SPA corrigido (rewrite catch-all no vercel.json)

### Metricas (Lighthouse — antes vs depois)
- Performance media: 45 → 67 (+22)
- Accessibility media: 82 → 88 (+6)
- Best Practices: 92 → 96 (+4)
- SEO media: 85 → 100 (+15)
- LCP produto: 18.5s → 4.7s (-75%)
- TBT: 0ms em todas as paginas
- CLS: 0.001 em todas as paginas

## [1.0.0] - 2025-02-09

### Adicionado
- Interface de e-commerce completa
- Sistema de autenticacao integrado com Supabase
- Catalogo de produtos com filtros e busca
- Sistema de carrinho de compras
- Fluxo de checkout completo
- Paginas de conta do usuario (pedidos, wishlist, enderecos)
- Painel administrativo completo
  - Gestao de produtos com editor rico
  - Gestao de categorias e colecoes
  - Gestao de pedidos
  - Gestao de cupons
  - Dashboard com metricas
  - Dream Board (editor visual de looks)
- Assistente virtual com IA (chat)
- Galeria de garment transfer (troca de roupas virtual)
- Face swap para experimentacao virtual
- PWA com splash screen
- Integracao com Google Analytics (com consentimento)
- Suporte a internacionalizacao (pt, en, es, fr)
- Design responsivo mobile-first
- Lazy loading e code splitting para performance
- Testes E2E com Playwright

### Corrigido
- Tratamento de erros na geracao automatica de descricoes com IA
- Posicionamento de modais em dispositivos moveis
- Integracao SSE para streaming de respostas IA
