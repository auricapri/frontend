# Procedimento de Retencao e Exclusao de Dados

**Documento:** PRO-PRIV-003
**Versao:** 1.0
**Data de Vigencia:** Janeiro 2026
**Proxima Revisao:** Janeiro 2027
**Classificacao:** Interno

---

## 1. Objetivo

Estabelecer o procedimento para retencao e exclusao de dados pessoais, garantindo que dados sejam mantidos apenas pelo tempo necessario e excluidos de forma segura ao final da relacao contratual ou quando nao houver mais base legal para o tratamento.

---

## 2. Escopo

Este procedimento aplica-se a:
- Todos os dados pessoais tratados pela Auricapri
- Dados de clientes, colaboradores, parceiros e fornecedores
- Dados em formato digital e fisico
- Dados em sistemas proprios e de terceiros

---

## 3. Principios de Retencao

### 3.1 Principios Basicos

| Principio | Descricao |
|-----------|-----------|
| **Necessidade** | Manter apenas enquanto necessario |
| **Finalidade** | Retencao vinculada a finalidade original |
| **Legalidade** | Respeitar prazos legais obrigatorios |
| **Minimizacao** | Reduzir dados retidos ao minimo |
| **Seguranca** | Proteger dados durante todo o ciclo |

### 3.2 Perguntas para Definir Retencao

1. Qual a finalidade do tratamento?
2. Ha obrigacao legal de retencao?
3. Ha necessidade de defesa em processos?
4. O dado ainda e necessario para o servico?
5. O titular solicitou exclusao?

---

## 4. Tabela de Retencao

### 4.1 Dados de Clientes

| Categoria de Dados | Prazo de Retencao | Base Legal |
|--------------------|-------------------|------------|
| Dados cadastrais | Vigencia + 5 anos | Prescricao civil |
| Historico de compras | 5 anos | Legislacao fiscal |
| Dados de pagamento | 5 anos | Legislacao fiscal |
| Comunicacoes (suporte) | 3 anos | Interesse legitimo |
| Preferencias de marketing | Ate revogacao | Consentimento |
| Cookies/navegacao | 6-24 meses | Consentimento/Interesse legitimo |

### 4.2 Dados de Colaboradores

| Categoria de Dados | Prazo de Retencao | Base Legal |
|--------------------|-------------------|------------|
| Contratos de trabalho | 5 anos apos termino | CLT |
| Folha de pagamento | 10 anos | Previdenciario |
| FGTS | 30 anos | Lei 8.036/90 |
| Exames medicos | 20 anos | NR-7 |
| Dados de beneficios | 5 anos apos termino | Obrigacao legal |

### 4.3 Dados de Parceiros/Fornecedores

| Categoria de Dados | Prazo de Retencao | Base Legal |
|--------------------|-------------------|------------|
| Contratos | Vigencia + 10 anos | Prescricao civil |
| Dados fiscais | 5 anos | Legislacao fiscal |
| Comunicacoes | 5 anos | Interesse legitimo |

### 4.4 Logs e Registros Tecnicos

| Categoria | Prazo de Retencao | Base Legal |
|-----------|-------------------|------------|
| Logs de acesso | 6 meses | Marco Civil Internet |
| Logs de aplicacao | 6 meses | Seguranca |
| Logs de auditoria | 5 anos | Compliance |
| Backups | Ciclo de 90 dias | Continuidade |

---

## 5. Ciclo de Vida dos Dados

### 5.1 Fases do Ciclo

```
COLETA -> PROCESSAMENTO -> ARMAZENAMENTO -> RETENCAO -> EXCLUSAO/ANONIMIZACAO
```

### 5.2 Revisao Periodica

| Atividade | Frequencia |
|-----------|-----------|
| Identificacao de dados para exclusao | Mensal (automatizado) |
| Revisao de tabela de retencao | Anual |
| Auditoria de conformidade | Semestral |

---

## 6. Exclusao de Dados

### 6.1 Gatilhos para Exclusao

| Gatilho | Acao |
|---------|------|
| Fim do prazo de retencao | Exclusao automatica |
| Solicitacao do titular | Avaliacao + exclusao |
| Fim da relacao contratual | Exclusao apos periodo legal |
| Revogacao de consentimento | Exclusao imediata (se unica base) |
| Finalidade atingida | Exclusao |

### 6.2 Processo de Exclusao

**Passo 1: Identificacao**
- Sistema identifica dados elegiveis para exclusao
- Gera lista de registros para revisao

**Passo 2: Verificacao**
- Verificar obrigacoes legais de retencao
- Verificar processos judiciais em andamento
- Verificar solicitacoes de preservacao

**Passo 3: Aprovacao**
- Revisao pelo responsavel da area
- Aprovacao do DPO (dados pessoais)

**Passo 4: Execucao**
- Exclusao nos sistemas ativos
- Exclusao/anonimizacao em backups (conforme ciclo)
- Destruicao de documentos fisicos

**Passo 5: Documentacao**
- Registro da exclusao
- Certificado de destruicao (se aplicavel)

---

## 7. Metodos de Exclusao

### 7.1 Dados Digitais

| Tipo | Metodo | Ferramenta |
|------|--------|------------|
| Banco de dados | DELETE com log de auditoria | Scripts SQL |
| Arquivos | Sobrescrita segura | Ferramentas de wipe |
| Backups | Anonimizacao ou exclusao no ciclo | Processo de backup |
| Nuvem | API de exclusao + verificacao | AWS/Supabase tools |

### 7.2 Dados Fisicos

| Tipo | Metodo |
|------|--------|
| Papel comum | Fragmentadora corte cruzado |
| Papel confidencial | Fragmentadora + certificado |
| Midias opticas | Destruicao fisica |
| Dispositivos | Wipe certificado + descarte |

### 7.3 Padroes de Exclusao Segura

- **Dados comuns:** 1 passagem de sobrescrita
- **Dados confidenciais:** 3 passagens (DoD 5220.22-M)
- **Dados restritos:** 7 passagens ou destruicao fisica

---

## 8. Exclusao ao Fim da Relacao Contratual

### 8.1 Clientes

**Processo:**
1. Encerramento da conta/contrato registrado
2. Periodo de graca: 30 dias (reativacao)
3. Exclusao de dados de uso/preferencias
4. Retencao de dados obrigatorios (fiscal, legal)
5. Exclusao total apos prazo legal

**Dados excluidos imediatamente:**
- Preferencias de marketing
- Cookies e trackers
- Dados de sessao

**Dados retidos (prazo legal):**
- Historico de transacoes (5 anos)
- Dados para defesa juridica (prescricao)

### 8.2 Parceiros Comerciais (TikTok Shop, Vendedores)

**Processo:**
1. Notificacao de encerramento (30 dias)
2. Exportacao de dados (se solicitado)
3. Exclusao de dados operacionais
4. Retencao de dados fiscais/legais
5. Confirmacao de exclusao ao parceiro

**Prazo para exclusao total:** Conforme contrato, geralmente 30-90 dias apos encerramento

### 8.3 Colaboradores

**Processo:**
1. Desligamento formalizado
2. Revogacao de acessos (imediato)
3. Dados de trabalho arquivados
4. Retencao conforme tabela legal
5. Exclusao automatica apos prazos

---

## 9. Anonimizacao

### 9.1 Quando Usar

- Dados necessarios para estatisticas/analytics
- Impossibilidade tecnica de exclusao (backups antigos)
- Pesquisa e desenvolvimento

### 9.2 Tecnicas de Anonimizacao

| Tecnica | Descricao | Uso |
|---------|-----------|-----|
| Supressao | Remover campos identificadores | Geral |
| Generalizacao | Substituir por faixas (idade -> faixa etaria) | Analytics |
| Pseudonimizacao | Substituir por identificador | Pesquisa |
| Agregacao | Combinar em grupos | Relatorios |

### 9.3 Validacao

- Testar impossibilidade de reidentificacao
- Documentar tecnica utilizada
- Revisao periodica de eficacia

---

## 10. Backups

### 10.1 Politica de Retencao de Backups

| Tipo | Retencao |
|------|----------|
| Backup diario | 7 dias |
| Backup semanal | 4 semanas |
| Backup mensal | 12 meses |
| Backup anual | 5 anos |

### 10.2 Exclusao em Backups

**Opcoes:**
1. Aguardar ciclo de rotacao (padrao)
2. Restaurar, excluir, fazer novo backup (urgente)
3. Manter registro de exclusao pendente

**Registro:**
- Documentar dados excluidos de sistemas ativos
- Marcar para exclusao em backups quando restaurados

---

## 11. Terceiros e Subprocessadores

### 11.1 Obrigacoes Contratuais

Contratos devem prever:
- Exclusao de dados ao fim do contrato
- Prazo para exclusao
- Certificado de exclusao
- Auditoria de conformidade

### 11.2 Verificacao

- Solicitar certificado de exclusao
- Auditar periodicamente (amostragem)
- Manter registro de solicitacoes

---

## 12. Excecoes a Exclusao

### 12.1 Situacoes de Excecao

| Situacao | Tratamento |
|----------|------------|
| Obrigacao legal | Reter pelo prazo legal |
| Processo judicial | Preservar ate fim do processo |
| Solicitacao de autoridade | Preservar conforme instrucao |
| Interesse publico | Avaliar caso a caso |

### 12.2 Documentacao de Excecoes

- Justificativa clara
- Base legal
- Prazo estimado de retencao
- Revisao periodica

---

## 13. Responsabilidades

| Papel | Responsabilidade |
|-------|-----------------|
| DPO | Supervisao, aprovacao de exclusoes |
| TI | Execucao tecnica |
| Areas de negocio | Identificar dados, revisar retencao |
| Juridico | Definir prazos legais |

---

## 14. Metricas

| Metrica | Meta |
|---------|------|
| Dados excluidos no prazo | 100% |
| Solicitacoes de exclusao atendidas | < 15 dias |
| Backups dentro da politica | 100% |
| Certificados de exclusao obtidos (terceiros) | 100% |

---

## 15. Auditoria

| Atividade | Frequencia |
|-----------|-----------|
| Verificacao de conformidade | Trimestral |
| Amostragem de exclusoes | Mensal |
| Revisao de tabela de retencao | Anual |
| Auditoria de terceiros | Anual |

---

## 16. Aprovacao

| Funcao | Nome | Data |
|--------|------|------|
| DPO | [Nome] | Janeiro 2026 |
| Diretor | [Nome] | Janeiro 2026 |
| Juridico | [Nome] | Janeiro 2026 |

---

*Auricapri - Todos os direitos reservados*
