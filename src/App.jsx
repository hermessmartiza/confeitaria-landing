import { useEffect, useState } from 'react'
import { trackFunnel } from './SignupFlow'
import SignupPage from './SignupPage'
import './cadastro.css'
import {
  HERO,
  HERO_PROOFS,
  COMPARISON,
  FEATURES,
  FEATURES_INTRO,
  STEPS,
  PRICING_INCLUDES,
} from './heroContent'

const API = 'https://confeitaria.smartiza.com.br/api'
// Catálogo de planos (Fase 4/7) — precisa apontar pro backend do próprio
// ambiente onde a landing está rodando (isolado ou produção), não sempre pra
// produção real como o API acima (que é leitura pública de stats, feature
// anterior e sem relação com isso).
const SIGNUP_API = import.meta.env.VITE_API_URL || 'https://confeitaria.smartiza.com.br/api'

function useReveal() {
  useEffect(() => {
    const observed = new WeakSet()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )

    const observeReveals = () => {
      document.querySelectorAll('.reveal').forEach((el) => {
        if (observed.has(el)) return
        observed.add(el)
        io.observe(el)
      })
    }

    observeReveals()
    const mutations = new MutationObserver(observeReveals)
    mutations.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutations.disconnect()
      io.disconnect()
    }
  }, [])
}

function useConfiguredWhatsapp() {
  const [number, setNumber] = useState(null)
  useEffect(() => {
    fetch(`${API}/platform/whatsapp/public-number`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setNumber(data?.number || null))
      .catch(() => {})
  }, [])
  return number
}

function Header({ onSignup }) {
  return (
    <header>
      <div className="container header-inner">
        <a className="logo" href="/" aria-label="Confeitto — início">
          <img src="/brand/simbolo.svg" alt="Confeitto, sistema de gestão para confeitarias" width="30" height="30" className="logo-mark" fetchPriority="high" />
          <span className="logo-text">Conf<span className="logo-ei">ei</span>tto</span>
        </a>
        <nav className="header-nav" aria-label="Navegação principal">
          <a href="#comparativo">Por que mudar</a>
          <a href="#recursos">Recursos</a>
          <a href="#oferta">Preço</a>
        </nav>
        <button type="button" className="header-cta" onClick={onSignup}>
          Vender sem comissão
        </button>
      </div>
    </header>
  )
}

function Hero({ onSignup }) {
  return (
    <section className="hero">
      <div className="hero-glow hero-glow-one" aria-hidden="true" />
      <div className="hero-glow hero-glow-two" aria-hidden="true" />
      <div className="hero-particles" aria-hidden="true">
        <span>✦</span><span>○</span><span>+</span><span>✦</span><span>●</span>
      </div>
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="hero-badge"><span aria-hidden="true">↓</span> {HERO.badge}</div>
          <div className="hero-eyebrow">{HERO.eyebrow}</div>
          <h1>
            {HERO.headingBefore}
            <span className="grad">{HERO.headingGrad1}</span>
            {HERO.headingMiddle}
            <span className="grad">{HERO.headingGrad2}</span>
          </h1>
          <p>{HERO.paragraph}</p>
          <div className="hero-actions">
            <button type="button" className="btn btn-light" onClick={onSignup}>
              {HERO.ctaPrimaryLabel} <span aria-hidden="true">→</span>
            </button>
            <a className="btn btn-ghost" href={HERO.ctaSecondaryHref}>
              {HERO.ctaSecondaryLabel}
            </a>
          </div>
          <ul className="hero-proofs" aria-label="Vantagens principais">
            {HERO_PROOFS.map((proof) => <li key={proof}>{proof}</li>)}
          </ul>
        </div>

        <aside className="hero-money-card" aria-label="Exemplo de comissão em um pedido de cem reais">
          <div className="money-card-top">
            <span>Exemplo de pedido</span>
            <strong>R$ 100,00</strong>
          </div>
          <div className="money-divider" />
          <div className="money-zero-row">
            <div>
              <span>Comissão do Confeitto</span>
              <strong>R$ 0,00</strong>
            </div>
            <div className="zero-orbit"><span>0%</span></div>
          </div>
          <div className="money-result">
            <span>O valor da sua venda</span>
            <strong>continua sendo seu.</strong>
          </div>
          <p>R$ 0,00 de taxa do Confeitto por pedido, em todos os canais.</p>
          <div className="money-seal"><span aria-hidden="true">✓</span> Sem surpresa no fechamento</div>
        </aside>
      </div>
    </section>
  )
}

function Comparison() {
  const cards = [
    { ...COMPARISON.apps, variant: 'apps', icon: '↓' },
    { ...COMPARISON.confeitto, variant: 'confeitto', icon: '↑' },
  ]

  return (
    <section id="comparativo" className="comparison-section">
      <div className="container">
        <div className="section-kicker reveal">{COMPARISON.eyebrow}</div>
        <h2 className="reveal">{COMPARISON.title}</h2>
        <p className="section-intro comparison-intro reveal">{COMPARISON.intro}</p>
        <div className="comparison-grid">
          {cards.map((card, index) => (
            <article
              className={`comparison-card comparison-${card.variant} reveal`}
              style={{ '--reveal-delay': `${index * 110}ms` }}
              key={card.label}
            >
              <div className="comparison-card-head">
                <span className="comparison-icon" aria-hidden="true">{card.icon}</span>
                <div>
                  <span className="comparison-label">{card.label}</span>
                  <h3>{card.badge}</h3>
                </div>
              </div>
              <ul>
                {card.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="comparison-footer">{card.footer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Ticker() {
  const items = [
    '0% de comissão',
    'Seu dinheiro na sua conta',
    'Loja online própria',
    'PIX Automático',
    'Pedidos sem atravessador',
    'Controle de Estoque',
    'Sua marca em primeiro lugar',
  ]
  const row = items.map((t, i) => (
    <span key={i}>
      {t} <i>✦</i>
    </span>
  ))
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {row}
        {row}
      </div>
    </div>
  )
}

function Stats() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`${API}/store/public/stats`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  // Exibimos ordens de grandeza, não o número exato do banco. Isso evita que
  // o destaque social pareça um contador de precisão e também envelheça menos.
  const pedidosMil = Math.max(1, Math.floor(data.totalPedidos / 1000))
  const faturamentoMil = Math.max(1, Math.round(data.faturamentoTotal / 10000) * 10)
  const economiaBaixa = Math.floor((data.faturamentoTotal * 0.152) / 10000) * 10  // 12% + 3.2%
  const economiaAlta  = Math.ceil((data.faturamentoTotal * 0.262) / 10000) * 10  // 23% + 3.2%

  const items = [
    { emoji: '🏪', valor: `${data.lojasAbertas}+`, label: 'lojas ativas hoje' },
    { emoji: '📦', valor: `${pedidosMil} mil+`, label: 'pedidos realizados' },
    { emoji: '💰', valor: `R$ ${faturamentoMil} mil+`, label: 'faturamento movimentado' },
    { emoji: '💸', valor: `R$ ${economiaBaixa}–${economiaAlta} mil`, label: 'economia estimada vs apps' },
  ]

  return (
    <section className="stats-section">
      <div className="container">
        <div className="section-kicker reveal">Resultado de quem vende com estrutura própria</div>
        <h2 className="reveal">Mais vendas. <span className="highlight">Menos dinheiro escapando.</span></h2>
        <div className="stats-grid">
          {items.map((item, i) => (
            <div className="stat-card reveal" style={{ '--reveal-delay': `${i * 70}ms` }} key={i}>
              <div className="stat-emoji">{item.emoji}</div>
              <div className="stat-value">
                {item.valor}
              </div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="recursos">
      <div className="container">
        <h2 className="reveal">
          Tudo que sua <span className="highlight">confeitaria</span> precisa
        </h2>
        <p className="section-intro reveal">{FEATURES_INTRO}</p>
        <div className="features-grid">
          {FEATURES.map((f, index) => (
            <div className="feature-card reveal" style={{ '--reveal-delay': `${index * 65}ms` }} key={f.title}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="section-alt">
      <div className="container">
        <h2 className="reveal">
          Como <span className="highlight">funciona</span>
        </h2>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step reveal" style={{ '--reveal-delay': `${i * 90}ms` }} key={s.title}>
              <div className="step-num">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Plano padrão vindo da API. Existe como hook porque mais de uma seção mostra
// preço — e preço escrito à mão no JSX já divergiu do que o sistema cobra de
// verdade (a landing anunciava R$300 enquanto o plano cobrava R$200).
function usePlanoPadrao() {
  const [plan, setPlan] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetch(`${SIGNUP_API}/signup/plans`)
      .then(r => {
        if (!r.ok) throw new Error(`planos indisponíveis (${r.status})`)
        return r.json()
      })
      .then(plans => {
        if (!Array.isArray(plans)) throw new Error('resposta de planos inválida')
        const chosen = plans.find(p => p.isDefault) || plans[0]
        if (!chosen) { setLoadError(true); return }
        setPlan(chosen)
      })
      .catch(() => setLoadError(true))
  }, [])

  return { plan, loadError }
}

const moeda = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`
const valorPix = (plan) => Number(plan?.setupFee || 0) * (1 - Number(plan?.pixDiscountPercent || 0) / 100)
const TEXTO_TAXA_PEDIDO = 'O Confeitto cobra 0% de comissão sobre o valor das vendas e R$ 0,00 de taxa por pedido. Tarifas do meio de pagamento e o frete escolhido são cobrados pelos respectivos fornecedores.'

function Pricing({ onSignup, plan, loadError }) {
  return (
    <section id="oferta" className="pricing">
      <div className="container">
        <div className="section-kicker reveal">Previsível para você. Transparente para o cliente.</div>
        <h2 className="reveal">
          Zero comissão. <span className="highlight">Um plano simples.</span>
        </h2>
        <div className="pricing-card reveal">
          <div className="pricing-ribbon">0% de comissão sobre vendas</div>
          <div className="pricing-body">
            <div className="pricing-left">
              <div className="price-label">Implantação única</div>
              {plan ? (
                <>
                  <div className="price-now">{moeda(plan.setupFee)}</div>
                  {plan.pixDiscountPercent > 0 && (
                    <div className="price-pix">ou <strong>{moeda(valorPix(plan))}</strong> no PIX</div>
                  )}
                  <div className="price-plus">+</div>
                  <div className="price-monthly">
                    <strong>{moeda(plan.monthlyFee)}</strong><span>/mês</span>
                  </div>
                </>
              ) : (
                <div className="price-now price-loading">{loadError ? '—' : 'Carregando...'}</div>
              )}
              <div className="price-note">Sem fidelidade. Cancele quando quiser.</div>
              <div className="commission-zero">
                <strong>0%</strong>
                <span>do valor da sua venda fica com o Confeitto</span>
              </div>
              <p className="price-delivery-fee"><strong>Sem letra miúda:</strong> o Confeitto não cobra taxa por pedido. Continuam existindo apenas as tarifas do meio de pagamento e do frete que a loja escolher.</p>
            </div>
            <ul className="pricing-list">
              {PRICING_INCLUDES.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <button type="button" className="btn btn-primary btn-big" onClick={onSignup}>
            Parar de pagar comissão →
          </button>
        </div>
      </div>
    </section>
  )
}

const STORES = [
  { emoji: '👩‍🍳', name: 'Chef Andressa Ventura', url: 'https://chefandressaventura.com', label: 'chefandressaventura.com' },
  { emoji: '🍰', name: 'Nay Bolos', url: 'https://naybolos.com.br', label: 'naybolos.com.br' },
  { emoji: '🍬', name: 'Delícias da Célia', url: 'https://deliciasdacelia.smartiza.com.br', label: 'deliciasdacelia.smartiza.com.br' },
  { emoji: '🎨', name: 'ATELIÊ REAL', url: 'https://confeitaria.smartiza.com.br/atelie-real', label: '/atelie-real' },
]

function Stores() {
  return (
    <section className="section-alt">
      <div className="container">
        <h2 className="reveal">
          Lojas que já <span className="highlight">confiam</span> na gente
        </h2>
        <div className="stores-grid">
          {STORES.map((s, index) => (
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="store-preview reveal" style={{ '--reveal-delay': `${index * 70}ms` }} key={s.name}>
              <div className="emoji">{s.emoji}</div>
              <div className="name">{s.name}</div>
              <div className="url">{s.label}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

const CHECKPOINTS = [
  {
    lojas: 5,
    titulo: 'A base',
    resumo: 'Tudo que já está no ar hoje, funcionando todo dia.',
    itens: [
      'Loja própria com domínio e a identidade da sua marca',
      'PIX online com confirmação automática do pagamento',
      'Painel de pedidos em tempo real, online e no balcão',
      'Encomendas com data agendada e controle de estoque',
    ],
  },
  {
    lojas: 10,
    titulo: 'Saber quanto cada bolo dá de lucro',
    resumo: 'Preço no chute acaba: o sistema calcula o custo real e mostra o que compensa produzir.',
    itens: [
      'Custo de cada receita calculado pelos ingredientes que você compra',
      'Preço sugerido a partir da margem que você quer ganhar',
      'Aviso quando um produto está saindo no prejuízo',
    ],
  },
  {
    lojas: 25,
    titulo: 'Seus pedidos dos apps, no mesmo painel',
    resumo: 'O que chega pelo iFood e pelo 99Food cai junto com o resto — sem tablet extra.',
    itens: [
      'Integração com iFood e 99Food',
      'Pedidos dos apps no mesmo painel da sua loja própria',
      'Estoque e produção atualizados por todos os canais',
    ],
  },
  {
    lojas: 100,
    titulo: 'Nota fiscal sem dor de cabeça',
    resumo: 'A parte burocrática que hoje toma seu domingo passa a ser automática.',
    itens: [
      'Emissão de nota fiscal direto pelo sistema',
      'Nota gerada junto com o pedido, sem digitar duas vezes',
      'Relatórios prontos para entregar à contabilidade',
    ],
  },
]

function Checkpoints() {
  const [total, setTotal] = useState(null)

  useEffect(() => {
    fetch(`${API}/store/public/stats`)
      .then((r) => r.json())
      .then((d) => setTotal(d.totalLojas))
      .catch(() => {})
  }, [])

  if (total === null) return null

  const proximo = CHECKPOINTS.find((c) => total < c.lojas)
  const faltam = proximo ? proximo.lojas - total : 0
  const anterior = [...CHECKPOINTS].reverse().find((c) => total >= c.lojas)
  const base = anterior ? anterior.lojas : 0
  const progresso = proximo
    ? Math.min(100, Math.round(((total - base) / (proximo.lojas - base)) * 100))
    : 100

  return (
    <section className="checkpoints">
      <div className="container">
        <h2>
          A plataforma cresce <span className="highlight">com as confeitarias</span>
        </h2>
        <p className="checkpoints-sub">
          Cada nova loja financia a próxima entrega. Estes são os checkpoints — o que já está
          pronto e o que vem a seguir.
        </p>

        <div className="checkpoint-meter">
          <div className="meter-now">
            <strong>{total}</strong> {total === 1 ? 'confeitaria' : 'confeitarias'} na plataforma
          </div>
          <div className="meter-bar">
            <div className="meter-fill" style={{ width: `${progresso}%` }} />
          </div>
          <div className="meter-next">
            {proximo
              ? `${faltam} ${faltam === 1 ? 'loja' : 'lojas'} para o próximo checkpoint`
              : 'Todos os checkpoints alcançados'}
          </div>
        </div>

        <div className="checkpoint-list">
          {CHECKPOINTS.map((c) => {
            const conquistado = total >= c.lojas
            const emAndamento = proximo && c.lojas === proximo.lojas
            const status = conquistado
              ? 'Conquistado'
              : emAndamento
                ? `Faltam ${faltam}`
                : 'A caminho'

            return (
              <div
                className={`checkpoint${conquistado ? ' done' : ''}${emAndamento ? ' active' : ''}`}
                key={c.lojas}
              >
                <div className="checkpoint-mark">
                  <span className="checkpoint-lojas">{c.lojas}</span>
                  <span className="checkpoint-lojas-label">lojas</span>
                </div>
                <div className="checkpoint-body">
                  <div className="checkpoint-head">
                    <h3>{c.titulo}</h3>
                    <span className="checkpoint-status">{status}</span>
                  </div>
                  <p className="checkpoint-resumo">{c.resumo}</p>
                  <ul className="checkpoint-itens">
                    {c.itens.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FinalCTA({ onSignup, plan, whatsappNumber }) {
  const temDescontoPix = plan?.pixDiscountPercent > 0

  return (
    <section>
      <div className="container">
        <div className="cta-section reveal">
          <div className="cta-kicker">Seu talento não precisa pagar pedágio</div>
          <h2>
            Não entregue seu lucro para <span className="grad">plataformas de delivery.</span>
          </h2>
          <p>
            Tenha sua loja, sua marca e seus clientes. Venda com 0% de comissão e receba direto na sua conta.
            {plan && (
              <> Implantação de <strong>{moeda(plan.setupFee)}</strong>
                {temDescontoPix && <> (ou <strong>{moeda(plan.setupFee * (1 - plan.pixDiscountPercent / 100))}</strong> no PIX)</>}
                {' '}+ {moeda(plan.monthlyFee)}/mês. {TEXTO_TAXA_PEDIDO}</>
            )}
          </p>
          <button type="button" className="btn btn-light btn-big" onClick={onSignup}>
            Quero ficar com minhas vendas →
          </button>
          <p className="signup-alt" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {whatsappNumber && <>Prefere falar antes? <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>Chama no WhatsApp</a></>}
          </p>
        </div>
      </div>
    </section>
  )
}

function MobileCTA({ onSignup }) {
  return (
    <div className="mobile-cta" aria-label="Ação rápida">
      <div><strong>0% comissão</strong><span>sobre suas vendas</span></div>
      <button type="button" onClick={onSignup}>Criar loja</button>
    </div>
  )
}

function Footer() {
  return (
    <footer>
      <div className="container">
        <nav className="footer-nav">
          <a href="/blog/">Blog</a>
          <a href="/faq">Perguntas frequentes</a>
          <a href="/termos">Termos de uso</a>
          <a href="/privacidade">Privacidade</a>
        </nav>
        <p>
          © 2026 <a href="https://smartiza.com.br">Smartiza</a> — Tecnologia para confeitarias
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  useReveal()
  useEffect(() => { trackFunnel('visit') }, [])
  const { plan, loadError } = usePlanoPadrao()
  const whatsappNumber = useConfiguredWhatsapp()
  // O cadastro virou tela própria (/criar) em vez de modal: formulário longo
  // dentro de caixinha é o que fazia o fluxo parecer arrastado. Os CTAs viram
  // navegação de verdade — com URL, histórico e botão voltar funcionando.
  const openSignup = () => { window.location.href = '/criar' }

  // Loja de apresentação virando cliente: o banner na loja (/{slug}) manda
  // pra cá com ?convert=slug. Busca o nome real da loja antes de abrir o
  // modal — sem isso o passo "Loja" apareceria pedindo pra escolher um nome
  // que já existe.
  // Loja de apresentação virando cliente: o banner na loja (/{slug}) manda
  // pra cá com ?convert=slug — repassa pra tela de cadastro, que sabe pular a
  // pergunta do nome (a loja já existe).
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('convert')
    if (slug) window.location.href = `/criar?convert=${encodeURIComponent(slug)}`
  }, [])

  if (window.location.pathname.replace(/\/$/, '') === '/criar') return <SignupPage />

  return (
    <>
      <Header onSignup={openSignup} />
      <main id="main-content">
        <Hero onSignup={openSignup} />
        <Ticker />
        <Comparison />
        <Stats />
        <Features />
        <HowItWorks />
        <Pricing onSignup={openSignup} plan={plan} loadError={loadError} />
        <Stores />
        <Checkpoints />
        <FinalCTA onSignup={openSignup} plan={plan} whatsappNumber={whatsappNumber} />
      </main>
      <Footer />
      <MobileCTA onSignup={openSignup} />
    </>
  )
}
