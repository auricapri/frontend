# Auricapri Frontend

Frontend da loja de moda feminina Auricapri — React + TypeScript + Vite.

Site: [www.auricapri.com.br](https://www.auricapri.com.br)

## Stack

- **React 19** + TypeScript
- **Vite 6** (build + dev server)
- **Tailwind CSS** (utility-first styling)
- **Supabase** (auth + database + storage)
- **Lucide React** (icons)
- **React Helmet** (SEO meta tags)

## Rodar Local

```bash
npm install
npm run dev
```

Requer `.env` com `VITE_API_URL` e credenciais Supabase.

## Build

```bash
npm run build    # Gera dist/
npm run preview  # Preview local do build
```

## Deploy

Push para branch `producao` → Vercel auto-deploy.

Dominios:
- `www.auricapri.com.br` (principal)
- `www.auricapri.com` → redireciona para .com.br

## Estrutura

```
src/
├── api/            # Clientes HTTP (ProductsApi, OrdersApi, etc)
├── app/            # AppLayout, AppRouter, hooks globais
├── components/
│   ├── admin/      # Painel admin (lazy loaded)
│   ├── auth/       # AuthDrawer, UserProfileView
│   ├── cart/       # CartDrawer, BoxSavingsIndicator
│   ├── chat/       # ChatDrawer, ChatProductCard
│   ├── checkout/   # CheckoutViewV2, PaymentForm, AddressForm
│   ├── common/     # CookieBanner, TermsConsentModal
│   ├── layout/     # Navbar, Footer
│   ├── orders/     # OrderCard, ProductReviewForm
│   ├── product/    # ProductCard, ProductGrid, ProductDetail
│   ├── returns/    # ReturnRequestForm, MyReturnsView
│   ├── seo/        # SEOHead, schemas.ts (JSON-LD)
│   ├── shared/     # Hero, LoyaltyBanner
│   └── ui/         # OptimizedImage, Input, Toast, Modal
├── i18n/           # Internacionalizacao (pt, en, es, fr)
├── pages/          # Paginas (HomePage, AboutPage, etc)
├── services/       # Logica de negocio (pricing, cart, tax, loyalty)
├── types/          # TypeScript interfaces
└── utils/          # Helpers (currency, image, supabase, date)
```

## SEO

- **SEOHead** em todas as paginas publicas (title, description, OG, canonical, hreflang)
- **JSON-LD** schemas: Organization, WebSite, Product, BreadcrumbList, CollectionPage, FAQPage
- **Sitemap**: `public/sitemap.xml` — 10 URLs estaticas
- **robots.txt**: bloqueia admin, checkout, receipt, delivery, reset-password
- **Self-hosted Inter font** (woff2 variable) — sem Google Fonts CDN
- **Structured Data** estatico no index.html (Organization + WebSite)

## Performance

- **Lazy loading**: Drawers (Cart, Wishlist, Coupons, Auth, FAQ), Admin, Checkout, Product pages
- **Image optimization**: Supabase transforms (resize), srcSet responsivo, IntersectionObserver
- **Mapbox on-demand**: Carrega apenas no checkout step de endereco
- **Code splitting**: Vite manual chunks (vendor-react, vendor-supabase, vendor-other)
- **Compression**: gzip + Brotli via vite-plugin-compression

## Documentacao

- [CHANGELOG.md](CHANGELOG.md) — Historico de mudancas
- [LAZY_LOADING_RULES.md](LAZY_LOADING_RULES.md) — Regras de lazy loading e barrel exports
- [docs/](docs/) — Screenshots e documentacao visual
