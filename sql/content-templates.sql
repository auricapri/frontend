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

-- =============================================
-- 5. POLITICA DE PRIVACIDADE (LGPD - OBRIGATORIO)
-- IMPORTANTE: Revise e personalize antes de executar!
-- Substitua [NOME_FANTASIA], [RAZAO_SOCIAL], [CNPJ], [ENDERECO], [EMAIL_DPO]
-- =============================================
/*
UPDATE store_config SET privacy_policy = '{
  "pt": "POLÍTICA DE PRIVACIDADE — AURICAPRI\n\nÚltima atualização: [DATA]\n\nA [RAZAO_SOCIAL] (\"Auricapri\"), inscrita no CNPJ [CNPJ], com sede em [ENDERECO], é a controladora dos dados pessoais coletados neste site, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).\n\n1. DADOS COLETADOS\nColetamos os seguintes dados pessoais:\n• Dados de cadastro: nome completo, e-mail, senha (criptografada), telefone\n• Dados de compra: CPF (para nota fiscal), endereço de entrega, dados de pagamento (processados pela Asaas — não armazenamos dados de cartão)\n• Dados de navegação: cookies, endereço IP, páginas visitadas (apenas com consentimento)\n• Dados de comunicação: mensagens no chat, interações com suporte\n\n2. FINALIDADE DO TRATAMENTO\nSeus dados são utilizados para:\n• Processar pedidos e entregas\n• Emitir nota fiscal eletrônica (NF-e)\n• Comunicar sobre status de pedidos\n• Personalizar sua experiência de compra\n• Prevenir fraudes e garantir segurança\n• Cumprir obrigações legais e regulatórias\n\n3. BASE LEGAL (Art. 7º, LGPD)\n• Execução de contrato: processamento de pedidos, entrega, pagamento\n• Obrigação legal: emissão de NF-e, guarda de registros (Marco Civil da Internet)\n• Consentimento: cookies analíticos, marketing, newsletter\n• Legítimo interesse: prevenção a fraudes, melhoria do serviço\n\n4. COMPARTILHAMENTO DE DADOS\nCompartilhamos seus dados apenas com:\n• Asaas (processamento de pagamentos — PCI DSS compliant)\n• Transportadoras (endereço de entrega para envio)\n• Correios / Melhor Envio (logística)\n• Supabase (infraestrutura de banco de dados — dados criptografados)\n• Google Analytics (dados anonimizados, apenas com consentimento)\nNão vendemos, alugamos ou comercializamos seus dados pessoais.\n\n5. SEUS DIREITOS (Art. 18, LGPD)\nVocê tem direito a:\n• Confirmar a existência de tratamento dos seus dados\n• Acessar seus dados pessoais\n• Corrigir dados incompletos ou desatualizados\n• Solicitar anonimização, bloqueio ou eliminação de dados desnecessários\n• Solicitar portabilidade dos dados\n• Revogar consentimento a qualquer momento\n• Solicitar exclusão da conta e de todos os dados pessoais\nPara exercer seus direitos, entre em contato: [EMAIL_DPO]\n\n6. RETENÇÃO DE DADOS\n• Dados de compra: 5 anos (obrigação fiscal)\n• Registros de acesso: 6 meses (Marco Civil da Internet, Art. 15)\n• Dados de marketing: até revogação do consentimento\n• Dados de conta excluída: removidos em até 30 dias (exceto obrigações legais)\n\n7. COOKIES\nUtilizamos cookies essenciais para o funcionamento do site. Cookies analíticos e de marketing são ativados apenas com seu consentimento expresso, por meio do banner de cookies.\n\n8. SEGURANÇA\n• Criptografia SSL 256 bits em todo o site\n• Senhas armazenadas com hash seguro (bcrypt)\n• Pagamentos processados pela Asaas (certificada PCI DSS)\n• Acesso restrito a dados pessoais\n\n9. INCIDENTES DE SEGURANÇA\nEm caso de incidente que possa causar risco aos titulares, comunicaremos a ANPD e os afetados em até 2 dias úteis (Art. 48, LGPD).\n\n10. ENCARREGADO (DPO)\nPara dúvidas sobre privacidade e proteção de dados:\nE-mail: [EMAIL_DPO]\n\n11. ALTERAÇÕES\nEsta política pode ser atualizada periodicamente. A versão vigente estará sempre disponível nesta página.\n\n12. LEGISLAÇÃO APLICÁVEL\nEsta política é regida pela legislação brasileira, em especial a LGPD (Lei 13.709/2018), o Código de Defesa do Consumidor (Lei 8.078/1990) e o Marco Civil da Internet (Lei 12.965/2014).",
  "en": "PRIVACY POLICY — AURICAPRI\n\nLast updated: [DATE]\n\nAuricapri is the data controller for personal data collected on this site, in accordance with Brazil''s General Data Protection Law (LGPD - Law 13.709/2018).\n\nFor the full policy, please refer to the Portuguese version, which is the legally binding version."
}' WHERE id = 1;
*/

-- =============================================
-- 6. TERMOS DE USO (CDC + Decreto 7.962 - OBRIGATORIO)
-- IMPORTANTE: Revise e personalize antes de executar!
-- =============================================
/*
UPDATE store_config SET terms_of_service = '{
  "pt": "TERMOS E CONDIÇÕES DE USO — AURICAPRI\n\nÚltima atualização: [DATA]\n\n1. IDENTIFICAÇÃO DO FORNECEDOR\nRazão Social: [RAZAO_SOCIAL]\nCNPJ: [CNPJ]\nEndereço: [ENDERECO]\nE-mail: [EMAIL_CONTATO]\nTelefone: [TELEFONE]\n\n2. OBJETO\nEstes termos regulam o uso do site auricapri.com.br e as compras realizadas através dele.\n\n3. CADASTRO\nO cadastro é gratuito e requer informações verdadeiras. O usuário é responsável pela confidencialidade de suas credenciais.\n\n4. PRODUTOS\n• As descrições, composições e medidas dos produtos são informadas na página de cada item\n• As cores podem apresentar pequenas variações conforme a configuração do monitor\n• Fotos representam fielmente os produtos, podendo haver variação natural entre peças\n• Disponibilidade sujeita ao estoque\n\n5. PREÇOS E PAGAMENTO\n• Preços em Reais (R$), com todos os impostos inclusos\n• Formas de pagamento: cartão de crédito (até 6x sem juros), PIX (5% desconto) e boleto\n• O pedido só é confirmado após aprovação do pagamento\n• Parcelamento: valor total e custo efetivo total (CET) informados antes da confirmação\n\n6. ENTREGA\n• Prazo estimado de 3 a 10 dias úteis, conforme região\n• Frete grátis para pedidos acima de R$ 299,00\n• Código de rastreamento fornecido após despacho\n• O prazo começa a contar após confirmação do pagamento\n\n7. DIREITO DE ARREPENDIMENTO (Art. 49, CDC)\nVocê pode desistir da compra em até 7 (sete) dias corridos após o recebimento do produto, sem necessidade de justificativa.\n• O frete de devolução é por conta da Auricapri\n• O reembolso integral será processado em até 7 dias úteis\n• Para exercer, entre em contato pelo WhatsApp, e-mail ou chat\n\n8. TROCAS\n• Prazo de 30 dias para solicitar troca\n• O produto deve estar sem uso, com etiquetas originais\n• A troca é gratuita (frete por conta da Auricapri)\n• Solicite pelo WhatsApp ou e-mail\n\n9. GARANTIA LEGAL (Art. 26, CDC)\n• Produtos com vício aparente: 90 dias para reclamação\n• Produtos com vício oculto: prazo conta da descoberta do defeito\n• Em caso de defeito, a Auricapri tem 30 dias para sanar. Caso contrário, você pode optar por substituição, restituição ou abatimento\n\n10. CANCELAMENTO\n• Pedidos podem ser cancelados antes do despacho\n• Após o despacho, aplica-se o direito de arrependimento (item 7)\n\n11. PROPRIEDADE INTELECTUAL\nTodo o conteúdo do site (textos, imagens, logos, design) é propriedade da Auricapri e protegido por lei. Reprodução não autorizada é proibida.\n\n12. RESPONSABILIDADE\nA Auricapri não se responsabiliza por:\n• Danos causados por uso indevido dos produtos\n• Atrasos de entrega causados por terceiros ou eventos de força maior\n• Indisponibilidade temporária do site\n\n13. PRIVACIDADE\nO tratamento de dados pessoais é regido pela nossa Política de Privacidade, parte integrante destes termos.\n\n14. ALTERAÇÕES\nEstes termos podem ser atualizados. A versão vigente estará sempre disponível no site.\n\n15. FORO\nFica eleito o foro da comarca de [CIDADE/UF] para dirimir questões relativas a estes termos, sem prejuízo do direito do consumidor de escolher o foro de seu domicílio (Art. 101, I, CDC).",
  "en": "TERMS AND CONDITIONS — AURICAPRI\n\nLast updated: [DATE]\n\nFor the full terms, please refer to the Portuguese version, which is the legally binding version."
}' WHERE id = 1;
*/
