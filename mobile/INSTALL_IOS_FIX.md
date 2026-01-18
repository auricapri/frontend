# Solução para Instalar no iPhone Físico

## Problema Identificado

O Xcode 26.2 está esperando o SDK iOS 26.2, mas ele não está instalado. O dispositivo está rodando iOS 18.2.

## Solução: Instalar iOS 26.2 SDK

### Passo 1: Abrir Xcode Settings

1. Abra o **Xcode**
2. Vá em **Xcode > Settings** (ou **Preferences** em versões antigas)
3. Clique na aba **Platforms** (ou **Components**)
4. Procure por **iOS 26.2**
5. Clique no botão de **download** (ícone de nuvem) ao lado

### Passo 2: Configurar Signing no Xcode

1. Com o projeto aberto no Xcode:
   - Clique no ícone azul **"Auricapri"** no topo esquerdo
   - No painel central, selecione o **target "Auricapri"**
   - No painel direito, procure a aba **"General"** ou **"Signing & Capabilities"**

2. **Configurar Signing:**
   - Marque **"Automatically manage signing"**
   - Selecione seu **Team** (sua conta Apple ID)
   - O Xcode criará automaticamente um certificado

3. **Deployment Target:**
   - Em **"iOS Deployment Target"**, escolha **18.2** ou a versão mais próxima

### Passo 3: Buildar e Instalar

1. No topo do Xcode, selecione **"iPhone"** como destino (seu dispositivo físico)
2. Pressione **`Cmd + R`** ou clique no botão **Play**
3. O Xcode compilará e instalará no seu iPhone

### Passo 4: Confiar no Desenvolvedor (no iPhone)

Na primeira vez, aparecerá no iPhone:
- **"Desenvolvedor não confiável"**
- Vá em: **Configurações > Geral > Gerenciamento de VPN e Dispositivos**
- Toque no perfil do desenvolvedor
- Toque em **"Confiar"**

---

## Alternativa: Usar Xcode Mais Antigo

Se não conseguir instalar o iOS 26.2 SDK, você pode:

1. Baixar uma versão mais antiga do Xcode (15.x ou 16.x)
2. Ou usar o Xcode Command Line Tools para buildar

---

## Comando Alternativo (se o SDK estiver instalado)

Depois de configurar no Xcode, você pode usar:

```bash
cd /Users/marcuslirio/Desktop/auricapri/mobile
npx react-native run-ios --udid 00008120-0014454E1E46601E
```

