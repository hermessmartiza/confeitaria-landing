import { useEffect, useState, useRef } from 'react'
import SignupModal, { trackFunnel } from './SignupFlow'
import { HERO, FEATURES, FEATURES_INTRO, STEPS, PRICING_INCLUDES } from './heroContent'

const WHATSAPP = 'https://wa.me/554197601739'
const API = 'https://confeitaria.smartiza.com.br/api'
// Catálogo de planos (Fase 4/7) — precisa apontar pro backend do próprio
// ambiente onde a landing está rodando (isolado ou produção), não sempre pra
// produção real como o API acima (que é leitura pública de stats, feature
// anterior e sem relação com isso).
const SIGNUP_API = import.meta.env.VITE_API_URL || 'https://confeitaria.smartiza.com.br/api'

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
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
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function Header({ onSignup }) {
  return (
    <header>
      <div className="container header-inner">
        <div className="logo">
          <img src="/brand/simbolo.svg" alt="Confeitto, sistema de gestão para confeitarias" width="30" height="30" className="logo-mark" fetchPriority="high" />
          <span className="logo-text">Conf<span className="logo-ei">ei</span>tto</span>
        </div>
        <button className="header-cta" onClick={onSignup}>
          Criar minha loja
        </button>
      </div>
    </header>
  )
}

function Hero({ onSignup }) {
  return (
    <section className="hero">
      <div className="hero-sprinkles" aria-hidden="true">
        <span style={{ left: '8%', animationDelay: '0s' }}>🍰</span>
        <span style={{ left: '22%', animationDelay: '2.5s' }}>🧁</span>
        <span style={{ left: '38%', animationDelay: '1.2s' }}>🍩</span>
        <span style={{ left: '55%', animationDelay: '3.4s' }}>🎂</span>
        <span style={{ left: '72%', animationDelay: '0.8s' }}>🍫</span>
        <span style={{ left: '88%', animationDelay: '2s' }}>🍓</span>
      </div>
      <div className="container hero-content">
        <div className="hero-badge">{HERO.badge}</div>
        <h1>
          {HERO.headingBefore}
          <span className="grad">{HERO.headingGrad1}</span>
          {HERO.headingMiddle}
          <span className="grad">{HERO.headingGrad2}</span>
        </h1>
        <p>{HERO.paragraph}</p>
        <div className="hero-actions">
          <button className="btn btn-light" onClick={onSignup}>
            {HERO.ctaPrimaryLabel}
          </button>
          <a className="btn btn-ghost" href={HERO.ctaSecondaryHref}>
            {HERO.ctaSecondaryLabel}
          </a>
        </div>
      </div>
    </section>
  )
}

function Ticker() {
  const items = [
    'Venda Online',
    'Venda Presencial',
    'PIX Automático',
    'Gestão de Encomendas',
    'Controle de Estoque',
    'Relatórios Financeiros',
    'Loja com Sua Marca',
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

function CountUp({ end, duration = 1200 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || started.current) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        started.current = true
        io.unobserve(el)
        const start = performance.now()
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1)
          setVal(Math.floor(p * end))
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [end, duration])

  return <span ref={ref}>{val}</span>
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

  const economiaBaixa = Math.round((data.faturamentoTotal * 0.152) / 1000)  // 12% + 3.2%
  const economiaAlta  = Math.round((data.faturamentoTotal * 0.262) / 1000)  // 23% + 3.2%

  const items = [
    { emoji: '🏪', valor: data.lojasAbertas, label: 'lojas abertas agora', raw: data.lojasAbertas },
    { emoji: '📦', valor: data.totalPedidos, label: 'pedidos de todo tempo', raw: data.totalPedidos },
    { emoji: '💰', valor: `R$ ${(data.faturamentoTotal/1000).toFixed(0)} mil`, label: 'faturamento total', raw: Math.round(data.faturamentoTotal/1000), prefix: 'R$ ', suffix: ' mil' },
    { emoji: '💸', valor: `R$ ${economiaBaixa} a ${economiaAlta} mil`, label: 'economia vs apps (comissão + taxa)', raw: economiaBaixa, prefix: 'R$ ', suffix: ` a ${economiaAlta} mil` },
  ]

  return (
    <section className="stats-section">
      <div className="container">
        <h2 className="reveal">Números que <span className="highlight">falam por si</span></h2>
        <div className="stats-grid">
          {items.map((item, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-emoji">{item.emoji}</div>
              <div className="stat-value">
                {item.prefix && <span>{item.prefix}</span>}
                <CountUp end={item.raw} />
                {item.suffix && <span>{item.suffix}</span>}
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
          {FEATURES.map((f) => (
            <div className="feature-card reveal" key={f.title}>
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
            <div className="step reveal" key={s.title}>
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
      .then(r => r.json())
      .then(plans => {
        const chosen = plans.find(p => p.isDefault) || plans[0]
        if (!chosen) { setLoadError(true); return }
        setPlan(chosen)
      })
      .catch(() => setLoadError(true))
  }, [])

  return { plan, loadError }
}

const moeda = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`

function Pricing({ onSignup }) {
  const { plan, loadError } = usePlanoPadrao()

  return (
    <section id="oferta" className="pricing">
      <div className="container">
        <h2 className="reveal">
          Um plano só. <span className="highlight">Tudo incluso.</span>
        </h2>
        <div className="pricing-card reveal">
          <div className="pricing-ribbon">🔥 Oferta de lançamento</div>
          <div className="pricing-body">
            <div className="pricing-left">
              <div className="price-label">Implantação única</div>
              {plan ? (
                <>
                  <div className="price-now">
                    <span className="currency">R$</span>{plan.setupFee.toFixed(0)}
                  </div>
                  <div className="price-plus">+</div>
                  <div className="price-monthly">
                    <strong>R$ {plan.monthlyFee.toFixed(0)}</strong>/mês
                  </div>
                </>
              ) : (
                <div className="price-now price-loading">{loadError ? '—' : 'Carregando...'}</div>
              )}
              <div className="price-note">Sem fidelidade. Cancele quando quiser.</div>
            </div>
            <ul className="pricing-list">
              {PRICING_INCLUDES.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <button className="btn btn-primary btn-big" onClick={onSignup}>
            Garantir minha oferta 🚀
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
          {STORES.map((s) => (
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="store-preview reveal" key={s.name}>
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

function FinalCTA({ onSignup }) {
  const { plan } = usePlanoPadrao()
  const temDescontoPix = plan?.pixDiscountPercent > 0

  return (
    <section>
      <div className="container">
        <div className="cta-section reveal">
          <h2>
            Pronto pra <span className="grad">profissionalizar</span> sua confeitaria?
          </h2>
          <p>
            Crie sua loja agora e em minutos ela está no ar.
            {plan && (
              <> Implantação de <strong>{moeda(plan.setupFee)}</strong>
                {temDescontoPix && <> (ou <strong>{moeda(plan.setupFee * (1 - plan.pixDiscountPercent / 100))}</strong> no PIX)</>}
                {' '}+ {moeda(plan.monthlyFee)}/mês.</>
            )}
          </p>
          <button className="btn btn-light btn-big" onClick={onSignup}>
            Quero minha loja 🚀
          </button>
          <p className="signup-alt" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Prefere falar antes? <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>Chama no WhatsApp</a>
          </p>
        </div>
      </div>
    </section>
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
  const [signupOpen, setSignupOpen] = useState(false)
  const [presetStore, setPresetStore] = useState(null)
  const openSignup = () => setSignupOpen(true)

  // Loja de apresentação virando cliente: o banner na loja (/{slug}) manda
  // pra cá com ?convert=slug. Busca o nome real da loja antes de abrir o
  // modal — sem isso o passo "Loja" apareceria pedindo pra escolher um nome
  // que já existe.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('convert')
    if (!slug) return
    fetch(`${SIGNUP_API}/signup/check-slug?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(d => {
        if (d.isPresentation) {
          setPresetStore({ slug, name: d.storeName })
          setSignupOpen(true)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <Header onSignup={openSignup} />
      <main>
        <Hero onSignup={openSignup} />
        <Ticker />
        <Stats />
        <Features />
        <HowItWorks />
        <Pricing onSignup={openSignup} />
        <Stores />
        <Checkpoints />
        <FinalCTA onSignup={openSignup} />
      </main>
      <Footer />
      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} presetStore={presetStore} />
    </>
  )
}
