# Configuração de Servidores Redis Duplos

## Visão Geral

O projeto Auricapri utiliza dois servidores Redis na instância do Brasil, cada um com capacidade de 30MB, para garantir alta disponibilidade e distribuição de carga.

## Arquitetura

### Servidores Redis

- **Primary Server** (`REDIS_URL_SERVER_PRIMARY`): Servidor principal usado para operações críticas
- **Secondary Server** (`REDIS_URL_SERVER_SECONDARY`): Servidor secundário usado como fallback e para distribuição de carga

### Capacidade

- Cada servidor: **30MB**
- Total disponível: **60MB** (distribuído entre os dois servidores)

## Configuração de Variáveis de Ambiente

### Produção (Brasil)

```bash
# Servidor Redis Primary (30MB)
REDIS_URL_SERVER_PRIMARY=redis://usuario:senha@host-primary:porta/0

# Servidor Redis Secondary (30MB)
REDIS_URL_SERVER_SECONDARY=redis://usuario:senha@host-secondary:porta/0
```

### Desenvolvimento Local

Para desenvolvimento local, você pode usar apenas o primary ou ambos:

```bash
# Opção 1: Apenas Primary (compatível com código antigo)
REDIS_URL_SERVER_PRIMARY=redis://localhost:6379/0

# Opção 2: Ambos os servidores
REDIS_URL_SERVER_PRIMARY=redis://localhost:6379/0
REDIS_URL_SERVER_SECONDARY=redis://localhost:6380/0
```

### Compatibilidade com Configuração Antiga

O código mantém compatibilidade com a variável antiga `REDIS_URL`:

```bash
# Se apenas REDIS_URL estiver definida, ela será usada como primary
REDIS_URL=redis://localhost:6379/0
```

**Nota**: Se `REDIS_URL_SERVER_PRIMARY` estiver definida, ela tem prioridade sobre `REDIS_URL`.

## Estratégia de Uso

### Primary Server

Usado para:
- **Operações de escrita** (write-heavy)
- **Cache de carrinho** (CartCacheService)
- **Fila de tracking events** (TrackingQueueService)
- **Operações críticas** que requerem baixa latência

### Secondary Server

Usado para:
- **Fallback automático** quando primary falha
- **Operações de leitura** (read-heavy) quando configurado
- **Distribuição de carga** para reduzir pressão no primary

## Política Atual no Código (Memória 30MB x 2)

Para suportar picos (ex.: ~1000 usuários simultâneos) sem estourar os 30MB por instância, o código aplica:

### 1. Distribuição de Cache HTTP

- Entradas de cache de endpoints `GET` são distribuídas entre primary e secondary por hashing consistente da chave.
- Isso permite utilizar ~60MB totais, reduzindo pressão de memória no primary.

### 2. Itens que Ficam Fixos no Primary

- `cart:*` (carrinhos) permanece prioritariamente no primary para consistência (com fallback para secondary em falha).
- Locks de scheduler e operações críticas permanecem no primary.

### 3. Guardrails de Memória (Size Guard)

Para evitar armazenar payloads grandes:

- Cache HTTP (`cacheJson`): até ~120KB em JSON puro; acima disso, tenta compactar (gzip) e só cacheia se ficar <= ~220KB.
- Carrinho: máximo ~20KB por entrada (acima disso, grava apenas no banco).
- Geocoding/directions: máximo ~40KB por entrada.

### 4. Fila de Tracking com Teto

- A fila `tracking:events:v1` é truncada automaticamente para manter no máximo ~20.000 eventos.
- Isso evita crescimento ilimitado caso o worker fique lento ou indisponível.

### 5. TTL Ajustado para Carrinho

- TTL do carrinho em Redis foi ajustado para **4 horas**, para reduzir acúmulo de sessões antigas e favorecer usuários realmente ativos.

### Fallback Automático

O sistema implementa fallback automático:
1. Tenta operação no **Primary**
2. Se falhar, tenta automaticamente no **Secondary**
3. Se ambos falharem, usa **fallback para banco de dados** (quando aplicável)

## Casos de Uso por Serviço

### 1. CartCacheService (Carrinho)

- **Servidor**: Primary
- **Fallback**: Secondary → Database
- **TTL**: 24 horas (86400 segundos)
- **Chaves**: `cart:{sessionKey}`

### 2. TrackingQueueService (Eventos de Tracking)

- **Servidor**: Primary
- **Fallback**: Secondary → Database direto
- **Chaves**: `tracking:events:v1`
- **Batch Size**: 200 eventos
- **Interval**: 2 segundos

### 3. GeocodingService (Geocodificação)

- **Servidor**: Primary
- **Fallback**: Secondary → API externa
- **TTL**: 24 horas
- **Chaves**: `geocoding:{location}`

### 4. WeatherService (Clima)

- **Servidor**: Primary
- **Fallback**: Secondary → API externa
- **TTL**: 1 hora
- **Chaves**: `weather:{location}`

### 5. Cache Middleware (Produtos, Collections, etc.)

- **Servidor**: Primary
- **Fallback**: Secondary → Database
- **TTL**: Variável por endpoint

## Monitoramento

### Métricas Disponíveis

O sistema expõe métricas Prometheus para monitoramento:

- `redis_connection_status`: Status da conexão (0 = desconectado, 1 = conectado)
- `redis_operations_total`: Total de operações Redis
- `redis_errors_total`: Total de erros Redis
- `redis_fallback_total`: Total de fallbacks para secondary

### Logs

Os logs incluem informações sobre:
- Conexão/desconexão dos servidores
- Fallbacks para secondary
- Erros de conexão
- Operações de cache hit/miss

## Troubleshooting

### Problema: "Redis client error"

**Causa**: Servidor Redis indisponível ou credenciais incorretas

**Solução**:
1. Verificar se as URLs estão corretas
2. Verificar conectividade de rede
3. Verificar credenciais
4. O sistema tentará automaticamente o secondary

### Problema: "Failed to create Redis client"

**Causa**: Nenhum servidor Redis disponível

**Solução**:
1. Verificar variáveis de ambiente
2. O sistema usará fallback para banco de dados
3. Verificar logs para mais detalhes

### Problema: Alto uso de memória

**Causa**: Cache não está expirando corretamente ou dados muito grandes

**Solução**:
1. Verificar TTLs configurados
2. Monitorar uso de memória via métricas
3. Considerar aumentar capacidade ou otimizar dados em cache

## Boas Práticas

### 1. Distribuição de Chaves

Evite concentrar todas as chaves em um único servidor. Use hash consistente para distribuir:

```typescript
const server = hash(key) % 2 === 0 ? primary : secondary;
```

### 2. TTLs Apropriados

Configure TTLs baseados no tipo de dado:
- **Carrinho**: 24 horas (dados temporários)
- **Produtos**: 5-15 minutos (dados que mudam ocasionalmente)
- **Geocoding**: 24 horas (dados estáticos)
- **Weather**: 1 hora (dados que mudam frequentemente)

### 3. Monitoramento de Capacidade

Monitore o uso de memória de ambos os servidores:
- Configure alertas em 80% de uso
- Revise TTLs se uso estiver alto
- Considere aumentar capacidade se necessário

### 4. Backup e Recuperação

- Configure backups regulares dos dados críticos
- Teste procedimentos de recuperação
- Documente procedimentos de failover

## Migração da Configuração Antiga

Se você está migrando de `REDIS_URL` para a nova configuração:

1. **Defina as novas variáveis**:
   ```bash
   REDIS_URL_SERVER_PRIMARY=redis://...
   REDIS_URL_SERVER_SECONDARY=redis://...
   ```

2. **Mantenha REDIS_URL temporariamente** (para compatibilidade):
   ```bash
   REDIS_URL=redis://...  # Será ignorado se PRIMARY estiver definida
   ```

3. **Teste a configuração**:
   - Verifique logs de conexão
   - Teste operações de cache
   - Verifique fallback automático

4. **Remova REDIS_URL** após confirmar que tudo funciona

## Referências

- [Documentação ioredis](https://github.com/redis/ioredis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Redis Memory Optimization](https://redis.io/docs/manual/optimization/memory-optimization/)
