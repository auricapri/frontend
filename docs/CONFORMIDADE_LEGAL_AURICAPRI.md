# CONFORMIDADE LEGAL COMPLETA - AURICAPRI E-COMMERCE
## auricapri.com.br - Loja de Roupas Online

**Documento consolidado de conformidade juridica**
**Versao: 1.0 | Atualizado: 15 de Fevereiro de 2026**
**Base: Pesquisa legislativa + Auditoria de codigo + Regulamentacao textil + Analise fiscal**

---

## INDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Auditoria do Codigo-Fonte](#2-auditoria-do-codigo-fonte)
3. [CDC e Direito do Consumidor](#3-cdc-e-direito-do-consumidor)
4. [Decreto 7.962/2013 (E-commerce)](#4-decreto-79622013-e-commerce)
5. [LGPD - Protecao de Dados](#5-lgpd---protecao-de-dados)
6. [Regulamentacao Textil e Vestuario](#6-regulamentacao-textil-e-vestuario)
7. [Publicidade e Promocoes](#7-publicidade-e-promocoes)
8. [Atacado (B2B)](#8-atacado-b2b)
9. [Obrigacoes Fiscais e Tributarias](#9-obrigacoes-fiscais-e-tributarias)
10. [Pagamentos](#10-pagamentos)
11. [Frete e Logistica](#11-frete-e-logistica)
12. [Sustentabilidade](#12-sustentabilidade)
13. [Checklist Completo de Conformidade](#13-checklist-completo-de-conformidade)
14. [Plano de Acao Prioritizado](#14-plano-de-acao-prioritizado)

---

## 1. RESUMO EXECUTIVO

### Visao Geral

A Auricapri e uma loja de roupas online (e-commerce B2C com canal B2B atacado) operando em auricapri.com.br. Este documento consolida toda a legislacao aplicavel, o resultado da auditoria do codigo-fonte do site, regulamentacoes especificas do setor textil e obrigacoes fiscais/tributarias.

### Stack Tecnologico Relevante

- **Frontend:** React (TypeScript)
- **Backend:** Node.js
- **Banco de Dados:** Supabase (PostgreSQL)
- **Pagamentos:** Asaas (certificado BACEN)
- **Frete:** Melhor Envio
- **IA:** Chat integrado via api-ia

### Situacao Atual - Resumo Rapido

| Categoria | Status | Detalhes |
|-----------|--------|----------|
| Identificacao da empresa (CNPJ, endereco) | OK | Footer completo |
| Pagina de privacidade | OK | Rota /privacy funcional |
| Pagina de termos | OK | Rota /terms funcional |
| Cookie banner | OK | Aceitar/rejeitar implementado |
| Transparencia de precos | OK | Subtotal, descontos, frete, total |
| Pagamento certificado | OK | Asaas autorizado BACEN |
| Envios e devolucoes (Art. 49) | OK | Pagina existente |
| FAQ funcional | OK | Modal implementado |
| Chat IA | OK | Integrado |
| Recibo com PDF | OK | Download funcional |
| **CNPJ no recibo** | **CRITICO** | **Placeholder hardcoded** |
| **Email de confirmacao** | **CRITICO** | **Nenhum servico de email** |
| **Exclusao de dados (LGPD)** | **CRITICO** | **Sem mecanismo** |
| **Consentimento LGPD no cadastro** | **CRITICO** | **Sem checkbox** |
| **Conteudo das politicas** | **CRITICO** | **Verificar se completas no Supabase** |
| **Analytics pre-consentimento** | **CRITICO** | **Default true viola LGPD** |

### Acoes Criticas (correcao imediata)

1. Substituir CNPJ placeholder no `OrderReceipt.tsx` pelo CNPJ real
2. Implementar servico de email (Resend/SendGrid) para confirmacao de pedidos
3. Criar mecanismo de exclusao de conta e dados pessoais
4. Adicionar checkbox de consentimento LGPD no formulario de registro
5. Verificar e completar conteudo das politicas de privacidade e termos no Supabase
6. Alterar `TrackingService` para default `analytics: false` (opt-in)

---

## 2. AUDITORIA DO CODIGO-FONTE

### 2.1 Itens em Conformidade (JA IMPLEMENTADOS)

| Item | Implementacao | Legislacao Atendida |
|------|--------------|---------------------|
| CookieBanner | Componente com aceitar/rejeitar | LGPD Art. 7, I e 8 |
| Pagina de privacidade | Rota `/privacy` funcional | LGPD Art. 9 |
| Pagina de termos | Rota `/terms` funcional | Decreto 7.962 Art. 2 |
| Envios e devolucoes | Pagina com Art. 49 mencionado | CDC Art. 49 |
| Preco transparente no checkout | Subtotal, descontos, frete e total discriminados | CDC Art. 31, Decreto 7.962 Art. 2, IV |
| Pagamento via Asaas | Certificado e autorizado pelo BACEN | Resolucao BCB |
| PIX com desconto 5% | Percentual informado claramente | CDC Art. 52 |
| Parcelas discriminadas | Valor com taxa exibido | CDC Art. 52, IV |
| Footer completo | CNPJ, endereco, email, telefone | Decreto 7.962 Art. 2, I-II |
| FAQ modal | Funcional e acessivel | Decreto 7.962 Art. 4, V |
| Chat IA integrado | Canal de atendimento eletronico | Decreto 7.962 Art. 4, V |
| Recibo de pedido com PDF | Download disponivel | Decreto 7.962 Art. 4, IV |

### 2.2 Itens CRITICOS (correcao imediata)

#### CRITICO 1: CNPJ Placeholder no Recibo
- **Arquivo:** `OrderReceipt.tsx`
- **Problema:** CNPJ hardcoded como `00.000.000/0001-99` em vez do CNPJ real da Auricapri
- **Legislacao:** Decreto 7.962/2013 Art. 2, I - obriga identificacao correta do fornecedor
- **Risco:** Recibo com CNPJ invalido pode ser considerado documento inidoeno
- **Correcao:** Substituir pelo CNPJ real da empresa

#### CRITICO 2: Ausencia de Servico de Email
- **Problema:** Nenhum servico de envio de email configurado no backend (sem nodemailer, resend, sendgrid)
- **Legislacao:** Decreto 7.962/2013 Art. 4, III - "confirmar imediatamente o recebimento da aceitacao da oferta"
- **Risco:** Multa PROCON + descumprimento direto do Decreto
- **Correcao:** Implementar servico de email (Resend ou SendGrid) para:
  - Confirmacao de pedido
  - Confirmacao de pagamento
  - Codigo de rastreamento
  - Confirmacao de solicitacao de devolucao

#### CRITICO 3: Sem Mecanismo de Exclusao de Dados
- **Problema:** Nenhuma funcionalidade para o usuario excluir conta ou solicitar eliminacao de dados pessoais
- **Legislacao:** LGPD Art. 18, IV e VI - direito a eliminacao de dados
- **Risco:** Multa ANPD ate 2% do faturamento (maximo R$ 50.000.000)
- **Correcao:** Criar endpoint e interface para:
  - Solicitacao de exclusao de conta
  - Eliminacao de dados pessoais (respeitando obrigacoes fiscais de retencao)
  - Confirmacao da exclusao

#### CRITICO 4: Consentimento LGPD no Cadastro
- **Problema:** Formulario de registro nao possui checkbox de consentimento LGPD
- **Legislacao:** LGPD Art. 7, I e Art. 8 - consentimento deve ser fornecido de forma destacada
- **Risco:** Todo tratamento de dados de usuarios registrados sem base legal valida
- **Correcao:** Adicionar checkbox obrigatorio com texto:
  - "Li e concordo com a Politica de Privacidade" (com link)
  - Registro do timestamp do consentimento no banco de dados
  - Opcao separada para marketing/newsletter

#### CRITICO 5: Conteudo das Politicas
- **Problema:** Paginas de privacidade e termos carregam conteudo do Supabase, com fallback "Carregando..."
- **Legislacao:** LGPD Art. 9, Decreto 7.962 Art. 2
- **Risco:** Se o conteudo no Supabase estiver incompleto, o site opera sem politicas adequadas
- **Correcao:** Verificar tabelas `privacy_policy` e `terms_of_service` no Supabase e garantir conteudo completo

#### CRITICO 6: Analytics Pre-Consentimento
- **Problema:** `TrackingService` assume `analytics: true` ANTES do usuario dar consentimento
- **Legislacao:** LGPD Art. 7, I e Art. 8 - consentimento deve ser PREVIO ao tratamento
- **Risco:** Coleta de dados sem base legal = infracao LGPD
- **Correcao:** Alterar default para `analytics: false`. So ativar apos consentimento explicito (opt-in)

### 2.3 Itens IMPORTANTES (correcao recomendada)

| # | Item | Problema | Legislacao | Correcao |
|---|------|----------|-----------|----------|
| 7 | Arrependimento no checkout | Direito de arrependimento nao mencionado antes da compra | Decreto 7.962 Art. 5 | Adicionar texto informativo no checkout |
| 8 | Composicao de produto | Fallback generico em ingles quando nao preenchido no banco | CDC Art. 31 (lingua portuguesa) | Garantir fallback em PT-BR ou exigir preenchimento |
| 9 | Termos de afiliados | Sem termos especificos para programa de afiliados | Codigo Civil Art. 421 | Criar termos de afiliados se programa existir |
| 10 | WhatsApp flutuante | Botao de contato so mencionado em texto, sem botao flutuante | Decreto 7.962 Art. 4, V | Adicionar botao flutuante de WhatsApp |
| 11 | Horario de atendimento | Nao visivel no site | Decreto 7.962 Art. 4, V | Exibir horario no footer ou pagina de contato |
| 12 | Cookies granulares | Banner so tem aceitar/rejeitar global, sem categorias | LGPD Art. 7-8 | Implementar opcoes: essenciais, analiticos, marketing |

---

## 3. CDC E DIREITO DO CONSUMIDOR

**Lei 8.078/1990 - Codigo de Defesa do Consumidor**

O CDC e a norma principal que rege TODAS as relacoes de consumo no Brasil, incluindo e-commerce. Aplicavel integralmente as vendas da Auricapri para consumidores finais (B2C). Para vendas atacado (B2B), ver Secao 8.

### 3.1 Direito de Arrependimento (Art. 49)

**Texto legal:** "O consumidor pode desistir do contrato, no prazo de 7 dias a contar de sua assinatura ou do ato de recebimento do produto ou servico, sempre que a contratacao de fornecimento de produtos e servicos ocorrer fora do estabelecimento comercial."

**Paragrafo unico:** "Os valores eventualmente pagos serao devolvidos, de imediato, monetariamente atualizados."

**Regras para a Auricapri:**

| Aspecto | Regra |
|---------|-------|
| Prazo | 7 dias corridos apos o RECEBIMENTO do produto |
| Justificativa | NAO pode ser exigida - direito incondicionado |
| Frete de devolucao | Por conta da LOJA (vendedor) |
| Estorno | IMEDIATO e monetariamente atualizado |
| Produto aberto | PODE ser devolvido (experimentar nao e usar) |
| Inicio do prazo | Data de entrega efetiva, nao da compra |
| Frete original | DEVE ser devolvido ao consumidor |

**Penalidade:** Multa administrativa do PROCON (Art. 56-57 do CDC), de 200 a 3.000.000 UFIRs (~R$ 200 a R$ 13.000.000). Acao judicial com condenacao em danos morais e materiais.

**Armadilhas comuns para e-commerce de roupas:**
- Negar devolucao alegando que a roupa foi "experimentada" (experimentar NAO e usar)
- Cobrar frete de devolucao do cliente
- Exigir justificativa para a devolucao
- Nao devolver o frete original pago pelo cliente
- Demorar para efetuar o estorno

### 3.2 Garantia Legal de Produtos (Art. 26)

**Prazos para reclamacao de vicios aparentes:**
- **Produtos nao duraveis:** 30 dias (roupas se enquadram aqui)
- **Produtos duraveis:** 90 dias

**Vicios ocultos (Art. 26, par. 3):** Para defeitos nao perceptiveis de imediato, o prazo comeca a contar a partir do momento em que o vicio se tornar evidente. Exemplo: costura que se desfaz apos a terceira lavagem.

**O que constitui vicio em roupas:**
- Defeito de costura
- Manchas de fabrica
- Tecido diferente do anunciado
- Cor que desbota anormalmente
- Botoes/ziperes com defeito
- Tamanho incorreto em relacao a tabela de medidas informada

### 3.3 Responsabilidade por Vicios do Produto (Art. 18)

O fornecedor tem ate 30 dias para sanar o vicio. Nao sendo sanado nesse prazo, o consumidor pode exigir:
- Substituicao do produto por outro da mesma especie
- Restituicao imediata da quantia paga, com atualizacao monetaria
- Abatimento proporcional do preco

**Para roupas especificamente (Art. 18, par. 3):** Como se trata de produto essencial, a troca/devolucao deve ser imediata. Nao e razoavel pedir que o cliente aguarde 30 dias para conserto de roupa com defeito.

### 3.4 Responsabilidade por Fato do Produto (Art. 12-13)

O fabricante responde por danos causados por defeitos de projeto, fabricacao ou informacoes insuficientes (Art. 12).

**A Auricapri (comerciante) responde quando (Art. 13):**
- O fabricante nao puder ser identificado
- O produto for fornecido sem identificacao do fabricante
- Nao conservar adequadamente os produtos

**Exemplo pratico:** Roupa que causa alergia por composicao nao informada - Auricapri responde solidariamente com o fabricante.

### 3.5 Informacoes Obrigatorias sobre Produtos (Art. 31)

"A oferta e apresentacao de produtos ou servicos devem assegurar informacoes corretas, claras, precisas, ostensivas e em lingua portuguesa."

**Para cada produto de roupa, DEVE constar:**
- Descricao completa (tipo de peca, estilo)
- Composicao do tecido (ex: 95% algodao, 5% elastano)
- Tabela de medidas detalhada (busto, cintura, quadril, comprimento)
- Cores disponiveis (com fotos reais, nao apenas renderizadas)
- Instrucoes de lavagem e conservacao
- Preco total (incluindo todas as taxas)
- Informacao sobre frete (custo e prazo estimado)
- Origem/fabricacao (nacional ou importada)
- Referencia/SKU do produto

**Penalidade:** Multa do PROCON + obrigacao de cumprir a oferta nos termos apresentados (Art. 35)

### 3.6 Precos e Ofertas (Art. 30 e 35)

**Art. 30:** Toda informacao ou publicidade suficientemente precisa obriga o fornecedor e integra o contrato.

**Art. 35:** Se o fornecedor recusar cumprimento da oferta, o consumidor pode:
- Exigir o cumprimento forcado
- Aceitar produto equivalente
- Rescindir o contrato com restituicao + perdas e danos

**Preco errado no site:** Se o site exibir preco errado (ex: vestido de R$200 por R$20), o consumidor pode exigir a venda nesse preco. Jurisprudencia dividida, mas PROCON tende a aplicar Art. 30.

### 3.7 Clausulas Abusivas (Art. 51)

Sao nulas de pleno direito clausulas que:
- Impossibilitem, exonerem ou atenuem a responsabilidade do fornecedor
- Subtraiam opcao de reembolso da quantia paga
- Transfiram responsabilidades a terceiros
- Estabelecam obrigacoes abusivas ao consumidor
- Autorizem o fornecedor a cancelar unilateralmente

---

## 4. DECRETO 7.962/2013 (E-COMMERCE)

Regulamenta especificamente o comercio eletronico no Brasil, complementando o CDC.

### 4.1 Informacoes Obrigatorias no Site (Art. 2)

O site deve disponibilizar, em local de destaque e facil visualizacao:

| Exigencia | Art. | Status Auricapri |
|-----------|------|-----------------|
| Nome empresarial e CNPJ | Art. 2, I | OK (footer) |
| Endereco fisico e eletronico | Art. 2, II | OK (footer) |
| Caracteristicas essenciais do produto | Art. 2, III | OK (paginas de produto) |
| Despesas adicionais discriminadas (frete, seguro) | Art. 2, IV | OK (checkout) |
| Condicoes da oferta (pagamento, prazo entrega) | Art. 2, V | OK (checkout) |
| Restricoes a oferta | Art. 2, VI | Verificar por produto |

### 4.2 Atendimento Facilitado ao Consumidor (Art. 4)

| Exigencia | Art. | Status Auricapri |
|-----------|------|-----------------|
| Sumario do contrato antes da compra | Art. 4, I | OK (resumo do pedido) |
| Ferramenta para correcao de erros na compra | Art. 4, II | OK (editar carrinho) |
| **Confirmacao imediata do recebimento do pedido** | **Art. 4, III** | **CRITICO - sem servico de email** |
| Contrato disponivel apos contratacao | Art. 4, IV | OK (recibo PDF) |
| SAC eletronico com resposta em ate 5 dias | Art. 4, V | OK (chat IA + FAQ) |

### 4.3 Direito de Arrependimento no E-commerce (Art. 5)

| Exigencia | Art. | Status Auricapri |
|-----------|------|-----------------|
| Informar meios para exercer arrependimento | Art. 5, I | Parcial - pagina existe mas falta no checkout |
| Arrependimento pelo mesmo canal da compra | Art. 5, par. 1 | Verificar se ha formulario online |
| Confirmacao imediata da solicitacao de devolucao | Art. 5, par. 3 | CRITICO - sem servico de email |
| Comunicacao ao gateway para estorno | Art. 5, II | Verificar integracao Asaas |

### 4.4 Penalidades (via CDC Art. 56)

- Multa administrativa
- Apreensao do produto
- Suspensao temporaria de atividade
- Cassacao de licenca do estabelecimento
- Contrapropaganda

**Fiscalizacao:** SENACON (Secretaria Nacional do Consumidor) e PROCONs estaduais/municipais.

---

## 5. LGPD - PROTECAO DE DADOS

**Lei 13.709/2018 - Lei Geral de Protecao de Dados Pessoais**

### 5.1 Situacao Atual da Auricapri

| Requisito LGPD | Status | Detalhe |
|----------------|--------|---------|
| Cookie banner | OK | Aceitar/rejeitar implementado |
| Pagina de privacidade | OK | Rota /privacy |
| Conteudo da politica | VERIFICAR | Depende do Supabase |
| Consentimento no cadastro | CRITICO | Sem checkbox |
| Exclusao de dados | CRITICO | Sem mecanismo |
| Analytics opt-in | CRITICO | Default true (deve ser false) |
| Cookies granulares | PENDENTE | Apenas global, sem categorias |
| DPO nomeado | PENDENTE | Verificar |

### 5.2 Consentimento para Cookies (Art. 7 e 8)

**Art. 7, I:** Tratamento somente mediante consentimento do titular.
**Art. 8:** Consentimento por escrito ou outro meio que demonstre manifestacao de vontade.

**Cookies que EXIGEM consentimento:**

| Cookie | Categoria | Base Legal |
|--------|-----------|-----------|
| Google Analytics | Analitico | Consentimento (Art. 7, I) ou Legitimo interesse (Art. 7, IX) |
| Facebook Pixel | Marketing | Consentimento (Art. 7, I) |
| Hotjar/heatmaps | Analitico | Consentimento (Art. 7, I) |
| Remarketing/retargeting | Marketing | Consentimento (Art. 7, I) |
| Carrinho abandonado | Funcional/Marketing | Consentimento (Art. 7, I) |

**Cookies que NAO exigem consentimento (essenciais):**
- Sessao do usuario
- Carrinho de compras
- Autenticacao/login
- Preferencias de idioma
- Seguranca (CSRF tokens)

**Gap no codigo:** O banner atual so oferece aceitar/rejeitar global. A LGPD e o padrao de mercado recomendam opcoes granulares (essenciais vs analiticos vs marketing).

### 5.3 Politica de Privacidade (Art. 9)

A politica DEVE informar:
- Finalidade especifica de cada tratamento
- Forma e duracao do tratamento
- Identificacao do controlador (dados da empresa)
- Contato do controlador
- Compartilhamento de dados (Asaas, Melhor Envio, etc.)
- Direitos do titular (Art. 18)
- Nome e contato do Encarregado (DPO)

**Dados tipicos coletados:**
- Nome completo, CPF, email, telefone (cadastro)
- Endereco de entrega e faturamento
- Dados de pagamento (processados pelo Asaas - Auricapri NAO armazena dados de cartao)
- Historico de compras e navegacao
- IP, cookies, dados de dispositivo
- Preferencias de tamanho e estilo

### 5.4 Direitos do Titular (Art. 18)

O titular tem direito a obter do controlador:
- **I** - Confirmacao da existencia de tratamento
- **II** - Acesso aos dados
- **III** - Correcao de dados incompletos ou desatualizados
- **IV** - Anonimizacao, bloqueio ou eliminacao de dados desnecessarios
- **V** - Portabilidade dos dados a outro fornecedor
- **VI** - Eliminacao dos dados tratados com consentimento
- **VII** - Informacao sobre compartilhamento de dados
- **VIII** - Informacao sobre nao fornecer consentimento e consequencias
- **IX** - Revogacao do consentimento

**Prazo de resposta:** 15 dias a partir da solicitacao.

**Gap critico no codigo:** Nao existe mecanismo para o usuario exercer direito de eliminacao (Art. 18, VI). E necessario criar endpoint e interface.

### 5.5 Bases Legais para Tratamento (Art. 7)

| Dado | Base Legal | Artigo |
|------|-----------|--------|
| Nome, CPF, endereco (entrega) | Execucao de contrato | Art. 7, V |
| Dados de pagamento | Execucao de contrato | Art. 7, V |
| Email para nota fiscal | Obrigacao legal | Art. 7, II |
| Email marketing/newsletter | Consentimento | Art. 7, I |
| Cookies analiticos | Consentimento ou Legitimo interesse | Art. 7, I ou Art. 7, IX |
| Cookies de marketing | Consentimento | Art. 7, I |
| Dados para antifraude | Legitimo interesse | Art. 7, IX |
| Historico de compras (fiscal) | Obrigacao legal | Art. 7, II |

### 5.6 Encarregado de Dados / DPO (Art. 41)

**Regra geral:** O controlador deve indicar encarregado pelo tratamento de dados.

**Para pequenas empresas (Resolucao ANPD):** Microempresas e EPPs podem ser dispensadas da indicacao de DPO. Porem, e-commerce que coleta dados de pagamento e CPF pode ser considerado tratamento de alto risco, mantendo a obrigacao.

**Recomendacao para Auricapri:** Mesmo que dispensada, indicar ao menos um responsavel interno (Marcus ou Raquel) como ponto de contato para titulares e ANPD.

### 5.7 Incidentes de Seguranca (Art. 48)

Em caso de incidente de seguranca que possa acarretar risco aos titulares:
- Comunicar a ANPD em ate **2 dias uteis**
- Comunicar os titulares afetados
- Informar: dados afetados, titulares envolvidos, medidas de seguranca, riscos, medidas de mitigacao

### 5.8 Sancoes (Art. 52)

| Sancao | Detalhes |
|--------|----------|
| Advertencia | Com prazo para correcao |
| Multa simples | Ate 2% do faturamento, limite R$ 50.000.000 por infracao |
| Multa diaria | Limite R$ 50.000.000 total |
| Publicizacao da infracao | Divulgacao publica da violacao |
| Bloqueio de dados | Impedimento de uso ate regularizacao |
| Eliminacao de dados | Exclusao dos dados obtidos irregularmente |
| Suspensao do banco de dados | Ate 6 meses, prorrogavel |
| Proibicao do tratamento | Parcial ou total |

### 5.9 Marco Civil da Internet (Lei 12.965/2014) - Complemento

**Guarda de registros:**
- Registros de acesso a aplicacao: manter por no minimo **6 meses** (Art. 15)
- Registros sob sigilo, fornecidos somente mediante ordem judicial
- Logs devem incluir IP e data/hora

**Responsabilidade por conteudo de terceiros (Art. 19):** Se o site tiver area de avaliacoes/reviews, a Auricapri nao e responsavel pelo conteudo postado por clientes, exceto se nao remover conteudo ilicito apos notificacao judicial.

---

## 6. REGULAMENTACAO TEXTIL E VESTUARIO

### 6.1 Etiquetagem Obrigatoria - INMETRO Portaria 118/2021

A Portaria 118/2021 do INMETRO estabelece requisitos obrigatorios de etiquetagem para produtos texteis comercializados no Brasil. A fiscalizacao e feita pelo IPEM (Instituto de Pesos e Medidas) de cada estado.

**Informacoes obrigatorias na etiqueta fisica do produto:**

| Informacao | Exigencia | Exemplo |
|-----------|-----------|---------|
| Composicao das fibras | Percentual de cada fibra | "95% Algodao, 5% Elastano" |
| Pais de origem | Onde foi fabricado | "Fabricado no Brasil" |
| Razao social ou marca | Do fabricante ou importador | "Auricapri LTDA" |
| CNPJ | Do fabricante ou importador | CNPJ real |
| Tamanho | Conforme norma brasileira | "M" ou "40" |
| Simbolos de conservacao | Conforme NM ISO 3758:2013 | 5 simbolos obrigatorios |

### 6.2 Composicao de Fibras Texteis - Lei 5.956/1973

**Regras de declaracao de composicao:**
- Todas as fibras com participacao igual ou superior a 5% devem ser identificadas individualmente
- Fibras com menos de 5% podem ser agrupadas como "Outras fibras"
- A composicao deve ser expressa em percentual de massa
- Deve ser em lingua portuguesa

**Gap no codigo:** O sistema possui fallback generico em INGLES quando a composicao nao esta preenchida no banco. Isso viola o CDC Art. 31 (informacao em lingua portuguesa) e a Lei 5.956/1973. Deve-se exigir preenchimento obrigatorio em PT-BR ou corrigir o fallback.

### 6.3 Simbolos de Conservacao - NM ISO 3758:2013

Sao 5 simbolos obrigatorios que devem constar na etiqueta:

| Simbolo | Significado | Exemplo |
|---------|-----------|---------|
| Bacia com agua | Lavagem | Lavagem a maquina 30C |
| Triangulo | Alvejamento | Nao alvejar |
| Quadrado com circulo | Secagem | Secagem em tambor permitida |
| Ferro | Passadoria | Passar a temperatura media |
| Circulo | Limpeza profissional | Limpeza a seco permitida |

**Para o e-commerce:** Embora esses simbolos sejam obrigatorios na etiqueta FISICA, e recomendado inclui-los tambem na pagina do produto no site para cumprir CDC Art. 31 (informacoes completas).

### 6.4 Fiscalizacao e Multas - IPEM

| Orgao | Ambito | Multa |
|-------|--------|-------|
| IPEM estadual | Fiscalizacao de etiquetas e conformidade | R$ 100 a R$ 1.500.000 |
| INMETRO | Regulamentacao e coordenacao nacional | Suspensao de comercializacao |

**Riscos para e-commerce:** O IPEM pode fiscalizar produtos vendidos online. Se a Auricapri vende produtos de terceiros (marketplace ou revenda), deve garantir que TODOS os produtos tenham etiquetagem conforme a Portaria 118/2021.

### 6.5 Tabela de Medidas - ABNT NBR 16933

A norma ABNT NBR 16933 estabelece referencial de medidas do corpo feminino para fins de modelagem. Embora NAO seja obrigatoria, e fortemente recomendada porque:
- Reduz trocas e devolucoes (economia para a loja)
- Evita reclamacoes por "tamanho incorreto" (CDC Art. 31)
- O PROCON pode interpretar tabela de medidas imprecisa como informacao insuficiente

**Recomendacao:** Manter tabela de medidas detalhada por produto, com medidas em centimetros, incluindo busto, cintura, quadril e comprimento. Informar modelo da foto (altura, tamanho utilizado).

### 6.6 Fotos de Produtos e Uso de IA

**Legislacao aplicavel:** Nao existe lei especifica no Brasil que proiba o uso de fotos geradas por IA para vender roupas. Porem:

- **CDC Art. 37:** Foto que cria expectativa incompativel com o produto real configura **publicidade enganosa**
- **CDC Art. 31:** Informacoes devem ser "corretas, claras, precisas"
- **CDC Art. 37, par. 1:** "E enganosa qualquer modalidade de informacao capaz de induzir em erro o consumidor a respeito da natureza, caracteristicas, qualidade, quantidade, propriedades, origem, preco"

**Regras praticas para Auricapri:**
- Fotos de IA podem ser usadas para ambientacao/lifestyle, mas o produto DEVE ser representado com fidelidade
- Cores, textura e caimento devem corresponder ao produto real
- Se usar modelo IA, informar que a imagem e ilustrativa
- SEMPRE ter ao menos uma foto real do produto (flat lay ou no corpo)
- Informar na pagina do produto: "As cores podem variar conforme configuracao do seu monitor"

---

## 7. PUBLICIDADE E PROMOCOES

### 7.1 Regras Gerais de Publicidade (CDC Art. 36-38)

**Art. 36:** A publicidade deve ser facilmente identificavel como tal. Posts patrocinados devem conter #publi ou #ad.

**Art. 37:** Proibida toda publicidade enganosa ou abusiva.

**Art. 38:** O onus da prova da veracidade cabe ao fornecedor (Auricapri).

### 7.2 CONAR - Codigo Brasileiro de Autorregulamentacao Publicitaria

O CONAR nao tem forca de lei, mas suas decisoes tem peso reputacional e podem ser usadas como referencia em acoes judiciais. Principais regras:
- Publicidade deve ser honesta e verdadeira
- Nao pode explorar medo, superstição ou violencia
- Comparacoes devem ser objetivas e comprováveis
- Influencers devem divulgar patrocinio de forma clara

### 7.3 Cupons de Desconto

**CDC Art. 30:** Cupom divulgado publicamente vincula o fornecedor. Uma vez emitido, DEVE ser honrado nas condicoes anunciadas.

**Regras para cupons:**

| Aspecto | Regra | Base Legal |
|---------|-------|-----------|
| Condicoes | Devem ser claras ANTES da compra | CDC Art. 30-31 |
| Validade | Deve ser informada | CDC Art. 31 |
| Restricoes | Devem ser destacadas (valor minimo, categorias) | CDC Art. 54, par. 4 |
| Cancelamento | Nao pode cancelar cupom ja divulgado enquanto vigente | CDC Art. 30 |
| Acumulo | Regra sobre acumulo deve ser clara | CDC Art. 31 |

### 7.4 Cashback

**Tratamento tributario:**
- **Desconto incondicional** (aplicado automaticamente a todos): NAO tributado separadamente - e reducao do preco de venda
- **Desconto condicional** (vinculado a comportamento futuro do cliente): Pode ter implicacoes tributarias. Consultar contador.

**Regras para implementacao:**
- Informar claramente as condicoes para receber o cashback
- Prazo de validade do credito deve ser explicito
- Regras de uso do credito (valor minimo, categorias) devem ser claras
- Cashback prometido vincula o fornecedor (CDC Art. 30)

### 7.5 Precificacao

| Pratica | Status | Base Legal |
|---------|--------|-----------|
| Preco "de/por" sem historico real | PROIBIDA | CDC Art. 37 (publicidade enganosa) |
| "A partir de R$" sem esclarecer | PROIBIDA | CDC Art. 37, par. 3 |
| Preco inflado antes da promocao | PROIBIDA | CDC Art. 37 |
| Desconto PIX informado claramente | PERMITIDA | Pratica legal e comum |
| Parcelamento "sem juros" (custo absorvido) | PERMITIDA | CDC Art. 52 |

---

## 8. ATACADO (B2B)

### 8.1 Diferenca Fundamental: CDC vs Codigo Civil

| Aspecto | Varejo (B2C) | Atacado (B2B) |
|---------|-------------|--------------|
| Lei aplicavel | CDC (Lei 8.078/90) | Codigo Civil (Lei 10.406/2002) |
| Direito de arrependimento | 7 dias, incondicionado (Art. 49) | NAO se aplica (contrato civil) |
| Garantia legal | 30/90 dias automatica | Conforme contrato |
| Clausulas abusivas | Nulas de pleno direito (Art. 51) | Principio da autonomia da vontade |
| Responsabilidade | Objetiva (independente de culpa) | Subjetiva (depende de culpa) |
| Foro | Domicilio do consumidor | Conforme contrato (pode ser sede da empresa) |
| Inversao do onus da prova | Automatica a favor do consumidor | Nao se aplica |

### 8.2 Requisitos para Venda B2B

Para que a venda seja reconhecida como B2B (e portanto fora do CDC), a Auricapri deve:

1. **Exigir CNPJ** do comprador no cadastro
2. **Verificar CNAE** adequado (comercio de vestuario)
3. **Ter termos de venda separados** para atacado
4. **Emitir NF-e** (modelo 55) em vez de NFC-e
5. **Contrato escrito** com condicoes comerciais, prazos, politica de trocas especifica

### 8.3 Termos de Atacado (Obrigatorio Criar)

Os termos de venda atacado devem incluir:
- Quantidade minima por pedido
- Politica de precos e descontos por volume
- Prazos de entrega
- Politica de trocas (diferente do varejo, pois CDC nao se aplica)
- Condicoes de pagamento
- Responsabilidade por frete
- Foro competente para resolucao de conflitos
- Clausula de rescisao

**ATENCAO:** Se o comprador B2B for destinatario final (compra para uso proprio da empresa, nao para revenda), o CDC PODE se aplicar por equiparacao a consumidor (jurisprudencia do STJ).

---

## 9. OBRIGACOES FISCAIS E TRIBUTARIAS

### 9.1 Nota Fiscal Eletronica - OBRIGATORIA

**A emissao de nota fiscal e obrigatoria em TODA venda online, independentemente do regime tributario.**

| Tipo | Modelo | Uso |
|------|--------|-----|
| NF-e | 55 | Vendas B2B e interestaduais |
| NFC-e | 65 | Vendas B2C (consumidor final) |

**O que deve constar na NF-e/NFC-e:**
- Dados completos do emitente (CNPJ, IE, endereco)
- Dados do destinatario (CPF, nome, endereco de entrega)
- Descricao detalhada dos produtos (NCM, CFOP, unidade, quantidade)
- Valores (unitario, total, descontos, frete)
- Impostos incidentes (ICMS, PIS, COFINS)
- CFOP adequado: 5.102 (venda dentro do estado) ou 6.102 (venda interestadual)

**Expressao obrigatoria para Simples Nacional:**
"DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NAO GERA DIREITO A CREDITO FISCAL DE IPI E DE ICMS."

**Penalidade por nao emissao:** Crime contra a ordem tributaria (Lei 8.137/90, Art. 1) - multa + pena de **reclusao de 2 a 5 anos**.

### 9.2 Simples Nacional - Aliquotas (Anexo I - Comercio)

| Faixa | Receita Bruta 12 meses | Aliquota | Desconto |
|-------|----------------------|----------|----------|
| 1a | Ate R$ 180.000 | 4,00% | - |
| 2a | R$ 180.000,01 a 360.000 | 7,30% | R$ 5.940 |
| 3a | R$ 360.000,01 a 720.000 | 9,50% | R$ 13.860 |
| 4a | R$ 720.000,01 a 1.800.000 | 10,70% | R$ 22.500 |
| 5a | R$ 1.800.000,01 a 3.600.000 | 14,30% | R$ 87.300 |
| 6a | R$ 3.600.000,01 a 4.800.000 | 19,00% | R$ 378.000 |

**Aliquota efetiva** = ((RBT12 x Aliquota) - Desconto) / RBT12

O ICMS ja esta incluido na guia DAS, eliminando calculos complexos (enquanto dentro do sublimite).

### 9.3 DIFAL - Diferencial de Aliquota (ICMS Interestadual)

**Aliquotas interestaduais de referencia:**
- 7% para estados do Norte, Nordeste e Centro-Oeste (+ ES)
- 12% para estados do Sul e Sudeste

**Para Auricapri (Simples Nacional):**

| Operacao | Obrigacao DIFAL | Base Legal |
|----------|----------------|-----------|
| Venda B2C para consumidor final de outro estado | **ISENTA** | ADI 5464 STF |
| Compra de mercadoria de outro estado | Pagar DIFAL na entrada | Legislacao estadual |

**Importante:** A isencao de DIFAL na saida B2C e exclusiva para empresas do Simples Nacional, conforme decisao do STF na ADI 5464.

### 9.4 Sublimite do Simples Nacional para ICMS

**Sublimite:** R$ 3.600.000 de receita bruta acumulada em 12 meses.

Se a Auricapri ultrapassar esse valor:
- Continua no Simples para demais tributos (ate R$ 4.800.000)
- ICMS e ISS passam a ser recolhidos SEPARADAMENTE (fora do DAS)
- Exige escrituracao fiscal completa para esses tributos

### 9.5 ICMS por Estado (Aliquotas Internas)

| Aliquota | Estados |
|----------|---------|
| 17% | ES, MT, MS, RS, SC |
| 18% | SP, MG, PR, RJ, PA, PI, SE, TO |
| 19% | AL, CE, PB, PE, RN |
| 20% | AC, AM, AP, BA, DF, GO, RO, RR |
| 23% | MA |

**Nota:** Essas aliquotas sao relevantes caso a Auricapri ultrapasse o sublimite do Simples para ICMS.

### 9.6 Obrigacoes Acessorias

| Obrigacao | Periodicidade | Prazo | Status 2026 |
|-----------|--------------|-------|-------------|
| DAS | Mensal | Dia 20 de cada mes | Vigente |
| DEFIS | Anual | Ate 31 de marco | Vigente |
| Escrituracao fiscal | Continua | Permanente | Vigente |
| DCTF | - | - | **Extinta em 2025** - substituida por DCTFWeb |
| DIRF | - | - | **Extinta em 2026** - substituida por eSocial + EFD-Reinf |
| SPED | Variavel | Depende do faturamento e estado | Verificar |

### 9.7 Reforma Tributaria 2026-2033

A Reforma Tributaria esta em fase de transicao. Pontos relevantes para 2026:

| Aspecto | Situacao em 2026 |
|---------|-----------------|
| IBS e CBS na NF-e | Novos campos exigidos |
| Simples Nacional | **Dispensado** de IBS e CBS em 2026 |
| Transicao completa | Ate 2033 |
| Recomendacao | Acompanhar atualizacoes com contador |

**Impacto pratico em 2026:** Manter sistemas atualizados para novos campos de NF-e, mas empresas do Simples nao precisam calcular IBS/CBS separadamente neste ano.

---

## 10. PAGAMENTOS

### 10.1 PIX

**Base legal:** Resolucao BCB n. 1/2020

| Aspecto | Regra |
|---------|-------|
| Natureza | Pagamento instantaneo, irrevogavel apos confirmacao |
| Desconto permitido | Sim, legal e comum. Auricapri oferece 5% |
| QR Code | Deve ser gerado por instituicao autorizada (Asaas e autorizada) |
| Validade do QR Code | Deve ser informada ao consumidor |
| Estorno | **NAO automatico** - devolucao deve ser nova transacao PIX ou outro meio |
| MED (fraude) | Mecanismo Especial de Devolucao permite bloqueio em caso de fraude |
| Registros | Manter registros de todas as transacoes |
| Chaves PIX de clientes | Nao armazenar alem do necessario |

**PIX Parcelado (fev/2026):** O BACEN desistiu de regulamentar modalidade propria. Instituicoes financeiras oferecem como produto de credito. O Asaas pode oferecer como intermediador.

### 10.2 Cartao de Credito - Parcelamento

**Informacoes obrigatorias (CDC Art. 52):**
- Preco do produto em moeda corrente nacional (Art. 52, I)
- Montante dos juros de mora e taxa efetiva anual (Art. 52, II)
- Acrescimos legalmente previstos (Art. 52, III)
- Numero e periodicidade das prestacoes (Art. 52, IV)
- Soma total a pagar, com e sem financiamento (Art. 52, V)

| Tipo | Obrigacao |
|------|----------|
| Parcelamento sem juros | Informar valor total e de cada parcela |
| Parcelamento com juros | Informar CET, taxa mensal e anual, valor total |
| Quitacao antecipada | Direito do consumidor com reducao proporcional de juros (Art. 52, par. 2) |

**Status Auricapri:** Parcelas discriminadas com taxa - OK.

### 10.3 Boleto Bancario

**Regulamentacao:** Circular BACEN n. 3.598/2012.

| Aspecto | Regra |
|---------|-------|
| Tipo | Boleto registrado **obrigatorio** desde 2018 (Nova Plataforma de Cobranca) |
| Vencimento | Prazo deve ser claramente informado |
| Apos vencimento | Maximo 2% de multa + 1% ao mes de juros |
| Pagamento apos vencimento | Ate 1 ano (depois, nova emissao necessaria) |

**Para e-commerce:**
- Reservar estoque durante prazo do boleto (1-3 dias)
- Cancelar pedido automaticamente se boleto nao for pago
- Informar que pedido so e processado apos compensacao

### 10.4 Obrigacoes Gerais de Transparencia (CDC Art. 52)

As obrigacoes do Art. 52 listadas na Secao 10.2 (cartao de credito) aplicam-se igualmente a QUALQUER modalidade de pagamento que envolva credito ou financiamento, incluindo boleto parcelado e eventuais modalidades futuras de PIX parcelado.

---

## 11. FRETE E LOGISTICA

### 11.1 Responsabilidade pela Entrega

**Principio fundamental:** Perante o consumidor, a responsabilidade e SEMPRE do vendedor (Auricapri), independentemente de a transportadora ser terceira.

| Situacao | Responsavel perante o consumidor | Base Legal |
|----------|--------------------------------|-----------|
| Extravio | Auricapri | CDC Art. 14 (responsabilidade objetiva) |
| Avaria | Auricapri | CDC Art. 14 |
| Atraso | Auricapri | CDC Art. 35 |
| Endereco errado (erro do cliente) | Cliente | Codigo Civil Art. 396 |

**Procedimento correto:**
1. Resolver com o cliente PRIMEIRO (reenviar ou estornar)
2. DEPOIS buscar ressarcimento da transportadora (acao de regresso)

### 11.2 Prazos de Entrega

**Decreto 7.962/2013 Art. 2, V:** O prazo informado no site vincula o vendedor.

**Recomendacoes:**
- Trabalhar com margem (transportadora estima 5 dias, informe 7-10)
- Informar prazo em dias UTEIS (excluir sabados, domingos e feriados)
- Separar prazo de despacho (preparo + postagem) do prazo de transporte
- Fornecer codigo de rastreamento ao cliente

**Penalidade por atraso (CDC Art. 35):** O consumidor pode exigir cumprimento forcado, produto equivalente ou rescisao do contrato com restituicao + perdas e danos.

### 11.3 Extravio e Avaria

**Responsabilidade solidaria (CDC Art. 7, par. unico + Art. 25, par. 1):** Todos na cadeia de fornecimento respondem solidariamente.

**Prazos para reclamacao de avaria:**
- Aparente: no ato do recebimento
- Oculta: 10 dias a partir da entrega (Codigo Civil Art. 754)

**Procedimentos:**
- **Extravio:** Reenviar produto ou estornar valor integral (incluindo frete)
- **Avaria:** Oferecer troca ou estorno. Solicitar fotos do produto danificado

### 11.4 Seguro de Carga

- O seguro RCTR-C e obrigatorio para transportadoras (Decreto-Lei 73/1966, SUSEP)
- O Melhor Envio oferece declaracao de valor/seguro nas cotacoes
- **Recomendacao:** SEMPRE declarar o valor correto do produto
- O custo do seguro pode ser embutido no frete ou absorvido pela loja

### 11.5 Logistica Reversa (Devolucoes)

**Obrigatoria em caso de:**
- Exercicio do direito de arrependimento (CDC Art. 49)
- Produto com defeito/vicio (CDC Art. 18)
- Troca oferecida pela politica da loja

**Opcoes de implementacao:**
1. Correios - Logistica Reversa (codigo de postagem gratuita)
2. Melhor Envio - Reversa
3. Coleta no endereco (itens de alto valor)

**Custo:**

| Motivo | Quem paga o frete reverso |
|--------|--------------------------|
| Arrependimento (Art. 49) | LOJA |
| Defeito/vicio (Art. 18) | LOJA |
| Troca por conveniencia do cliente | Pode ser do CLIENTE (se politica for clara) |

---

## 12. SUSTENTABILIDADE

### 12.1 Politica Nacional de Residuos Solidos (Lei 12.305/2010)

**Obrigacoes aplicaveis ao e-commerce de roupas:**

| Obrigacao | Exigencia | Status |
|-----------|-----------|--------|
| Embalagens reciclaveis | Priorizar materiais reciclaveis | Verificar |
| Logistica reversa de embalagens | Responsabilidade compartilhada | Nao regulamentado especificamente para texteis |
| Descarte adequado | Nao enviar residuos para aterro se reciclavel | Boa pratica |

### 12.2 Regulamentacao Especifica para Texteis

**Situacao em 2026:** NAO existe regulamentacao especifica de sustentabilidade para o setor textil no Brasil. A Lei 12.305/2010 exige embalagens reciclaveis de forma geral, mas nao ha obrigacao especifica para:
- Logistica reversa de roupas
- Percentual minimo de material reciclado
- Selo de sustentabilidade obrigatorio

### 12.3 Recomendacoes (Boas Praticas)

Embora nao obrigatorias, as seguintes praticas fortalecem a marca e antecipam regulamentacoes futuras:
- Usar embalagens reciclaveis ou biodegradaveis
- Evitar plastico desnecessario na embalagem
- Informar composicao das embalagens
- Oferecer programa de reciclagem/descarte de roupas usadas (diferencial competitivo)
- Se alegar sustentabilidade, ter provas (CDC Art. 36-38 - onus da prova e do fornecedor)

**ATENCAO:** Alegar sustentabilidade sem comprovar configura **greenwashing**, que pode ser enquadrado como publicidade enganosa (CDC Art. 37).

---

## COMPLEMENTOS LEGAIS

### Codigo Civil - Contratos Eletronicos

**Art. 104:** Para validade do contrato: agente capaz, objeto licito e forma prescrita ou nao defesa em lei.

**Art. 107:** A validade da declaracao de vontade nao depende de forma especial, senao quando a lei a exigir.

**Art. 427:** A proposta de contrato obriga o proponente. Precos e condicoes no site vinculam a loja.

**Art. 429:** A oferta ao publico equivale a proposta quando encerrar os requisitos essenciais ao contrato.

**Art. 421-422:** Boa-fe e funcao social do contrato. Termos de Uso nao podem conter clausulas abusivas que prejudiquem desproporcionalmente o consumidor.

**MP 2.200-2/2001, Art. 10, par. 2:** Clickwrap (aceitacao por clique) e juridicamente valido.

### PROCON - Fiscalizacao e Multas

**Calculo de multa PROCON-SP (Portaria 57/19):**
```
(REC x NAT) + VA = BASE DA PENALIDADE
```
Onde: REC = Receita bruta, NAT = Fator multiplicador por gravidade, VA = Vantagem auferida.

**Exemplos reais de multas (2024-2025):**
- **Kabum:** R$ 1.000.000 por nao entregar compras online
- **Sephora:** R$ 514.729,75 (PROCON-SP) por nao entregar no prazo e cancelar pedidos na Black Friday 2024
- **Lojas menores:** R$ 5.000 a R$ 50.000 por falta de informacoes obrigatorias no site

**Infracoes mais comuns em e-commerce de roupas:**

| Infracao | Artigo CDC | Risco |
|----------|-----------|-------|
| Nao entregar produto no prazo | Art. 35 | ALTO |
| Dificultar direito de arrependimento | Art. 49 + Dec. 7.962 Art. 5 | ALTO |
| Publicidade enganosa (fotos irreais) | Art. 37 | ALTO |
| Cancelamento unilateral de pedido | Art. 35 | ALTO |
| Cobranca indevida | Art. 39, V | ALTO |
| Nao informar CNPJ no site | Dec. 7.962 Art. 2 | MEDIO |
| Nao informar composicao do tecido | Art. 31 | MEDIO |
| Clausulas abusivas nos termos | Art. 51 | MEDIO |
| Nao ter SAC eletronico funcional | Dec. 7.962 Art. 4 | MEDIO |
| Nao enviar confirmacao de pedido | Dec. 7.962 Art. 4 | BAIXO |

### Regulamentacoes Estaduais Relevantes

**Lei Estadual de SP 13.747/2009 ("Lei da Entrega"):**
- Obriga fixar data e turno (manha 7h-12h, tarde 12h-18h, noite 18h-23h) para entrega
- Para e-commerce com transportadora (Melhor Envio/Correios), o prazo estimado ja atende essa exigencia
- Multa: 200 a 3.000.000 de UFESPs

**Lei de Liberdade Economica (Lei 13.874/2019, Art. 3):**
- E-commerce de roupas pode se enquadrar como atividade de baixo risco
- Dispensa de alvara municipal em muitos municipios

**PROCONs estaduais mais rigorosos:**
- PROCON-SP: Portaria 57/19 com formula baseada em receita bruta
- PROCON-RJ: Fiscalizacao ativa em e-commerce
- PROCON-MG: Multas significativas por atraso de entrega

---

## 13. CHECKLIST COMPLETO DE CONFORMIDADE

### Legenda de Status:
- **[OK]** = Implementado e conforme
- **[PENDENTE]** = Nao implementado, correcao recomendada
- **[CRITICO]** = Nao implementado, correcao imediata exigida por lei

### 13.1 Identificacao e Informacoes no Site

| # | Item | Base Legal | Status |
|---|------|-----------|--------|
| 1 | CNPJ visivel em todas as paginas (rodape) | Decreto 7.962 Art. 2, I | [OK] |
| 2 | Razao social completa | Decreto 7.962 Art. 2, I | [OK] |
| 3 | Endereco fisico completo | Decreto 7.962 Art. 2, II | [OK] |
| 4 | Email de contato | Decreto 7.962 Art. 2, II | [OK] |
| 5 | Telefone/WhatsApp de atendimento | Decreto 7.962 Art. 2, II | [OK] |
| 6 | CNPJ correto no recibo (OrderReceipt.tsx) | Decreto 7.962 Art. 2, I | [CRITICO] |
| 7 | Horario de atendimento visivel | Decreto 7.962 Art. 4, V | [PENDENTE] |
| 8 | Botao WhatsApp flutuante | Decreto 7.962 Art. 4, V | [PENDENTE] |

### 13.2 Produtos e Informacoes

| # | Item | Base Legal | Status |
|---|------|-----------|--------|
| 9 | Descricao completa de cada produto | CDC Art. 31 | [OK] |
| 10 | Composicao do tecido em portugues | CDC Art. 31, Lei 5.956/73 | [PENDENTE] - fallback em ingles |
| 11 | Tabela de medidas por produto | CDC Art. 31, ABNT NBR 16933 | [OK] |
| 12 | Fotos reais dos produtos | CDC Art. 37 | [OK] |
| 13 | Instrucoes de conservacao | NM ISO 3758:2013, CDC Art. 31 | [PENDENTE] - verificar por produto |
| 14 | Origem/fabricacao informada | Portaria INMETRO 118/2021, CDC Art. 31 | [PENDENTE] - verificar por produto |
| 15 | Referencia/SKU | CDC Art. 31 | [OK] |

### 13.3 Precos e Checkout

| # | Item | Base Legal | Status |
|---|------|-----------|--------|
| 16 | Preco total discriminado | CDC Art. 31, Decreto 7.962 Art. 2, IV | [OK] |
| 17 | Calculo de frete por CEP | Decreto 7.962 Art. 2, IV | [OK] |
| 18 | Resumo do pedido antes de confirmar | Decreto 7.962 Art. 4, I | [OK] |
| 19 | Botao editar/corrigir erros | Decreto 7.962 Art. 4, II | [OK] |
| 20 | Informacao de arrependimento no checkout | Decreto 7.962 Art. 5, I | [PENDENTE] |
| 21 | Parcelas discriminadas com taxa | CDC Art. 52 | [OK] |
| 22 | Desconto PIX claro | CDC Art. 52 | [OK] |

### 13.4 Pagamentos

| # | Item | Base Legal | Status |
|---|------|-----------|--------|
| 23 | Processamento via gateway certificado | Resolucao BCB | [OK] - Asaas |
| 24 | Boleto registrado | Circular BACEN 3.598/2012 | [OK] - via Asaas |
| 25 | PIX via instituicao autorizada | Resolucao BCB 1/2020 | [OK] - via Asaas |
| 26 | Informacao de validade do QR Code PIX | Resolucao BCB | [PENDENTE] |

### 13.5 LGPD e Privacidade

| # | Item | Base Legal | Status |
|---|------|-----------|--------|
| 27 | Pagina de privacidade | LGPD Art. 9 | [OK] |
| 28 | Pagina de termos | Decreto 7.962, Codigo Civil | [OK] |
| 29 | Conteudo completo das politicas (Supabase) | LGPD Art. 9 | [CRITICO] - verificar |
| 30 | Cookie banner com aceitar/rejeitar | LGPD Art. 7-8 | [OK] |
| 31 | Cookies com opcoes granulares | LGPD Art. 7-8 | [PENDENTE] |
| 32 | Checkbox de consentimento no cadastro | LGPD Art. 7, I e Art. 8 | [CRITICO] |
| 33 | Mecanismo de exclusao de dados/conta | LGPD Art. 18, IV e VI | [CRITICO] |
| 34 | Analytics opt-in (default false) | LGPD Art. 7, I | [CRITICO] |
| 35 | DPO/Encarregado nomeado | LGPD Art. 41 | [PENDENTE] |
| 36 | Canal para solicitacoes de titulares | LGPD Art. 18 | [PENDENTE] |
| 37 | Logs de acesso por 6 meses | Marco Civil Art. 15 | [PENDENTE] - verificar |

### 13.6 Processo de Compra e Pos-Venda

| # | Item | Base Legal | Status |
|---|------|-----------|--------|
| 38 | Email de confirmacao de pedido IMEDIATO | Decreto 7.962 Art. 4, III | [CRITICO] |
| 39 | Email de confirmacao de pagamento | Decreto 7.962 Art. 4, III | [CRITICO] |
| 40 | Email com codigo de rastreamento | Decreto 7.962 Art. 4, IV | [CRITICO] |
| 41 | Canal SAC funcional (resposta em ate 5 dias) | Decreto 7.962 Art. 4, V | [OK] - chat IA + FAQ |
| 42 | Processo de devolucao facil e acessivel | CDC Art. 49, Decreto 7.962 Art. 5 | [OK] - pagina existe |
| 43 | Estorno imediato em arrependimento | CDC Art. 49, par. unico | [PENDENTE] - verificar fluxo |
| 44 | Logistica reversa sem custo (arrependimento/defeito) | CDC Art. 49 | [PENDENTE] - verificar |
| 45 | Nota fiscal em cada venda | Lei 8.137/90 Art. 1 | [PENDENTE] - verificar |
| 46 | Recibo de pedido com PDF | Decreto 7.962 Art. 4, IV | [OK] |

### 13.7 Fiscal e Tributario

| # | Item | Base Legal | Status |
|---|------|-----------|--------|
| 47 | Emissao de NF-e/NFC-e em toda venda | Lei 8.137/90 | [PENDENTE] - verificar |
| 48 | CFOP correto (5.102 / 6.102) | Legislacao ICMS | [PENDENTE] - verificar |
| 49 | DAS pago mensalmente | LC 123/2006 | [PENDENTE] - verificar |
| 50 | DEFIS anual | LC 123/2006 | [PENDENTE] - verificar |
| 51 | Escrituracao fiscal em dia | LC 123/2006 | [PENDENTE] - verificar |

### 13.8 Regulamentacao Textil

| # | Item | Base Legal | Status |
|---|------|-----------|--------|
| 52 | Etiqueta com composicao de fibras | Portaria INMETRO 118/2021, Lei 5.956/73 | [PENDENTE] - verificar fornecedores |
| 53 | Etiqueta com pais de origem | Portaria INMETRO 118/2021 | [PENDENTE] - verificar fornecedores |
| 54 | Etiqueta com simbolos de conservacao | NM ISO 3758:2013 | [PENDENTE] - verificar fornecedores |
| 55 | Etiqueta com CNPJ do fabricante | Portaria INMETRO 118/2021 | [PENDENTE] - verificar fornecedores |
| 56 | Etiqueta com tamanho | Portaria INMETRO 118/2021 | [PENDENTE] - verificar fornecedores |

### 13.9 Atacado (B2B)

| # | Item | Base Legal | Status |
|---|------|-----------|--------|
| 57 | Termos de venda atacado separados | Codigo Civil Art. 421 | [PENDENTE] |
| 58 | Exigencia de CNPJ no cadastro B2B | Legislacao tributaria | [PENDENTE] |
| 59 | NF-e modelo 55 para vendas B2B | Legislacao ICMS | [PENDENTE] - verificar |

### 13.10 Sustentabilidade

| # | Item | Base Legal | Status |
|---|------|-----------|--------|
| 60 | Embalagens reciclaveis priorizadas | Lei 12.305/2010 | [PENDENTE] - verificar |
| 61 | Sem alegacoes de sustentabilidade nao comprovadas | CDC Art. 37 | [OK] - nao alega |

### 13.11 Publicidade e Promocoes

| # | Item | Base Legal | Status |
|---|------|-----------|--------|
| 62 | Condicoes de cupons claras | CDC Art. 30-31 | [PENDENTE] - verificar |
| 63 | Cashback com regras explicitas | CDC Art. 30 | [PENDENTE] - se aplicavel |
| 64 | Posts patrocinados identificados | CDC Art. 36 | [PENDENTE] - verificar redes sociais |

---

## 14. PLANO DE ACAO PRIORITIZADO

### FASE 1 - CRITICO (implementar em ate 7 dias)

Estes itens representam violacoes diretas de lei que podem gerar multas ou processos.

| Prioridade | Acao | Responsavel | Arquivo/Area |
|-----------|------|------------|--------------|
| P1 | Corrigir CNPJ no recibo (substituir placeholder pelo CNPJ real) | Dev Frontend | `OrderReceipt.tsx` |
| P2 | Implementar servico de email (Resend ou SendGrid) | Dev Backend | Backend - novo servico |
| P3 | Configurar emails automaticos: confirmacao de pedido, pagamento e rastreamento | Dev Backend | Backend - integracao |
| P4 | Alterar TrackingService para analytics: false (opt-in) | Dev Frontend | `TrackingService.ts` |
| P5 | Adicionar checkbox LGPD no formulario de registro | Dev Frontend | Componente de registro |
| P6 | Verificar e completar conteudo de privacy_policy e terms_of_service no Supabase | Admin/Juridico | Supabase |

### FASE 2 - IMPORTANTE (implementar em ate 30 dias)

Estes itens completam a conformidade e reduzem riscos operacionais.

| Prioridade | Acao | Responsavel | Arquivo/Area |
|-----------|------|------------|--------------|
| P7 | Criar endpoint e interface para exclusao de conta/dados (LGPD Art. 18) | Dev Backend + Frontend | Novo endpoint + pagina |
| P8 | Adicionar informacao de arrependimento no checkout | Dev Frontend | Componente de checkout |
| P9 | Corrigir fallback de composicao para portugues | Dev Frontend | Componente de produto |
| P10 | Implementar cookies granulares (essenciais, analiticos, marketing) | Dev Frontend | `CookieBanner` |
| P11 | Adicionar horario de atendimento no footer | Dev Frontend | Footer |
| P12 | Adicionar botao WhatsApp flutuante | Dev Frontend | Layout global |
| P13 | Nomear DPO/Encarregado e divulgar contato | Admin | Politica de Privacidade |
| P14 | Criar canal formal para solicitacoes de titulares (LGPD) | Admin + Dev | Email/formulario dedicado |

### FASE 3 - RECOMENDADO (implementar em ate 90 dias)

Estes itens fortalecem a conformidade e preparam para escala.

| Prioridade | Acao | Responsavel | Arquivo/Area |
|-----------|------|------------|--------------|
| P15 | Criar termos de venda atacado (B2B) | Juridico | Novo documento |
| P16 | Implementar exigencia de CNPJ no cadastro atacado | Dev Backend | Cadastro B2B |
| P17 | Verificar etiquetagem dos fornecedores (Portaria INMETRO 118/2021) | Operacoes | Fornecedores |
| P18 | Criar termos de afiliados (se programa existir) | Juridico | Novo documento |
| P19 | Verificar emissao automatica de NF-e/NFC-e em toda venda | Admin + Contador | Integracao fiscal |
| P20 | Implementar logs de acesso por 6 meses (Marco Civil) | Dev Backend | Infraestrutura |
| P21 | Criar programa de embalagens reciclaveis | Operacoes | Logistica |
| P22 | Informar validade do QR Code PIX | Dev Frontend | Checkout |
| P23 | Auditar redes sociais (posts patrocinados identificados) | Marketing | Instagram/TikTok |

### FASE 4 - MANUTENCAO CONTINUA

| Acao | Frequencia | Responsavel |
|------|-----------|------------|
| Verificar obrigacoes acessorias (DAS, DEFIS) | Mensal/Anual | Contador |
| Acompanhar Reforma Tributaria (IBS/CBS) | Trimestral | Contador |
| Atualizar politicas de privacidade e termos | Semestral | Juridico |
| Verificar conformidade de novos produtos (etiquetas) | A cada nova colecao | Operacoes |
| Treinar equipe sobre LGPD e direitos do consumidor | Semestral | Admin |
| Backup de dados e teste de restauracao | Mensal | Dev/Infra |
| Revisar e testar fluxo de devolucao | Trimestral | Operacoes |

---

## RESUMO DE PENALIDADES POR LEGISLACAO

| Legislacao | Penalidade Maxima | Orgao Fiscalizador |
|-----------|-------------------|-------------------|
| CDC (multa PROCON) | ~R$ 13.000.000 | PROCONs |
| Decreto 7.962/2013 | Mesmas do CDC | SENACON / PROCONs |
| LGPD | R$ 50.000.000 ou 2% faturamento | ANPD |
| Marco Civil da Internet | Judicial (caso a caso) | Poder Judiciario |
| Obrigacoes fiscais (NF-e) | Multa + reclusao 2-5 anos | Receita Federal / SEFAZ |
| ICMS | 50-200% do valor do imposto | SEFAZ estadual |
| INMETRO (etiquetagem) | R$ 100 a R$ 1.500.000 | IPEM estadual |

---

## REFERENCIAS LEGAIS

- **Lei 8.078/1990** (CDC): https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- **Decreto 7.962/2013** (E-commerce): https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm
- **Lei 13.709/2018** (LGPD): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709compilado.htm
- **Lei 12.965/2014** (Marco Civil): http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm
- **Codigo Civil** (Lei 10.406/2002): https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm
- **Lei 8.137/1990** (Crimes tributarios): https://www.planalto.gov.br/ccivil_03/leis/l8137.htm
- **Lei 5.956/1973** (Fibras texteis): https://www.planalto.gov.br/ccivil_03/leis/1970-1979/l5956.htm
- **Portaria INMETRO 118/2021** (Etiquetagem textil): https://www.gov.br/inmetro/pt-br
- **NM ISO 3758:2013** (Simbolos de conservacao): ABNT
- **ABNT NBR 16933** (Medidas femininas): ABNT
- **Lei 12.305/2010** (Residuos solidos): https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm
- **LC 123/2006** (Simples Nacional): https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm
- **Resolucao BCB 1/2020** (PIX): https://www.bcb.gov.br
- **MP 2.200-2/2001** (Certificacao digital): https://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm

---

**AVISO:** Este documento e uma compilacao para fins de referencia interna da Auricapri. Nao substitui consultoria juridica profissional. Recomenda-se validacao com advogado especializado em direito do consumidor, direito digital e direito tributario antes de implementar mudancas. Legislacao e jurisprudencia podem mudar - manter este documento atualizado.

**Ultima revisao:** 15 de Fevereiro de 2026
**Responsavel pela compilacao:** Equipe tecnica Auricapri
