import { ArrowLeft, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import type { Locale } from '../i18n';

interface AffiliatePageProps {
  locale: Locale;
  onBack: () => void;
}

export function AffiliatePage({ onBack }: AffiliatePageProps) {
  return (
    <div className="min-h-screen bg-paper">
      <SEOHead
        title="Programa de Afiliados | Auricapri"
        description="Ganhe comissão divulgando a Auricapri. Estrutura de comissões progressiva, a partir de 10% sobre cada venda confirmada. Parceria transparente e legal."
        keywords="afiliados, programa de afiliados, comissão, influencer, parceria, auricapri"
        url="https://www.auricapri.com.br/affiliates"
      />

      <header className="sticky top-0 z-10 bg-paper border-b border-neutral-100">
        <div className="w-full px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-xl font-bold">Programa de Afiliados</h1>
        </div>
      </header>

      <main className="w-full px-4 py-8 max-w-3xl mx-auto">

        {/* Intro */}
        <section className="mb-12">
          <p className="text-sm text-neutral-700 leading-relaxed">
            Divulgue a Auricapri no seu perfil e ganhe comissão sobre cada venda que você gerar.
            Você recebe um link de rastreamento exclusivo e um cupom personalizado que dá 5% de
            desconto aos seus seguidores — sem custo para você.
          </p>
        </section>

        {/* Tabela de comissões */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-900 mb-6">
            Comissões
          </h2>

          <div className="space-y-3">
            {/* Tier base */}
            <div className="border border-neutral-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">Afiliado</p>
                <p className="text-sm text-neutral-700">Qualquer volume de vendas</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-neutral-900">10%</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">por venda</p>
              </div>
            </div>

            {/* Tier Plus */}
            <div className="border border-neutral-900 rounded-2xl p-5 flex items-center justify-between bg-neutral-50">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">Afiliado Plus</p>
                <p className="text-sm text-neutral-700">A partir de R$ 1.500 em vendas/mês</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-neutral-900">12%</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">por venda</p>
              </div>
            </div>

            {/* Tier Premium */}
            <div className="border border-neutral-900 rounded-2xl p-5 flex items-center justify-between bg-neutral-900 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Afiliado Premium</p>
                <p className="text-sm text-neutral-300">A partir de R$ 4.000 em vendas/mês</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">15%</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">por venda</p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-neutral-400 leading-relaxed">
            Comissão calculada sobre o valor líquido do produto (excluindo frete e descontos promocionais).
            O tier é atualizado mensalmente com base nas vendas confirmadas do mês anterior.
          </p>
        </section>

        {/* Como funciona */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-900 mb-6">
            Como Funciona
          </h2>
          <ol className="space-y-4">
            {[
              { step: '01', text: 'Você se cadastra enviando e-mail para parceria@auricapri.com.br com seus dados e perfil.' },
              { step: '02', text: 'Após aprovação, recebe um link de rastreamento e um cupom exclusivo com 5% de desconto para seus seguidores.' },
              { step: '03', text: 'Divulga os produtos nos seus canais, identificando sempre como publicidade paga (#publi).' },
              { step: '04', text: 'Toda venda confirmada gera comissão — paga mensalmente após emissão de nota fiscal.' },
            ].map(({ step, text }) => (
              <li key={step} className="flex gap-4">
                <span className="text-[10px] font-black text-neutral-300 tracking-widest w-6 flex-none pt-0.5">{step}</span>
                <p className="text-sm text-neutral-700 leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Requisitos */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-900 mb-6">
            Requisitos
          </h2>
          <ul className="space-y-3">
            {[
              'CNPJ ativo (MEI, ME ou superior) — obrigatório para emissão de nota fiscal de serviços',
              '18 anos ou mais',
              'Perfil ativo em ao menos uma plataforma digital (Instagram, TikTok, YouTube, Pinterest ou blog)',
              'Não ser colaborador ou familiar de primeiro grau de colaborador da Auricapri',
            ].map((req, i) => (
              <li key={i} className="flex gap-3 items-start">
                <CheckCircle className="w-4 h-4 text-neutral-400 flex-none mt-0.5" />
                <p className="text-sm text-neutral-700 leading-relaxed">{req}</p>
              </li>
            ))}
          </ul>

          <div className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              <strong className="text-neutral-700">Por que o CNPJ é obrigatório?</strong>{' '}
              O cadastro como pessoa jurídica simplifica as obrigações fiscais para ambos os lados.
              A Auricapri paga o valor bruto da comissão e não retém imposto na fonte para PJ,
              conforme a legislação vigente. O CNAE recomendado é o 7319-0/02 (Promoção de vendas).
              MEI já é suficiente para participar.
            </p>
          </div>
        </section>

        {/* Obrigações de transparência */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-900 mb-6">
            Divulgação Obrigatória
          </h2>

          <div className="flex gap-3 items-start p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-none mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Toda publicação que envolva comissão, produto gratuito ou qualquer vantagem da
              Auricapri <strong>deve ser identificada como publicidade</strong> de forma clara e imediata,
              conforme o Código de Defesa do Consumidor (art. 36) e as diretrizes do CONAR.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 pr-4 font-bold uppercase tracking-wider text-neutral-500">Plataforma</th>
                  <th className="text-left py-2 font-bold uppercase tracking-wider text-neutral-500">Marcação obrigatória</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {[
                  { platform: 'Instagram (Feed / Reels)', label: '#publi visível sem expandir + marcar @auricapri' },
                  { platform: 'Instagram Stories', label: 'Tag "Parceria paga com" ativada no app OU #publi no início' },
                  { platform: 'TikTok', label: '#publi no início da legenda + funcionalidade "Branded Content"' },
                  { platform: 'YouTube', label: 'Aviso verbal no início ("em parceria com a Auricapri") + painel de monetização' },
                  { platform: 'Blog / Pinterest', label: 'Aviso em destaque no início do conteúdo' },
                ].map(({ platform, label }) => (
                  <tr key={platform}>
                    <td className="py-3 pr-4 text-neutral-600 font-medium">{platform}</td>
                    <td className="py-3 text-neutral-500">{label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-[11px] text-neutral-400 leading-relaxed">
            O não cumprimento das obrigações de disclosure pode resultar em penalidades do CONAR
            e, nos termos do PL 2749/2025, em responsabilidade solidária com multa de até R$ 500.000.
            O afiliado é pessoalmente responsável por todas as publicações em seus canais.
          </p>
        </section>

        {/* Pagamento */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-900 mb-6">
            Pagamento
          </h2>
          <ul className="space-y-3 text-sm text-neutral-700 leading-relaxed">
            <li>Pagamentos mensais, até o dia 15 do mês seguinte ao fechamento das vendas confirmadas.</li>
            <li>Mínimo de R$ 50 por ciclo — valores inferiores acumulam para o mês seguinte.</li>
            <li>Processo: relatório até dia 5 → você emite nota fiscal → Auricapri paga via PIX/TED.</li>
            <li>Exclusivamente para conta titularizada pelo seu CNPJ (sem pagamentos a CPF, em espécie ou permutas).</li>
            <li>Janela de rastreamento de 30 dias corridos a partir do clique no seu link.</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-900 mb-6">
            Quero Participar
          </h2>
          <p className="text-sm text-neutral-700 leading-relaxed mb-6">
            Envie um e-mail para <strong>parceria@auricapri.com.br</strong> com seu nome, CNPJ,
            link do seu perfil principal e uma breve apresentação. Nossa equipe analisa e retorna
            em até 5 dias úteis.
          </p>
          <a
            href="mailto:parceria@auricapri.com.br?subject=Quero%20ser%20afiliado%20Auricapri"
            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors"
          >
            <Mail className="w-4 h-4" />
            parceria@auricapri.com.br
          </a>
          <p className="mt-3 text-[10px] text-neutral-400">
            Atendimento: segunda a sexta, das 9h às 18h (horário de Brasília)
          </p>
        </section>

        {/* Aviso legal */}
        <section className="mb-8 p-4 border border-neutral-100 rounded-xl">
          <p className="text-[10px] text-neutral-400 leading-relaxed">
            <strong className="text-neutral-500">Aviso legal:</strong> O programa de afiliados da Auricapri opera em
            conformidade com o CDC (Lei 8.078/1990), o Código de Ética do CONAR, o PL 2.749/2025
            (responsabilidade solidária em publicidade de influenciadores) e o ECA Digital
            (Lei 14.382/2022, em vigor a partir de 18/03/2026). Parceiros com público
            predominantemente infantojuvenil devem observar as restrições do ECA Digital.
            A participação no programa é voluntária e não gera vínculo empregatício entre as partes.
            Consulte a Política de Afiliados completa disponível em parceria@auricapri.com.br.
          </p>
        </section>

      </main>
    </div>
  );
}
