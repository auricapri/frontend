-- =============================================
-- Tabela de Feedback de Funcionalidades
-- =============================================
-- Armazena avaliações dos usuários sobre funcionalidades
-- como o Provador Virtual e experiência pós-compra

-- Criar enum para tipo de feedback
CREATE TYPE feedback_type AS ENUM ('virtual_try_on', 'post_purchase');

-- Tabela principal de feedback
CREATE TABLE IF NOT EXISTS feature_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Usuário que deu o feedback
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Tipo de feedback (provador virtual ou pós-compra)
    feedback_type feedback_type NOT NULL,

    -- Avaliação de 1 a 5 (1=péssimo, 5=excelente)
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

    -- Justificativa/comentário do usuário
    comment TEXT,

    -- Metadados opcionais (ex: order_id para pós-compra, variant_id para provador)
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: usuário só pode dar 1 feedback por tipo
    CONSTRAINT unique_user_feedback_type UNIQUE (user_id, feedback_type)
);

-- Índices para consultas
CREATE INDEX idx_feature_feedback_user_id ON feature_feedback(user_id);
CREATE INDEX idx_feature_feedback_type ON feature_feedback(feedback_type);
CREATE INDEX idx_feature_feedback_rating ON feature_feedback(rating);
CREATE INDEX idx_feature_feedback_created_at ON feature_feedback(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE feature_feedback ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios feedbacks
CREATE POLICY feature_feedback_select_own ON feature_feedback
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Usuários podem inserir seus próprios feedbacks
CREATE POLICY feature_feedback_insert_own ON feature_feedback
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios feedbacks
CREATE POLICY feature_feedback_update_own ON feature_feedback
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Admins podem ver todos os feedbacks
CREATE POLICY feature_feedback_admin_all ON feature_feedback
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- View para estatísticas de feedback (agregado, sem dados pessoais)
CREATE OR REPLACE VIEW feedback_statistics AS
SELECT
    feedback_type,
    COUNT(*) as total_feedbacks,
    ROUND(AVG(rating)::numeric, 2) as average_rating,
    COUNT(*) FILTER (WHERE rating = 5) as excellent_count,
    COUNT(*) FILTER (WHERE rating = 4) as good_count,
    COUNT(*) FILTER (WHERE rating = 3) as neutral_count,
    COUNT(*) FILTER (WHERE rating = 2) as bad_count,
    COUNT(*) FILTER (WHERE rating = 1) as terrible_count,
    DATE_TRUNC('day', created_at) as feedback_date
FROM feature_feedback
GROUP BY feedback_type, DATE_TRUNC('day', created_at)
ORDER BY feedback_date DESC;

-- Comentário na tabela
COMMENT ON TABLE feature_feedback IS 'Armazena avaliações dos usuários sobre funcionalidades do sistema';
COMMENT ON COLUMN feature_feedback.rating IS 'Avaliação de 1 (péssimo) a 5 (excelente)';
COMMENT ON COLUMN feature_feedback.feedback_type IS 'Tipo: virtual_try_on (provador) ou post_purchase (pós-compra)';
