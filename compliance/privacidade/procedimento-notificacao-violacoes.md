# Procedimento de Notificacao de Violacoes de Dados

**Documento:** PRO-PRIV-002
**Versao:** 1.0
**Data de Vigencia:** Janeiro 2026
**Proxima Revisao:** Janeiro 2027
**Classificacao:** Interno

---

## 1. Objetivo

Estabelecer o processo de notificacao para alertar vendedores, parceiros comerciais (incluindo TikTok Shop), autoridades reguladoras e titulares sobre violacoes de dados pessoais suspeitas ou identificadas, em conformidade com a LGPD e obrigacoes contratuais.

---

## 2. Escopo

Este procedimento aplica-se a:
- Todas as violacoes de dados pessoais
- Incidentes suspeitos de comprometimento de dados
- Comunicacao com ANPD
- Comunicacao com parceiros comerciais
- Comunicacao com titulares afetados

---

## 3. Definicao de Violacao de Dados

### 3.1 O que Constitui uma Violacao

| Tipo | Descricao | Exemplos |
|------|-----------|----------|
| **Confidencialidade** | Acesso ou divulgacao nao autorizada | Vazamento, email enviado errado |
| **Integridade** | Alteracao nao autorizada de dados | Modificacao indevida de registros |
| **Disponibilidade** | Perda de acesso aos dados | Ransomware, exclusao acidental |

### 3.2 Exemplos de Violacoes

- Vazamento de banco de dados
- Email com dados pessoais enviado ao destinatario errado
- Dispositivo perdido ou roubado com dados nao criptografados
- Ataque de ransomware
- Acesso nao autorizado por ex-colaborador
- Exposicao de dados em repositorio publico

---

## 4. Deteccao e Reporte Interno

### 4.1 Canais de Reporte Interno

| Canal | Contato | Disponibilidade |
|-------|---------|-----------------|
| Email | incidentes@auricapri.com.br | 24/7 |
| DPO direto | admin@auricapri.com.br | Horario comercial |
| Telefone emergencia | [Numero] | 24/7 |

### 4.2 Prazo para Reporte Interno

- **Obrigatorio:** Reportar imediatamente apos deteccao
- **Maximo:** 4 horas apos conhecimento do incidente

### 4.3 Informacoes para Reporte

- Data e hora da deteccao
- Descricao do incidente
- Sistemas/dados possivelmente afetados
- Acoes ja tomadas
- Contato do reportador

---

## 5. Avaliacao do Incidente

### 5.1 Equipe de Avaliacao

- DPO (lider)
- Equipe de Seguranca
- TI
- Juridico (quando necessario)

### 5.2 Criterios de Avaliacao

| Fator | Perguntas |
|-------|-----------|
| Volume | Quantos titulares foram afetados? |
| Tipo de dados | Dados sensiveis estao envolvidos? |
| Causa | Foi acesso nao autorizado? Erro humano? |
| Impacto | Qual o risco para os titulares? |
| Reversibilidade | Os dados podem ser recuperados? |

### 5.3 Classificacao de Risco

| Nivel | Descricao | Notificacao |
|-------|-----------|-------------|
| **CRITICO** | Dados sensiveis, grande volume, alto impacto | ANPD + Titulares + Parceiros |
| **ALTO** | Dados pessoais, volume significativo | ANPD + Titulares + Parceiros |
| **MEDIO** | Dados pessoais, baixo impacto | Avaliar caso a caso |
| **BAIXO** | Dados nao sensiveis, impacto minimo | Registro interno |

---

## 6. Notificacao a ANPD

### 6.1 Quando Notificar

Notificar quando a violacao puder acarretar **risco ou dano relevante** aos titulares, considerando:
- Natureza dos dados (sensiveis = maior risco)
- Volume de titulares afetados
- Facilidade de identificacao dos titulares
- Consequencias da violacao

### 6.2 Prazo

- **Recomendado:** 72 horas apos conhecimento da violacao
- **Obrigatorio:** Prazo razoavel (LGPD Art. 48)

### 6.3 Conteudo da Notificacao

| Item | Descricao |
|------|-----------|
| Natureza dos dados | Categorias de dados afetados |
| Titulares afetados | Numero e categorias (clientes, colaboradores) |
| Medidas tecnicas | Controles de seguranca existentes |
| Riscos | Possiveis consequencias aos titulares |
| Medidas adotadas | Acoes de contencao e mitigacao |
| Medidas futuras | Plano para evitar recorrencia |
| Contato DPO | Nome, email, telefone |

### 6.4 Canal de Notificacao

- **Sistema:** [Sistema da ANPD quando disponivel]
- **Email:** [Email oficial da ANPD]
- **Formulario:** Formulario padrao da ANPD

---

## 7. Notificacao aos Titulares

### 7.1 Quando Notificar

Notificar quando a violacao puder acarretar **risco ou dano relevante**, especialmente:
- Dados financeiros comprometidos
- Dados de saude expostos
- Credenciais vazadas
- Risco de fraude ou roubo de identidade

### 7.2 Prazo

- **Maximo:** Assim que possivel apos confirmacao
- **Ideal:** 72 horas apos avaliacao

### 7.3 Conteudo da Notificacao

**Obrigatorio:**
- Descricao clara do ocorrido
- Tipos de dados afetados
- Riscos potenciais
- Medidas que estamos tomando
- Recomendacoes ao titular
- Contato para duvidas

**Modelo de Comunicacao:**
```
Assunto: Aviso de Seguranca - Auricapri

Prezado(a) [Nome],

Identificamos um incidente de seguranca que pode ter afetado seus dados pessoais.

O QUE ACONTECEU:
[Descricao simples do incidente]

QUAIS DADOS FORAM AFETADOS:
[Lista de categorias de dados]

O QUE ESTAMOS FAZENDO:
[Medidas tomadas]

O QUE VOCE PODE FAZER:
[Recomendacoes - trocar senha, monitorar contas, etc.]

CONTATO:
Para duvidas: admin@auricapri.com.br

Pedimos desculpas pelo ocorrido.

Atenciosamente,
Equipe Auricapri
```

### 7.4 Canais de Notificacao

| Canal | Uso |
|-------|-----|
| Email | Principal (se temos email cadastrado) |
| SMS | Complementar para urgencias |
| App/Plataforma | Notificacao in-app |
| Correio | Se nao houver contato digital |
| Site | Comunicado publico (casos graves) |

---

## 8. Notificacao a Parceiros Comerciais

### 8.1 TikTok Shop e Vendedores

**Quando notificar:**
- Dados de clientes dos parceiros foram afetados
- Incidente pode impactar operacoes do parceiro
- Obrigacao contratual de notificacao

**Prazo:**
- Conforme contrato (geralmente 24-72 horas)
- Se nao especificado: 48 horas

**Canal:**
- Email dedicado do parceiro
- Portal de parceiros (se disponivel)
- Contato de emergencia (casos criticos)

**Conteudo:**
- Natureza do incidente
- Dados dos clientes do parceiro afetados
- Acoes tomadas
- Suporte necessario
- Proximos passos

### 8.2 Outros Parceiros e Fornecedores

- Notificar se dados compartilhados foram afetados
- Coordenar resposta conjunta se necessario
- Documentar comunicacoes

---

## 9. Registro e Documentacao

### 9.1 Registro de Violacoes

Manter registro de todas as violacoes contendo:
- Data e hora de deteccao
- Data e hora de notificacao
- Descricao do incidente
- Dados afetados
- Titulares afetados
- Avaliacoes realizadas
- Decisoes tomadas
- Notificacoes enviadas
- Medidas corretivas
- Licoes aprendidas

### 9.2 Retencao

- Registros de violacoes: 5 anos
- Comunicacoes com ANPD: 10 anos
- Comunicacoes com titulares: 5 anos

---

## 10. Fluxo de Notificacao

```
DETECCAO DO INCIDENTE
        |
        v
REPORTE INTERNO (imediato, max 4h)
        |
        v
AVALIACAO INICIAL (DPO + Seguranca)
        |
        v
CLASSIFICACAO DE RISCO
        |
   +---------+---------+
   |         |         |
CRITICO    ALTO      MEDIO/BAIXO
   |         |         |
   v         v         v
Notificar  Notificar  Avaliar
ANPD +     ANPD +     necessidade
Titulares  Parceiros
+ Parceiros    |
   |         |
   +----+----+
        |
        v
DOCUMENTAR E MONITORAR
        |
        v
LICOES APRENDIDAS
```

---

## 11. Responsabilidades

| Papel | Responsabilidade |
|-------|-----------------|
| DPO | Liderar processo, aprovar notificacoes |
| Seguranca | Investigacao tecnica, contencao |
| Juridico | Revisao de comunicados, compliance |
| Comunicacao | Redacao de comunicados |
| TI | Suporte tecnico, logs |

---

## 12. Contatos de Emergencia

| Funcao | Nome | Contato |
|--------|------|---------|
| DPO | [Nome] | admin@auricapri.com.br |
| Seguranca | [Nome] | [Telefone] |
| Juridico | [Nome] | [Telefone] |
| Direcao | [Nome] | [Telefone] |

---

## 13. Metricas

| Metrica | Meta |
|---------|------|
| Tempo de deteccao a reporte interno | < 4 horas |
| Tempo de avaliacao | < 24 horas |
| Notificacao ANPD (quando aplicavel) | < 72 horas |
| Notificacao parceiros | < 48 horas |
| Taxa de violacoes repetidas | < 5% |

---

## 14. Aprovacao

| Funcao | Nome | Data |
|--------|------|------|
| DPO | [Nome] | Janeiro 2026 |
| Diretor | [Nome] | Janeiro 2026 |
| Juridico | [Nome] | Janeiro 2026 |

---

*Auricapri - Todos os direitos reservados*
