import { ArrowLeft } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import type { Locale } from '../i18n';

interface ShippingReturnsPageProps {
  locale: Locale;
  onBack: () => void;
  onNavigateReturns?: () => void;
}

export function ShippingReturnsPage({ locale, onBack, onNavigateReturns }: ShippingReturnsPageProps) {
  return (
    <div className="min-h-screen bg-paper">
      <SEOHead
        title="Envios e Devoluções | Auricapri"
        description="Saiba tudo sobre envios, trocas e devoluções na Auricapri. Frete gratis acima de R$ 299, trocas gratuitas em ate 30 dias e politica de devolucao transparente."
        keywords="envios, devoluções, trocas, frete, politica de envio, auricapri"
        url="https://www.auricapri.com.br/shipping-returns"
      />
      <header className="sticky top-0 z-10 bg-paper border-b border-neutral-100">
        <div className="w-full px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-xl font-bold">
            {locale === 'pt' ? 'Envios & Devoluções' :
             locale === 'es' ? 'Envíos & Devoluciones' :
             locale === 'fr' ? 'Livraisons & Retours' :
             'Shipping & Returns'}
          </h1>
        </div>
      </header>

      <main className="w-full px-4 py-8 max-w-3xl mx-auto">

        {/* ENVIOS */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-900 mb-6">
            Envios
          </h2>
          <ul className="space-y-3 text-sm text-neutral-700 leading-relaxed">
            <li>Entrega para todo o Brasil.</li>
            <li>Frete grátis em compras acima de R$ 299.</li>
            <li>Prazo de entrega: 3 a 10 dias úteis, dependendo da região.</li>
            <li>Após o envio, você receberá um e-mail com o código de rastreamento.</li>
            <li>Acompanhe seu pedido pelo painel da sua conta.</li>
          </ul>
        </section>

        {/* TROCAS */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-900 mb-6">
            Trocas
          </h2>
          <ul className="space-y-3 text-sm text-neutral-700 leading-relaxed">
            <li>Você tem até 30 dias após o recebimento para solicitar troca.</li>
            <li>O produto deve estar em perfeitas condições, com etiquetas originais.</li>
            <li>A troca é gratuita — nós enviamos a etiqueta de devolução.</li>
            <li>Para solicitar, entre em contato pelo WhatsApp ou e-mail.</li>
            <li>Após recebermos o produto, a nova peça é enviada em até 3 dias úteis.</li>
          </ul>
        </section>

        {/* DEVOLUÇÕES */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-900 mb-6">
            Devoluções
          </h2>
          <ul className="space-y-3 text-sm text-neutral-700 leading-relaxed">
            <li>Direito de arrependimento: 7 dias corridos após o recebimento (Art. 49, CDC).</li>
            <li>Produto deve estar sem uso, com etiquetas e embalagem original.</li>
            <li>Frete reverso por nossa conta.</li>
            <li>
              Reembolso pelo mesmo método de pagamento:
              <ul className="mt-2 ml-4 space-y-1 text-neutral-500">
                <li>PIX: até 2 horas úteis</li>
                <li>Cartão de crédito: até 7 dias úteis (depende da operadora)</li>
                <li>Boleto: até 5 dias úteis</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* COMO SOLICITAR */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-900 mb-6">
            Como Solicitar
          </h2>
          <ol className="space-y-3 text-sm text-neutral-700 leading-relaxed list-decimal list-inside">
            <li>Acesse o formulario de devolucao online ou entre em contato pelo WhatsApp/e-mail.</li>
            <li>Informe o numero do pedido e o motivo.</li>
            <li>Enviaremos as instrucoes e a etiqueta de devolucao.</li>
            <li>Despache o produto no ponto de coleta mais proximo.</li>
            <li>Assim que recebermos, processamos a troca ou reembolso.</li>
          </ol>

          {onNavigateReturns && (
            <button
              onClick={onNavigateReturns}
              className="mt-6 px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors"
            >
              Solicitar Devolucao Online
            </button>
          )}
        </section>

      </main>
    </div>
  );
}
