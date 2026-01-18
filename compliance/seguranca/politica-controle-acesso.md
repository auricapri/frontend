# Politica de Controle de Acesso

**Documento:** POL-SEG-005
**Versao:** 1.0
**Data de Vigencia:** Janeiro 2026
**Proxima Revisao:** Janeiro 2027
**Classificacao:** Interno

---

## 1. Objetivo

Estabelecer diretrizes para o controle de acesso logico e fisico aos sistemas e dados da Auricapri, garantindo que apenas usuarios autorizados tenham acesso aos recursos necessarios para suas funcoes, seguindo o principio do privilegio minimo.

---

## 2. Escopo

Esta politica aplica-se a:
- Todos os sistemas de informacao
- Todos os bancos de dados
- Infraestrutura de rede
- Servicos em nuvem
- Instalacoes fisicas
- Todos os colaboradores, terceiros e parceiros

---

## 3. Principios Fundamentais

### 3.1 Privilegio Minimo
Usuarios recebem apenas os acessos estritamente necessarios para executar suas funcoes.

### 3.2 Necessidade de Conhecer
Acesso a informacoes concedido apenas quando ha necessidade legitima de negocio.

### 3.3 Segregacao de Funcoes
Funcoes criticas divididas entre diferentes pessoas para prevenir fraudes e erros.

---

## 4. Gestao de Identidades

### 4.1 Criacao de Contas

| Etapa | Responsavel | Prazo |
|-------|-------------|-------|
| Solicitacao | Gestor do colaborador | Antes do inicio |
| Aprovacao | Gestor + Seguranca | 24h |
| Criacao | TI | 24h apos aprovacao |
| Validacao | Usuario | Primeiro acesso |

### 4.2 Informacoes Requeridas

- Nome completo
- Cargo/funcao
- Departamento
- Gestor responsavel
- Data de inicio
- Sistemas necessarios
- Nivel de acesso requerido

### 4.3 Contas Privilegiadas

**Requisitos Adicionais:**
- Aprovacao de nivel gerencial
- Justificativa documentada
- MFA obrigatorio
- Monitoramento de atividades
- Revisao trimestral

---

## 5. Niveis de Acesso

### 5.1 Matriz de Acesso por Funcao

| Perfil | Email | ERP | Banco Dados | Producao | Admin |
|--------|-------|-----|-------------|----------|-------|
| Colaborador | Leitura/Escrita | Leitura | - | - | - |
| Analista | Leitura/Escrita | Leitura/Escrita | Leitura | - | - |
| Desenvolvedor | Leitura/Escrita | Leitura | Leitura | Dev apenas | - |
| Operacao | Leitura/Escrita | Leitura/Escrita | Leitura | Leitura | - |
| Administrador | Total | Total | Total | Total | Total |

### 5.2 Acesso a Dados Pessoais

Restrito a:
- Equipe de privacidade/DPO
- Funcoes com necessidade documentada
- Sempre com registro de auditoria

---

## 6. Autenticacao

### 6.1 Requisitos por Sistema

| Tipo de Sistema | Autenticacao |
|-----------------|-------------|
| Sistemas internos | SSO + MFA |
| Sistemas criticos | SSO + MFA + IP restrito |
| Banco de dados | Certificado + senha |
| Servidores | SSH com chave + MFA |

### 6.2 Single Sign-On (SSO)

- Implementado para todos os sistemas compativeis
- Provedor: [Nome do provedor - ex: Okta, Azure AD]
- Timeout de sessao: 8 horas
- Re-autenticacao para acoes criticas

---

## 7. Autorizacao

### 7.1 Processo de Solicitacao

1. Usuario solicita acesso via sistema de tickets
2. Gestor aprova a solicitacao
3. Proprietario do dado/sistema aprova
4. Seguranca valida (para acessos criticos)
5. TI implementa o acesso
6. Usuario confirma recebimento

### 7.2 Acesso Temporario

| Tipo | Duracao Maxima | Aprovador |
|------|----------------|-----------|
| Projeto | Duracao do projeto | Gestor de projeto |
| Emergencia | 24 horas | Seguranca |
| Terceiro | Duracao do contrato | Gestor responsavel |

---

## 8. Revisao de Acessos

### 8.1 Frequencia

| Tipo de Acesso | Frequencia |
|----------------|-----------|
| Acessos regulares | Semestral |
| Acessos privilegiados | Trimestral |
| Acessos a dados pessoais | Trimestral |
| Terceiros | Mensal |

### 8.2 Processo de Revisao

1. Lista de acessos gerada automaticamente
2. Gestor recebe lista de sua equipe
3. Gestor valida cada acesso (manter/revogar)
4. TI implementa revogacoes
5. Auditoria valida processo

---

## 9. Revogacao de Acessos

### 9.1 Desligamento

| Tipo | Prazo de Revogacao |
|------|-------------------|
| Demissao | Imediato |
| Pedido de demissao | Ultimo dia |
| Transferencia | 24h apos mudanca |
| Fim de contrato (terceiro) | Ultimo dia |

### 9.2 Checklist de Offboarding

- [ ] Acesso a email revogado
- [ ] Acesso a sistemas revogado
- [ ] VPN desabilitada
- [ ] Cracha recolhido
- [ ] Equipamentos devolvidos
- [ ] Acesso a nuvem revogado
- [ ] Chaves/senhas compartilhadas trocadas

---

## 10. Contas de Servico

### 10.1 Requisitos

- Nome descritivo (nao generico)
- Proprietario designado
- Documentacao de uso
- Senha forte ou certificado
- Sem acesso interativo

### 10.2 Gerenciamento

- Inventario atualizado
- Revisao semestral
- Rotacao de credenciais anual
- Monitoramento de uso

---

## 11. Acesso Remoto

### 11.1 VPN

- Acesso apenas via VPN corporativa
- MFA obrigatorio
- Timeout de sessao: 8 horas
- Split tunneling desabilitado

### 11.2 Acesso de Terceiros

- VPN dedicada ou acesso temporal
- Monitoramento em tempo real
- Gravacao de sessao (sistemas criticos)
- Revogacao automatica apos periodo

---

## 12. Registro e Auditoria

### 12.1 Eventos Registrados

- Login/logout
- Falhas de autenticacao
- Mudancas de privilegios
- Acesso a dados sensiveis
- Acoes administrativas

### 12.2 Retencao de Logs

| Tipo de Log | Retencao |
|-------------|----------|
| Autenticacao | 1 ano |
| Acesso a dados | 2 anos |
| Acoes administrativas | 5 anos |

---

## 13. Nao Conformidade

| Violacao | Consequencia |
|----------|-------------|
| Compartilhamento de senha | Advertencia + reset |
| Acesso nao autorizado | Investigacao + medidas |
| Uso indevido de privilegios | Revogacao + medidas disciplinares |

---

## 14. Aprovacao

| Funcao | Nome | Data |
|--------|------|------|
| DPO | [Nome] | Janeiro 2026 |
| Gerente de TI | [Nome] | Janeiro 2026 |

---

*Auricapri - Todos os direitos reservados*
