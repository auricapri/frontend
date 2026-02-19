# Changelog

Todas as mudancas notaveis neste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semantico](https://semver.org/lang/pt-BR/).

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
