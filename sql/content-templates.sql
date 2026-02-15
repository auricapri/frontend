-- =============================================
-- Auricapri Content Templates
-- Execute these queries in Supabase SQL Editor
-- =============================================

-- 1. Create FAQ table
CREATE TABLE IF NOT EXISTS faq (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question JSONB NOT NULL DEFAULT '{}',
  answer JSONB NOT NULL DEFAULT '{}',
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can read active FAQs)
CREATE POLICY "faq_public_read" ON faq
  FOR SELECT USING (is_active = true);

-- Admin full access (adjust role as needed)
CREATE POLICY "faq_admin_all" ON faq
  FOR ALL USING (auth.role() = 'authenticated');

-- 2. Insert initial FAQ entries
-- IMPORTANT: Review and customize the answers before running!

INSERT INTO faq (question, answer, category, sort_order) VALUES
(
  '{"pt": "Qual o prazo de entrega?", "en": "What is the delivery time?", "es": "¿Cuál es el plazo de entrega?", "fr": "Quel est le délai de livraison?"}',
  '{"pt": "O prazo de entrega varia de 3 a 10 dias úteis, dependendo da sua região. Enviamos para todo o Brasil.", "en": "Delivery takes 3-10 business days depending on your region. We ship nationwide.", "es": "El plazo de entrega varía de 3 a 10 días hábiles. Enviamos a todo Brasil.", "fr": "La livraison prend 3 à 10 jours ouvrables selon votre région."}',
  'shipping', 1
),
(
  '{"pt": "Como funciona a troca e devolução?", "en": "How do returns and exchanges work?", "es": "¿Cómo funcionan los cambios y devoluciones?", "fr": "Comment fonctionnent les retours et échanges?"}',
  '{"pt": "Você tem até 30 dias para solicitar troca ou devolução gratuita. O produto deve estar em perfeitas condições, com etiquetas. Entre em contato pelo nosso WhatsApp.", "en": "You have 30 days for free returns and exchanges. Items must be in perfect condition with tags. Contact us via WhatsApp.", "es": "Tienes 30 días para cambios y devoluciones gratuitas. El producto debe estar en perfectas condiciones.", "fr": "Vous avez 30 jours pour les retours et échanges gratuits. Les articles doivent être en parfait état."}',
  'returns', 2
),
(
  '{"pt": "Quais as formas de pagamento?", "en": "What payment methods do you accept?", "es": "¿Cuáles son las formas de pago?", "fr": "Quels modes de paiement acceptez-vous?"}',
  '{"pt": "Aceitamos cartão de crédito (até 6x sem juros), PIX e boleto bancário. Pagamentos via PIX têm aprovação instantânea.", "en": "We accept credit cards (up to 6x interest-free), PIX, and bank slip. PIX payments are instant.", "es": "Aceptamos tarjeta de crédito (hasta 6x sin intereses), PIX y boleto.", "fr": "Nous acceptons les cartes de crédit (jusqu''à 6x sans intérêts), PIX et boleto."}',
  'payment', 3
),
(
  '{"pt": "Como rastrear meu pedido?", "en": "How do I track my order?", "es": "¿Cómo rastrear mi pedido?", "fr": "Comment suivre ma commande?"}',
  '{"pt": "Após o envio, você receberá um e-mail com o código de rastreamento. Também pode acompanhar pelo painel da sua conta.", "en": "After shipping, you will receive an email with the tracking code. You can also track from your account.", "es": "Después del envío, recibirás un email con el código de rastreo.", "fr": "Après l''expédition, vous recevrez un email avec le code de suivi."}',
  'shipping', 4
),
(
  '{"pt": "Qual a qualidade dos materiais?", "en": "What is the material quality?", "es": "¿Cuál es la calidad de los materiales?", "fr": "Quelle est la qualité des matériaux?"}',
  '{"pt": "Trabalhamos com tecidos premium importados e nacionais. Cada peça passa por controle de qualidade rigoroso antes do envio.", "en": "We use premium imported and national fabrics. Each piece undergoes strict quality control.", "es": "Trabajamos con telas premium importadas y nacionales. Control de calidad riguroso.", "fr": "Nous utilisons des tissus premium importés et nationaux. Contrôle qualité strict."}',
  'quality', 5
),
(
  '{"pt": "Vocês têm loja física?", "en": "Do you have a physical store?", "es": "¿Tienen tienda física?", "fr": "Avez-vous un magasin physique?"}',
  '{"pt": "Atualmente somos uma marca exclusivamente online, o que nos permite oferecer preços mais acessíveis com a mesma qualidade premium.", "en": "We are currently an online-only brand, which allows us to offer better prices with the same premium quality.", "es": "Actualmente somos una marca exclusivamente online.", "fr": "Nous sommes actuellement une marque exclusivement en ligne."}',
  'general', 6
);

-- 3. About Us template (update store_config)
-- TODO: Customize with real brand story before running
/*
UPDATE store_config SET about_us = '{
  "pt": "A Auricapri nasceu da paixão por moda feminina de qualidade. Nossa missão é oferecer peças elegantes e acessíveis que valorizam a mulher moderna. Cada coleção é cuidadosamente curada para trazer as últimas tendências com o conforto e qualidade que você merece.",
  "en": "Auricapri was born from a passion for quality women''s fashion. Our mission is to offer elegant and accessible pieces that empower modern women.",
  "es": "Auricapri nació de la pasión por la moda femenina de calidad.",
  "fr": "Auricapri est née d''une passion pour la mode féminine de qualité."
}' WHERE id = 1;
*/

-- 4. Hero banner template
-- TODO: Update with real banner images and links
/*
INSERT INTO banners (title, subtitle, image_url, link, sort_order, is_active) VALUES
(
  '{"pt": "Nova Coleção Verão 2026", "en": "New Summer 2026 Collection"}',
  '{"pt": "Descubra as peças que vão transformar seu guarda-roupa", "en": "Discover pieces that will transform your wardrobe"}',
  '/images/banners/hero-summer-2026.jpg',
  '/new-arrivals',
  1,
  true
);
*/
