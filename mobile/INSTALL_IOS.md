# Como Instalar o App no iOS sem App Store

Existem algumas formas de instalar o app diretamente no seu iPhone sem passar pela App Store:

## Opção 1: Development Build via Xcode (Recomendado para Desenvolvimento)

Esta é a forma mais simples para desenvolvimento e testes.

### Pré-requisitos:
- Mac com Xcode instalado
- Conta Apple ID (gratuita)
- iPhone conectado via USB
- Certificado de desenvolvedor (pode ser criado gratuitamente)

### Passos:

1. **Gerar os arquivos iOS do React Native:**
```bash
cd mobile
npx react-native init Auricapri --skip-install
# Ou se já tiver os arquivos, pule este passo
```

2. **Abrir o projeto no Xcode:**
```bash
cd mobile/ios
open Auricapri.xcworkspace
# Ou se não tiver workspace:
open Auricapri.xcodeproj
```

3. **Configurar o Signing & Capabilities:**
   - No Xcode, selecione o projeto "Auricapri" no navegador
   - Vá em "Signing & Capabilities"
   - Selecione seu Team (sua conta Apple ID)
   - Xcode criará automaticamente um certificado de desenvolvimento

4. **Conectar seu iPhone:**
   - Conecte o iPhone via USB
   - No iPhone, vá em Configurações > Geral > Gerenciamento de VPN e Dispositivos
   - Confie no computador se solicitado

5. **Selecionar o dispositivo:**
   - No Xcode, no topo, selecione seu iPhone como destino

6. **Build e Instalar:**
   - Pressione `Cmd + R` ou clique em "Run"
   - O app será compilado e instalado no seu iPhone

**Nota:** Na primeira vez, você precisará confiar no desenvolvedor no iPhone:
- Vá em Configurações > Geral > Gerenciamento de VPN e Dispositivos
- Toque no perfil do desenvolvedor
- Toque em "Confiar"

---

## Opção 2: Ad Hoc Distribution (Para Distribuição)

Esta opção permite criar um arquivo `.ipa` que pode ser instalado em até 100 dispositivos.

### Pré-requisitos:
- Conta de Desenvolvedor Apple ($99/ano)
- UDID dos dispositivos onde quer instalar

### Passos:

1. **Registrar os UDIDs:**
   - Acesse [Apple Developer Portal](https://developer.apple.com/account/)
   - Vá em Certificates, Identifiers & Profiles
   - Adicione os UDIDs dos dispositivos

2. **Criar Profile de Distribuição Ad Hoc:**
   - No Developer Portal, crie um Provisioning Profile do tipo "Ad Hoc"
   - Selecione o App ID e os dispositivos

3. **Build no Xcode:**
   - No Xcode, vá em Product > Archive
   - Quando terminar, o Organizer abrirá
   - Selecione "Distribute App"
   - Escolha "Ad Hoc"
   - Selecione o provisioning profile
   - Exporte o `.ipa`

4. **Instalar no iPhone:**
   - Transfira o arquivo `.ipa` para o iPhone
   - Use ferramentas como:
     - **3uTools** (Windows/Mac)
     - **iTunes** (versão antiga)
     - **Apple Configurator 2** (Mac)
     - Ou instale via linha de comando:
       ```bash
       ideviceinstaller -i app.ipa
       ```

---

## Opção 3: TestFlight (Beta Testing)

TestFlight permite distribuir para até 10.000 testadores sem passar pela App Store pública.

### Passos:

1. **Upload para App Store Connect:**
   - No Xcode, Product > Archive
   - Distribua para App Store Connect
   - Aguarde o processamento (pode levar algumas horas)

2. **Configurar TestFlight:**
   - Acesse [App Store Connect](https://appstoreconnect.apple.com)
   - Vá em TestFlight
   - Adicione testadores internos ou externos
   - Envie o convite

3. **Instalar no iPhone:**
   - Testadores recebem email com link
   - Instalam o app TestFlight da App Store
   - Abrem o link e instalam seu app

---

## Opção 4: Build via React Native CLI (Mais Rápido)

Se você só quer testar rapidamente:

```bash
cd mobile

# Instalar dependências
npm install

# Conectar iPhone via USB e executar:
npx react-native run-ios --device "Nome do seu iPhone"

# Ou especificar o UDID:
npx react-native run-ios --udid <UDID>
```

**Nota:** Você ainda precisará configurar o signing no Xcode na primeira vez.

---

## Solução de Problemas

### Erro: "No devices found"
- Certifique-se de que o iPhone está conectado e desbloqueado
- Confie no computador no iPhone
- Execute: `xcrun devicectl list devices`

### Erro: "Signing for 'Auricapri' requires a development team"
- Abra o projeto no Xcode
- Vá em Signing & Capabilities
- Selecione seu Team (Apple ID)

### Erro: "Untrusted Developer"
- No iPhone: Configurações > Geral > Gerenciamento de VPN e Dispositivos
- Toque no perfil do desenvolvedor
- Toque em "Confiar"

---

## Recomendação

Para desenvolvimento e testes rápidos, use a **Opção 1** (Xcode) ou **Opção 4** (React Native CLI).

Para distribuir para outras pessoas, use **Opção 2** (Ad Hoc) ou **Opção 3** (TestFlight).

