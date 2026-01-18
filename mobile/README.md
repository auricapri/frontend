# Auricapri Mobile App

Aplicativo mobile React Native que replica exatamente o frontend web existente.

## Status do Projeto

### ✅ Concluído
- [x] Estrutura base do projeto React Native
- [x] Configuração TypeScript e aliases
- [x] Types, Constants, i18n replicados
- [x] Utils adaptados (supabase, currency, splash)
- [x] API Client adaptado para React Native
- [x] Serviço de notificações Firebase
- [x] Hook useNotifications (substitui toasts)
- [x] Todos os hooks replicados (useAuth, useCart, useStoreData, useWishlist, useOrders, useLoyalty)
- [x] Todos os contexts replicados (AppContext, AuthContext, CartContext)
- [x] Todos os arquivos de API criados (products, orders, users, store, collections, coupons, assets, auth, wishlist, guides, banners, notifications)
- [x] Services criados (cart.service.ts, loyalty.service.ts)
- [x] App.tsx básico criado com estrutura de providers

### ✅ Concluído Adicional
- [x] Componentes base adaptados (Navbar, Footer, Hero, ProductGrid, Toast, SplashScreen)
- [x] HomePage adaptada para React Native
- [x] Navegação com React Navigation (NativeRouter criado)
- [x] Splash screen nativo (componente React Native + configuração iOS/Android)
- [x] Configuração iOS (Info.plist, LaunchScreen.storyboard)
- [x] Configuração Android (AndroidManifest.xml, launch_screen.xml, styles.xml)
- [x] App.tsx completo com providers e lógica de splash

### 🚧 Próximos Passos
- [ ] Adaptar componentes restantes (ProductDetail, CollectionDetail, CartDrawer, etc.)
- [ ] Adaptar páginas restantes (ProductPage, CollectionPage, CheckoutPage, AdminPage, etc.)
- [ ] Substituir todas as chamadas de toast por push notifications nos componentes
- [ ] Adicionar ícones SVG (substituir placeholders de emoji)
- [ ] Testar em dispositivos iOS e Android
- [ ] Configurar Firebase Cloud Messaging (adicionar arquivos de configuração)

## Estrutura

```
mobile/
├── src/
│   ├── api/          # ✅ APIs criadas
│   ├── components/    # ✅ Componentes base adaptados
│   │   ├── layout/    # Navbar, Footer
│   │   ├── shared/   # Hero
│   │   ├── product/  # ProductGrid
│   │   └── ui/       # Toast, SplashScreen
│   ├── context/       # ✅ Contexts replicados
│   ├── hooks/         # ✅ Hooks replicados
│   ├── pages/         # ✅ HomePage adaptada
│   ├── router/        # ✅ NativeRouter criado
│   ├── services/      # ✅ Services criados
│   ├── types/         # ✅ Types replicados
│   ├── utils/         # ✅ Utils adaptados
│   ├── constants/     # ✅ Constants replicados
│   └── i18n.ts        # ✅ i18n replicado
├── ios/               # ✅ Configurado (Info.plist, LaunchScreen)
├── android/           # ✅ Configurado (AndroidManifest, splash)
└── App.tsx            # ✅ App principal completo
```

## Documentação Adicional

Veja `IMPLEMENTATION_STATUS.md` para detalhes completos do que foi implementado e próximos passos.

## Instalação

```bash
cd mobile
npm install
```

## Executar

```bash
# iOS
npm run ios

# Android
npm run android
```

## Notas

- O projeto usa Firebase Cloud Messaging para push notifications (substitui toasts do web)
- A estrutura base está completa e funcional
- HomePage está funcionando e pode ser testada
- Componentes e páginas restantes podem ser adaptados seguindo o padrão estabelecido
- Ícones estão usando emojis como placeholders - substituir por SVG quando possível

