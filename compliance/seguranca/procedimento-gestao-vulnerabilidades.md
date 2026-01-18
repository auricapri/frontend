# Procedimento de Gestao de Vulnerabilidades

**Documento:** PRO-SEG-001
**Versao:** 1.0
**Data de Vigencia:** Janeiro 2026
**Proxima Revisao:** Janeiro 2027
**Classificacao:** Interno

---

## 1. Objetivo

Estabelecer um processo sistematico para identificacao, avaliacao, priorizacao e remediacao de vulnerabilidades em sistemas, aplicacoes e infraestrutura da Auricapri.

---

## 2. Escopo

Este procedimento aplica-se a:
- Todos os servidores e sistemas
- Aplicacoes web e APIs
- Infraestrutura de rede
- Servicos em nuvem (AWS, Supabase)
- Dispositivos de endpoint
- Bibliotecas e dependencias de software

---

## 3. Ciclo de Gestao de Vulnerabilidades

```
1. DESCOBERTA -> 2. AVALIACAO -> 3. PRIORIZACAO -> 4. REMEDIACAO -> 5. VERIFICACAO -> 6. RELATORIO
```

---

## 4. Descoberta de Vulnerabilidades

### 4.1 Fontes de Descoberta

| Fonte | Frequencia | Responsavel |
|-------|-----------|-------------|
| Scan automatizado | Semanal | Seguranca |
| Teste de penetracao | Anual | Terceiro especializado |
| Analise de dependencias | Continuo (CI/CD) | DevOps |
| Bug bounty / Reportes | Continuo | Seguranca |
| Alertas de fabricantes | Continuo | TI |
| CVE/NVD | Diario | Seguranca |

### 4.2 Ferramentas de Scan

| Tipo | Ferramenta Sugerida | Uso |
|------|---------------------|-----|
| Vulnerabilidades de rede | Nessus, OpenVAS | Infraestrutura |
| Aplicacoes web | OWASP ZAP, Burp Suite | Aplicacoes |
| Dependencias | Snyk, Dependabot, npm audit | Codigo |
| Containers | Trivy, Clair | Docker/K8s |
| Nuvem | AWS Inspector, ScoutSuite | Cloud |

### 4.3 Cobertura de Scan

- Servidores de producao: 100%
- Aplicacoes web: 100%
- Endpoints: Amostragem mensal
- Ambientes de desenvolvimento: Trimestral

---

## 5. Avaliacao de Vulnerabilidades

### 5.1 Sistema de Pontuacao (CVSS)

| Score CVSS | Severidade | Exemplo |
|------------|-----------|---------|
| 9.0 - 10.0 | Critica | RCE sem autenticacao |
| 7.0 - 8.9 | Alta | SQL Injection |
| 4.0 - 6.9 | Media | XSS persistente |
| 0.1 - 3.9 | Baixa | Informacao sensivel em headers |

### 5.2 Fatores de Contexto

Alem do CVSS, considerar:
- Exposicao do ativo (internet vs interno)
- Criticidade do sistema
- Dados processados (pessoais, financeiros)
- Existencia de exploit publico
- Facilidade de exploracao

---

## 6. Priorizacao

### 6.1 Matriz de Priorizacao

| Severidade | Exposicao Internet | Exposicao Interna |
|------------|-------------------|-------------------|
| Critica | P1 - Imediato | P1 - Imediato |
| Alta | P1 - Imediato | P2 - 7 dias |
| Media | P2 - 7 dias | P3 - 30 dias |
| Baixa | P3 - 30 dias | P4 - 90 dias |

### 6.2 Prazos de Remediacao (SLA)

| Prioridade | Prazo | Escalonamento |
|------------|-------|--------------|
| P1 | 24-72 horas | Imediato para Direcao |
| P2 | 7 dias | Gerencia de TI |
| P3 | 30 dias | Coordenador |
| P4 | 90 dias | Analista |

---

## 7. Remediacao

### 7.1 Opcoes de Tratamento

| Opcao | Quando Usar |
|-------|-------------|
| **Corrigir** | Patch disponivel, prioritario |
| **Mitigar** | Sem patch, controle compensatorio |
| **Aceitar** | Risco baixo, custo alto de correcao |
| **Transferir** | Seguro, contrato com terceiro |

### 7.2 Processo de Patch

1. Testar patch em ambiente de desenvolvimento
2. Validar funcionamento da aplicacao
3. Agendar janela de manutencao
4. Aplicar patch em producao
5. Verificar sistema pos-patch
6. Documentar aplicacao

### 7.3 Controles Compensatorios

Quando patch nao e possivel imediatamente:
- Isolar sistema vulneravel
- Adicionar regras de firewall
- Aumentar monitoramento
- Restringir acesso
- Desabilitar funcionalidade vulneravel

---

## 8. Verificacao

### 8.1 Validacao de Correcao

- Re-scan apos aplicacao de patch
- Teste manual se necessario
- Validacao por equipe de seguranca
- Documentacao de evidencia

### 8.2 Testes de Regressao

- Garantir que patch nao quebrou funcionalidade
- Testes automatizados quando disponiveis
- Monitoramento pos-implementacao

---

## 9. Vulnerabilidades em Dependencias

### 9.1 Processo

1. **Deteccao:** Ferramentas no CI/CD (Snyk, npm audit)
2. **Avaliacao:** Verificar se vulnerabilidade afeta o uso
3. **Atualizacao:** Atualizar para versao corrigida
4. **Teste:** Validar compatibilidade
5. **Deploy:** Seguir processo normal de deploy

### 9.2 Politica de Dependencias

- Scan obrigatorio no pipeline de CI/CD
- Build falha para vulnerabilidades criticas/altas
- Revisao semanal de alertas
- Atualizacao proativa de dependencias

---

## 10. Vulnerabilidades Zero-Day

### 10.1 Definicao

Vulnerabilidade sem patch disponivel, possivelmente sendo explorada.

### 10.2 Resposta

1. Avaliar exposicao imediatamente
2. Implementar mitigacao temporaria
3. Monitorar tentativas de exploracao
4. Acompanhar lancamento de patch
5. Aplicar patch assim que disponivel

---

## 11. Teste de Penetracao

### 11.1 Frequencia e Escopo

| Tipo | Frequencia | Escopo |
|------|-----------|--------|
| Pentest externo | Anual | Perimetro, aplicacoes web |
| Pentest interno | Anual | Rede interna, AD |
| Pentest de aplicacao | Por release major | Aplicacoes novas/atualizadas |

### 11.2 Requisitos

- Realizado por empresa especializada
- Escopo definido previamente
- Relatorio detalhado com evidencias
- Reteste apos remediacao

---

## 12. Metricas e Relatorios

### 12.1 KPIs

| Metrica | Meta |
|---------|------|
| Vulnerabilidades criticas abertas | 0 |
| Tempo medio de remediacao (critica) | < 72h |
| Tempo medio de remediacao (alta) | < 7 dias |
| Cobertura de scan | 100% |
| Taxa de re-ocorrencia | < 5% |

### 12.2 Relatorios

| Relatorio | Frequencia | Audiencia |
|-----------|-----------|-----------|
| Status de vulnerabilidades | Semanal | Seguranca |
| Dashboard executivo | Mensal | Direcao |
| Tendencias e melhorias | Trimestral | Gestao |

---

## 13. Excecoes

### 13.1 Processo de Excecao

1. Solicitacao formal com justificativa
2. Analise de risco pela Seguranca
3. Aprovacao por nivel adequado
4. Documentacao de controles compensatorios
5. Data de expiracao obrigatoria
6. Revisao periodica

### 13.2 Aprovadores

| Severidade | Aprovador |
|------------|-----------|
| Critica | Direcao + DPO |
| Alta | Gerente de TI + Seguranca |
| Media/Baixa | Coordenador de Seguranca |

---

## 14. Responsabilidades

| Papel | Responsabilidade |
|-------|-----------------|
| Seguranca | Descoberta, avaliacao, acompanhamento |
| TI/DevOps | Aplicacao de patches, mitigacoes |
| Desenvolvedores | Correcao de vulnerabilidades de codigo |
| Gestores | Priorizacao de recursos |

---

## 15. Aprovacao

| Funcao | Nome | Data |
|--------|------|------|
| DPO | [Nome] | Janeiro 2026 |
| Gerente de TI | [Nome] | Janeiro 2026 |

---

*Auricapri - Todos os direitos reservados*
