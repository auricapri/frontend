# Politica de Resposta a Incidentes

**Documento:** POL-SEG-007
**Versao:** 1.0
**Data de Vigencia:** Janeiro 2026
**Proxima Revisao:** Janeiro 2027
**Classificacao:** Interno

---

## 1. Objetivo

Estabelecer procedimentos claros para identificacao, resposta, comunicacao e recuperacao de incidentes de seguranca, minimizando impactos e garantindo a continuidade dos negocios.

---

## 2. Escopo

Esta politica aplica-se a:
- Todos os incidentes de seguranca da informacao
- Incidentes envolvendo dados pessoais
- Violacoes de seguranca fisica ou logica
- Todos os colaboradores, terceiros e parceiros

---

## 3. Definicao de Incidente

### 3.1 O que e um Incidente de Seguranca

Qualquer evento que comprometa ou possa comprometer:
- Confidencialidade de informacoes
- Integridade de dados ou sistemas
- Disponibilidade de servicos

### 3.2 Exemplos de Incidentes

| Categoria | Exemplos |
|-----------|----------|
| Malware | Virus, ransomware, trojan |
| Acesso nao autorizado | Invasao, conta comprometida |
| Vazamento de dados | Exposicao acidental, exfiltracao |
| Phishing | Email malicioso, engenharia social |
| DDoS | Ataque de negacao de servico |
| Perda/roubo | Dispositivo perdido com dados |
| Erro humano | Envio de dados para destinatario errado |

---

## 4. Classificacao de Incidentes

### 4.1 Niveis de Severidade

| Nivel | Descricao | Tempo de Resposta |
|-------|-----------|-------------------|
| **CRITICO** | Impacto grave em dados ou operacoes | Imediato (1 hora) |
| **ALTO** | Impacto significativo, dados sensiveis | 4 horas |
| **MEDIO** | Impacto moderado, sem dados sensiveis | 8 horas |
| **BAIXO** | Impacto minimo, facilmente contido | 24 horas |

### 4.2 Criterios de Classificacao

**CRITICO:**
- Vazamento de dados pessoais em larga escala
- Ransomware em sistemas de producao
- Comprometimento de credenciais privilegiadas

**ALTO:**
- Vazamento de dados confidenciais
- Malware detectado em multiplos sistemas
- Acesso nao autorizado a sistemas criticos

**MEDIO:**
- Phishing bem-sucedido (sem vazamento)
- Malware contido rapidamente
- Violacao de politica de seguranca

**BAIXO:**
- Tentativa de ataque bloqueada
- Phishing reportado sem cliques
- Dispositivo perdido sem dados sensiveis

---

## 5. Canais de Comunicacao

### 5.1 Como Reportar Incidentes

| Canal | Uso |
|-------|-----|
| Email | incidentes@auricapri.com.br |
| Telefone | [Numero de emergencia] |
| Chat interno | Canal #seguranca-incidentes |
| Presencial | Procurar equipe de Seguranca/TI |

### 5.2 Informacoes para Reportar

- Data e hora do incidente
- Descricao do ocorrido
- Sistemas/dados afetados
- Acoes ja tomadas
- Contato do reportador

---

## 6. Processo de Resposta

### 6.1 Fluxo de Resposta

```
1. DETECCAO -> 2. TRIAGEM -> 3. CONTENCAO -> 4. ERRADICACAO -> 5. RECUPERACAO -> 6. LICOES APRENDIDAS
```

### 6.2 Fase 1: Deteccao e Reporte

**Responsavel:** Qualquer colaborador / Sistemas de monitoramento

**Acoes:**
- Identificar sinais de incidente
- Reportar imediatamente pelos canais definidos
- Preservar evidencias (nao desligar sistemas)
- Documentar observacoes iniciais

### 6.3 Fase 2: Triagem e Classificacao

**Responsavel:** Equipe de Seguranca

**Acoes:**
- Avaliar veracidade do incidente
- Classificar severidade
- Ativar equipe de resposta (se necessario)
- Comunicar stakeholders iniciais

### 6.4 Fase 3: Contencao

**Responsavel:** Equipe de Resposta a Incidentes

**Acoes:**
- Isolar sistemas afetados
- Bloquear acessos comprometidos
- Preservar evidencias forenses
- Evitar propagacao

**Contencao de Curto Prazo:**
- Desconectar da rede
- Revogar credenciais comprometidas
- Bloquear IPs maliciosos

### 6.5 Fase 4: Erradicacao

**Responsavel:** Equipe de Resposta a Incidentes

**Acoes:**
- Remover malware/ameaca
- Corrigir vulnerabilidades exploradas
- Alterar credenciais comprometidas
- Aplicar patches necessarios

### 6.6 Fase 5: Recuperacao

**Responsavel:** TI + Equipe de Seguranca

**Acoes:**
- Restaurar sistemas a partir de backups limpos
- Validar integridade dos dados
- Reconectar sistemas gradualmente
- Monitorar por reincidencia

### 6.7 Fase 6: Licoes Aprendidas

**Responsavel:** Equipe de Seguranca + Gestao

**Acoes:**
- Documentar cronologia completa
- Identificar causa raiz
- Propor melhorias
- Atualizar procedimentos
- Treinar equipe se necessario

---

## 7. Equipe de Resposta a Incidentes

### 7.1 Composicao

| Papel | Responsabilidade |
|-------|-----------------|
| Coordenador | Liderar resposta, decisoes |
| Analista de Seguranca | Investigacao tecnica |
| TI/Infraestrutura | Acoes de contencao e recuperacao |
| DPO | Avaliar impacto em dados pessoais |
| Juridico | Orientacao legal |
| Comunicacao | Comunicados internos/externos |

### 7.2 Escalonamento

| Severidade | Escalonamento |
|------------|--------------|
| CRITICO | Direcao + DPO + Juridico (imediato) |
| ALTO | Gerencia + DPO (4 horas) |
| MEDIO | Coordenador de Seguranca |
| BAIXO | Analista de Seguranca |

---

## 8. Comunicacao

### 8.1 Comunicacao Interna

| Audiencia | Quando Comunicar | Responsavel |
|-----------|-----------------|-------------|
| Equipe tecnica | Imediatamente | Coordenador |
| Gestores afetados | Apos triagem | Coordenador |
| Direcao | Incidentes criticos/altos | DPO/Coordenador |
| Todos colaboradores | Se necessario | Comunicacao |

### 8.2 Comunicacao Externa

**Autoridades (ANPD - Brasil):**
- Prazo: 72 horas para incidentes com dados pessoais
- Responsavel: DPO
- Conteudo: Conforme requisitos legais

**Clientes/Parceiros:**
- Quando: Dados deles forem afetados
- Responsavel: DPO + Comunicacao
- Conteudo: Natureza, impacto, acoes tomadas

**TikTok Shop/Vendedores:**
- Prazo: Conforme contrato
- Canal: Definido no contrato
- Responsavel: DPO

---

## 9. Incidentes com Dados Pessoais

### 9.1 Avaliacao de Risco

Avaliar:
- Quantidade de titulares afetados
- Tipos de dados expostos
- Probabilidade de dano
- Severidade do dano potencial

### 9.2 Notificacao Obrigatoria

**ANPD (Brasil):**
- Prazo: Prazo razoavel (recomendado 72h)
- Criterio: Risco ou dano relevante aos titulares

**Titulares:**
- Prazo: Assim que possivel
- Criterio: Risco ou dano relevante

---

## 10. Documentacao

### 10.1 Registro de Incidentes

Todo incidente deve ter registro contendo:
- Numero do incidente
- Data/hora de deteccao
- Data/hora de resolucao
- Descricao detalhada
- Sistemas/dados afetados
- Acoes tomadas
- Causa raiz
- Licoes aprendidas

### 10.2 Retencao

- Registros de incidentes: 5 anos
- Evidencias forenses: Conforme necessidade legal

---

## 11. Testes e Simulacoes

| Atividade | Frequencia |
|-----------|-----------|
| Simulacao de phishing | Trimestral |
| Exercicio de mesa (tabletop) | Semestral |
| Teste de plano completo | Anual |

---

## 12. Metricas

| Metrica | Meta |
|---------|------|
| Tempo medio de deteccao | < 24 horas |
| Tempo medio de contencao | < 4 horas |
| Tempo medio de resolucao | Conforme severidade |
| Taxa de incidentes repetidos | < 5% |

---

## 13. Aprovacao

| Funcao | Nome | Data |
|--------|------|------|
| DPO | [Nome] | Janeiro 2026 |
| Diretor | [Nome] | Janeiro 2026 |

---

*Auricapri - Todos os direitos reservados*
