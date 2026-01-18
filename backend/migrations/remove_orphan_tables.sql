-- ============================================
-- Migration: Remover tabelas órfãs
-- Data: 16 de Janeiro de 2026
-- Descrição: Remove tabelas que não são usadas pelo código
-- ============================================

-- Tabelas identificadas como órfãs (sem referência no código):
-- 1. inventory_reservations - Controle de reservas de estoque (não implementado)
-- 2. product_price_history - Histórico de preços (não implementado)
-- 3. stock_movements - Log de movimentações de estoque (não implementado)
-- 4. tags - Tags genéricas (redundante com user_tags)

-- IMPORTANTE: Executar com cuidado em produção
-- Fazer backup antes se necessário

DROP TABLE IF EXISTS inventory_reservations CASCADE;
DROP TABLE IF EXISTS product_price_history CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS tags CASCADE;

-- Verificar resultado
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
