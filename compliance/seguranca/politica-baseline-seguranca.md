# Politica de Baseline de Seguranca

**Documento:** POL-SEG-004
**Versao:** 1.0
**Data de Vigencia:** Janeiro 2026
**Proxima Revisao:** Janeiro 2027
**Classificacao:** Interno

---

## 1. Objetivo

Definir os requisitos minimos de seguranca para operacoes diarias, incluindo bloqueio de tela, complexidade de senha, politica de mesa limpa, autenticacao multifator e outras medidas de seguranca basica.

---

## 2. Escopo

Esta politica aplica-se a:
- Todos os colaboradores, estagiarios e terceiros
- Todos os dispositivos corporativos
- Todos os sistemas e aplicacoes da empresa
- Todas as instalacoes fisicas

---

## 3. Politica de Senhas

### 3.1 Requisitos de Complexidade

| Requisito | Especificacao |
|-----------|--------------|
| Tamanho minimo | 12 caracteres |
| Letras maiusculas | Minimo 1 |
| Letras minusculas | Minimo 1 |
| Numeros | Minimo 1 |
| Caracteres especiais | Minimo 1 |
| Senhas anteriores | Nao repetir as ultimas 12 |

### 3.2 Gerenciamento de Senhas

- Troca obrigatoria: a cada 90 dias
- Bloqueio apos: 5 tentativas incorretas
- Tempo de bloqueio: 30 minutos
- Gerenciador de senhas: recomendado

### 3.3 Senhas Proibidas

- Nome proprio ou de familiares
- Data de nascimento
- Sequencias obvias (123456, qwerty)
- Palavras do dicionario simples
- Nome da empresa

---

## 4. Autenticacao Multifator (MFA)

### 4.1 Sistemas com MFA Obrigatorio

| Sistema | Metodo MFA |
|---------|-----------|
| Email corporativo | App autenticador |
| VPN | App autenticador |
| Sistemas de producao | App autenticador |
| Console de nuvem (AWS/Supabase) | App autenticador |
| Ferramentas de codigo (GitHub) | App autenticador |

### 4.2 Metodos Aceitos

**Preferido:**
- Aplicativo autenticador (Google Authenticator, Authy, Microsoft Authenticator)

**Aceitos:**
- Chave de seguranca fisica (YubiKey)
- SMS (apenas como backup)

**Nao Aceitos:**
- Email como segundo fator
- Perguntas de seguranca

### 4.3 Backup de MFA

- Codigos de recuperacao devem ser armazenados de forma segura
- Procedimento de reset via Service Desk com verificacao de identidade

---

## 5. Bloqueio de Tela

### 5.1 Configuracao Obrigatoria

| Parametro | Valor |
|-----------|-------|
| Bloqueio automatico | 5 minutos de inatividade |
| Desbloqueio | Senha ou biometria |
| Em reunioes | Bloquear manualmente (Win+L / Cmd+Ctrl+Q) |

### 5.2 Protetor de Tela

- Protetor de tela com senha habilitado
- Nenhuma informacao sensivel exibida
- Preview de notificacoes desabilitado na tela de bloqueio

---

## 6. Politica de Mesa Limpa

### 6.1 Ao Deixar a Mesa

**Obrigatorio:**
- Bloquear computador
- Guardar documentos confidenciais em gaveta trancada
- Nao deixar senhas anotadas visiveis
- Recolher impressoes imediatamente

### 6.2 Ao Final do Dia

**Obrigatorio:**
- Desligar ou hibernar computador
- Guardar todos os documentos fisicos
- Gavetas trancadas
- Nenhum documento no lixo aberto (usar fragmentadora)

### 6.3 Em Areas Comuns

- Nao discutir informacoes confidenciais
- Nao deixar dispositivos desacompanhados
- Usar filtro de privacidade em locais publicos

---

## 7. Seguranca de Email

### 7.1 Boas Praticas

- Verificar remetente antes de clicar em links
- Nao abrir anexos de fontes desconhecidas
- Reportar emails suspeitos a Seguranca
- Nao encaminhar emails corporativos para email pessoal

### 7.2 Phishing

- Treinamento obrigatorio de conscientizacao
- Simulacoes de phishing periodicas
- Canal de reporte: seguranca@auricapri.com.br

---

## 8. Uso de Dispositivos

### 8.1 Dispositivos Corporativos

| Regra | Descricao |
|-------|-----------|
| Software | Apenas software autorizado |
| Atualizacoes | Manter sistema atualizado |
| Antivirus | Sempre ativo |
| Backup | Dados na nuvem corporativa |

### 8.2 Dispositivos Pessoais (BYOD)

- Aprovacao previa obrigatoria
- Antivirus instalado
- Criptografia habilitada
- Separacao de dados pessoais/corporativos

### 8.3 Dispositivos Moveis

- PIN/senha de no minimo 6 digitos
- Biometria recomendada
- Criptografia de dispositivo
- Localizacao remota habilitada

---

## 9. Seguranca Fisica

### 9.1 Acesso as Instalacoes

- Cracha de identificacao obrigatorio
- Visitantes sempre acompanhados
- Registro de entrada/saida

### 9.2 Areas Restritas

- Acesso apenas a pessoal autorizado
- Controle de acesso biometrico/cartao
- Cameras de seguranca

---

## 10. Trabalho Remoto

### 10.1 Requisitos

| Item | Requisito |
|------|-----------|
| Conexao | VPN corporativa |
| Rede | Wi-Fi com WPA3 ou cabo |
| Local | Ambiente privado |
| Dispositivo | Corporativo ou BYOD aprovado |

### 10.2 Proibicoes

- Uso de redes Wi-Fi publicas sem VPN
- Deixar dispositivo desbloqueado
- Permitir acesso de terceiros ao dispositivo

---

## 11. Treinamento

| Treinamento | Frequencia | Publico |
|-------------|-----------|---------|
| Conscientizacao em Seguranca | Anual | Todos |
| Phishing | Semestral | Todos |
| Seguranca para Desenvolvedores | Anual | Devs |
| Politicas de Seguranca | Onboarding | Novos colaboradores |

---

## 12. Verificacao de Conformidade

### 12.1 Checklist de Auditoria

- [ ] Senha atende aos requisitos
- [ ] MFA habilitado em todos os sistemas
- [ ] Bloqueio de tela configurado
- [ ] Mesa limpa ao final do dia
- [ ] Dispositivo com antivirus ativo
- [ ] Treinamentos em dia

### 12.2 Frequencia

- Auto-avaliacao: Mensal
- Auditoria de TI: Trimestral
- Auditoria completa: Anual

---

## 13. Nao Conformidade

| Nivel | Consequencia |
|-------|-------------|
| Primeiro | Orientacao e treinamento |
| Segundo | Advertencia formal |
| Terceiro | Medidas disciplinares |
| Grave | Desligamento/rescisao |

---

## 14. Aprovacao

| Funcao | Nome | Data |
|--------|------|------|
| DPO | [Nome] | Janeiro 2026 |
| RH | [Nome] | Janeiro 2026 |

---

*Auricapri - Todos os direitos reservados*
