# Politica de Classificacao de Dados

**Documento:** POL-SEG-006
**Versao:** 1.0
**Data de Vigencia:** Janeiro 2026
**Proxima Revisao:** Janeiro 2027
**Classificacao:** Interno

---

## 1. Objetivo

Estabelecer criterios para classificacao de dados e informacoes, definindo niveis de protecao e controles de criptografia para dados em transito e em repouso, garantindo a protecao adequada conforme a sensibilidade da informacao.

---

## 2. Escopo

Esta politica aplica-se a:
- Todos os dados criados, processados ou armazenados pela Auricapri
- Dados de clientes, parceiros e colaboradores
- Dados em qualquer formato (digital, fisico)
- Dados em qualquer localizacao (local, nuvem, dispositivos moveis)

---

## 3. Niveis de Classificacao

### 3.1 Tabela de Classificacao

| Nivel | Descricao | Exemplos |
|-------|-----------|----------|
| **PUBLICO** | Informacoes que podem ser divulgadas externamente | Site institucional, materiais de marketing |
| **INTERNO** | Informacoes para uso interno da organizacao | Procedimentos, comunicados internos |
| **CONFIDENCIAL** | Informacoes sensiveis de negocio | Contratos, dados financeiros, estrategias |
| **RESTRITO** | Informacoes altamente sensiveis | Dados pessoais, senhas, chaves de API |

### 3.2 Rotulagem

| Nivel | Rotulo | Cor (quando aplicavel) |
|-------|--------|------------------------|
| Publico | [PUBLICO] | Verde |
| Interno | [INTERNO] | Azul |
| Confidencial | [CONFIDENCIAL] | Amarelo |
| Restrito | [RESTRITO] | Vermelho |

---

## 4. Controles por Nivel

### 4.1 Dados PUBLICOS

| Controle | Requisito |
|----------|-----------|
| Criptografia em transito | Recomendado (HTTPS) |
| Criptografia em repouso | Nao obrigatoria |
| Controle de acesso | Nao obrigatorio |
| Backup | Conforme necessidade |

### 4.2 Dados INTERNOS

| Controle | Requisito |
|----------|-----------|
| Criptografia em transito | Obrigatoria (TLS 1.2+) |
| Criptografia em repouso | Recomendada |
| Controle de acesso | Autenticacao basica |
| Backup | Regular |
| Compartilhamento externo | Mediante aprovacao |

### 4.3 Dados CONFIDENCIAIS

| Controle | Requisito |
|----------|-----------|
| Criptografia em transito | Obrigatoria (TLS 1.2+) |
| Criptografia em repouso | Obrigatoria (AES-256) |
| Controle de acesso | Autenticacao + autorizacao |
| Backup | Regular + criptografado |
| Compartilhamento externo | Aprovacao gerencial |
| Registro de acesso | Obrigatorio |

### 4.4 Dados RESTRITOS

| Controle | Requisito |
|----------|-----------|
| Criptografia em transito | Obrigatoria (TLS 1.3) |
| Criptografia em repouso | Obrigatoria (AES-256) |
| Controle de acesso | MFA + privilegio minimo |
| Backup | Criptografado + segregado |
| Compartilhamento externo | Proibido (exceto com autorizacao DPO) |
| Registro de acesso | Detalhado + monitorado |
| Retencao | Conforme LGPD/politica |

---

## 5. Criptografia

### 5.1 Padroes de Criptografia

| Uso | Algoritmo | Tamanho de Chave |
|-----|-----------|------------------|
| Dados em repouso | AES | 256 bits |
| Comunicacao web | TLS | 1.2 ou superior |
| Transferencia de arquivos | SFTP/SCP | - |
| Email sensivel | S/MIME ou PGP | 2048+ bits |
| Senhas | bcrypt/Argon2 | - |

### 5.2 Dados em Transito

**Obrigatorio:**
- HTTPS para todas as aplicacoes web
- TLS 1.2+ para APIs
- VPN para conexoes remotas
- SFTP para transferencia de arquivos

**Proibido:**
- HTTP sem criptografia
- FTP tradicional
- Protocolos legados (SSL, TLS 1.0/1.1)

### 5.3 Dados em Repouso

**Banco de Dados:**
- Criptografia transparente (TDE) ou
- Criptografia em nivel de coluna para dados sensiveis
- Supabase: criptografia padrao habilitada

**Armazenamento:**
- Discos criptografados (BitLocker/FileVault)
- Buckets S3 com SSE (Server-Side Encryption)
- Backups criptografados

**Dispositivos:**
- Criptografia de disco completo obrigatoria
- Dispositivos moveis com criptografia nativa

---

## 6. Gerenciamento de Chaves

### 6.1 Armazenamento de Chaves

| Tipo | Local de Armazenamento |
|------|------------------------|
| Chaves de API | Gerenciador de segredos (ex: AWS Secrets Manager) |
| Chaves de criptografia | HSM ou KMS |
| Senhas de servico | Vault seguro |
| Certificados | Repositorio centralizado |

### 6.2 Rotacao de Chaves

| Tipo | Frequencia |
|------|-----------|
| Chaves de API | Anual ou apos incidente |
| Certificados TLS | Antes da expiracao |
| Chaves de criptografia | Anual |
| Senhas de servico | Anual |

### 6.3 Proibicoes

- Nunca armazenar chaves em codigo fonte
- Nunca enviar chaves por email ou chat
- Nunca usar chaves padrao/default
- Nunca compartilhar chaves de producao

---

## 7. Dados Pessoais (LGPD/GDPR)

### 7.1 Classificacao Automatica

Dados pessoais sao automaticamente classificados como RESTRITO:
- Nome completo
- CPF/RG
- Endereco
- Telefone
- Email pessoal
- Dados financeiros
- Dados de saude
- Biometria

### 7.2 Controles Adicionais

- Minimizacao: coletar apenas o necessario
- Pseudonimizacao: quando possivel
- Anonimizacao: para analytics
- Retencao: conforme finalidade
- Exclusao: mediante solicitacao ou fim da finalidade

---

## 8. Manuseio de Dados

### 8.1 Armazenamento

| Nivel | Local Permitido |
|-------|-----------------|
| Publico | Qualquer |
| Interno | Sistemas corporativos |
| Confidencial | Sistemas autorizados + criptografados |
| Restrito | Sistemas especificos + criptografados + auditados |

### 8.2 Transmissao

| Nivel | Metodo Permitido |
|-------|------------------|
| Publico | Qualquer |
| Interno | Email corporativo, sistemas internos |
| Confidencial | Email criptografado, sistemas seguros |
| Restrito | Canais criptografados, link seguro com expiracao |

### 8.3 Descarte

| Nivel | Metodo |
|-------|--------|
| Publico | Lixeira comum |
| Interno | Fragmentadora |
| Confidencial | Fragmentadora cross-cut |
| Restrito | Fragmentadora + certificado de destruicao |

---

## 9. Responsabilidades

### 9.1 Proprietario do Dado
- Classificar os dados
- Definir quem pode acessar
- Revisar classificacao periodicamente

### 9.2 Custodiante (TI)
- Implementar controles tecnicos
- Garantir criptografia adequada
- Monitorar acessos

### 9.3 Usuarios
- Respeitar a classificacao
- Nao reclassificar sem autorizacao
- Reportar incidentes

---

## 10. Auditoria

| Atividade | Frequencia |
|-----------|-----------|
| Revisao de classificacao | Anual |
| Teste de criptografia | Semestral |
| Auditoria de acessos | Trimestral |
| Validacao de descarte | Semestral |

---

## 11. Aprovacao

| Funcao | Nome | Data |
|--------|------|------|
| DPO | [Nome] | Janeiro 2026 |
| Gerente de TI | [Nome] | Janeiro 2026 |

---

*Auricapri - Todos os direitos reservados*
