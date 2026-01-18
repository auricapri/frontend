# Politica de Antivirus e Protecao de Endpoint

**Documento:** POL-SEG-003
**Versao:** 1.0
**Data de Vigencia:** Janeiro 2026
**Proxima Revisao:** Janeiro 2027
**Classificacao:** Interno

---

## 1. Objetivo

Estabelecer diretrizes para a protecao de endpoints (computadores, laptops, dispositivos moveis) contra malware, virus e outras ameacas, garantindo a seguranca dos dispositivos corporativos da Auricapri.

---

## 2. Escopo

Esta politica aplica-se a:
- Todos os computadores e laptops corporativos
- Dispositivos moveis utilizados para trabalho
- Servidores (quando aplicavel)
- Dispositivos pessoais com acesso a dados corporativos (BYOD)

---

## 3. Solucao de Protecao

### 3.1 Antivirus/EDR Corporativo

**Solucao Adotada:** [Nome da solucao - ex: CrowdStrike, SentinelOne, Microsoft Defender for Endpoint]

**Funcionalidades:**
- Antivirus em tempo real
- Deteccao e resposta de endpoint (EDR)
- Protecao contra ransomware
- Controle de aplicacoes
- Firewall de host

### 3.2 Requisitos Minimos

| Componente | Requisito |
|------------|-----------|
| Definicoes de virus | Atualizacao automatica diaria |
| Scan completo | Semanal (agendado) |
| Scan em tempo real | Sempre ativo |
| Protecao web | Habilitada |
| Firewall local | Habilitado |

---

## 4. Instalacao e Configuracao

### 4.1 Dispositivos Corporativos

- Antivirus pre-instalado em todas as maquinas
- Configuracao padrao gerenciada centralmente
- Usuario nao pode desabilitar protecao
- Politicas aplicadas via console central

### 4.2 BYOD (Dispositivos Pessoais)

- Antivirus obrigatorio para acesso a rede corporativa
- Lista de solucoes aprovadas fornecida
- Verificacao de conformidade antes do acesso

---

## 5. Monitoramento e Gerenciamento

### 5.1 Console Central

**Metricas Monitoradas:**
- Status de protecao de todos os endpoints
- Deteccoes e acoes tomadas
- Dispositivos desatualizados
- Dispositivos sem protecao

### 5.2 Alertas

| Tipo de Alerta | Acao |
|----------------|------|
| Malware detectado | Notificacao imediata + quarentena |
| Protecao desabilitada | Notificacao + reativacao remota |
| Definicoes desatualizadas | Forcear atualizacao |
| Dispositivo comprometido | Isolamento de rede |

---

## 6. Procedimentos

### 6.1 Deteccao de Malware

1. Alerta automatico enviado a equipe de seguranca
2. Arquivo movido para quarentena automaticamente
3. Analise da ameaca pela equipe
4. Decisao: remover, permitir ou escalar
5. Documentacao do incidente

### 6.2 Dispositivo Comprometido

1. Isolamento imediato da rede
2. Notificacao ao usuario
3. Analise forense (se necessario)
4. Reimagem da maquina
5. Restauracao de dados do backup
6. Analise de causa raiz

### 6.3 Falso Positivo

1. Usuario reporta problema
2. Equipe de seguranca analisa
3. Se confirmado falso positivo: criar excecao
4. Documentar excecao com justificativa

---

## 7. Exclusoes e Excecoes

### 7.1 Processo de Excecao

- Excecoes devem ser aprovadas pela Seguranca
- Justificativa documentada obrigatoria
- Revisao trimestral de todas as excecoes
- Excecoes temporarias com data de expiracao

### 7.2 Excecoes Comuns Aprovadas

| Tipo | Justificativa |
|------|--------------|
| Ferramentas de desenvolvimento | Falsos positivos conhecidos |
| Softwares de seguranca | Conflito com antivirus |

---

## 8. Atualizacoes

### 8.1 Definicoes de Virus
- Atualizacao automatica: a cada 4 horas
- Fonte: servidor de atualizacao centralizado
- Fallback: direto do fabricante

### 8.2 Software de Protecao
- Atualizacoes testadas antes do deploy
- Rollout gradual (piloto -> producao)
- Rollback disponivel em caso de problemas

---

## 9. Dispositivos Moveis

### 9.1 iOS/Android Corporativos
- MDM (Mobile Device Management) obrigatorio
- App de seguranca instalado
- Verificacao de jailbreak/root
- Criptografia de dispositivo obrigatoria

### 9.2 Controles Adicionais
- Wipe remoto disponivel
- Bloqueio apos tentativas de senha
- Apps de fontes nao confiadas bloqueados

---

## 10. Metricas e Relatorios

| Metrica | Frequencia | Meta |
|---------|-----------|------|
| Cobertura de antivirus | Diario | 100% |
| Definicoes atualizadas | Diario | >98% |
| Tempo de resposta a deteccao | Por incidente | <15 min |
| Incidentes de malware | Mensal | Reducao continua |

---

## 11. Responsabilidades

| Papel | Responsabilidade |
|-------|-----------------|
| TI/Seguranca | Deploy e gerenciamento |
| Usuario | Nao desabilitar protecao |
| Gestor | Garantir conformidade da equipe |

---

## 12. Nao Conformidade

O nao cumprimento desta politica pode resultar em:
- Bloqueio de acesso a rede
- Advertencia formal
- Medidas disciplinares

---

## 13. Aprovacao

| Funcao | Nome | Data |
|--------|------|------|
| DPO | [Nome] | Janeiro 2026 |
| Gerente de TI | [Nome] | Janeiro 2026 |

---

*Auricapri - Todos os direitos reservados*
