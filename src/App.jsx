import { useEffect, useState } from 'react'

const WHATSAPP = 'https://wa.me/554197601739'
const API = 'https://confeitaria.smartiza.com.br/api'

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

function Header() {
  return (
    <header>
      <div className="container header-inner">
        <div className="logo">
          Conf<span>ei</span>taria <em>by Smartiza</em>
        </div>
        <a className="header-cta" href={WHATSAPP} target="_blank" rel="noreferrer">
          Falar com a gente
        </a>
      </div>
    </header>
  )
}

function Hero() {
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
        <div className="hero-badge">✨ Oferta de lançamento — implantação com 40% OFF</div>
        <h1>
          O sistema <span className="grad">completo</span> para sua
          confeitaria <span className="grad">vender mais</span>
        </h1>
        <p>
          Venda online e presencial, gestão de encomendas, estoque, PIX
          automático e relatórios — tudo em um só painel, com a cara da sua
          marca.
        </p>
        <div className="hero-actions">
          <a className="btn btn-light" href={WHATSAPP} target="_blank" rel="noreferrer">
            Quero começar agora 🚀
          </a>
          <a className="btn btn-ghost" href="#oferta">
            Ver oferta
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

function Stats() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`${API}/store/public/stats`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  const items = [
    { emoji: '🏪', valor: data.lojasAbertas, label: 'lojas abertas agora' },
    { emoji: '📦', valor: data.pedidos30dias, label: 'pedidos nos últimos 30 dias' },
    { emoji: '💰', valor: data.faturamento30dias >= 1000 ? `R$ ${(data.faturamento30dias/1000).toFixed(0)} mil` : `R$ ${data.faturamento30dias.toFixed(0)}`, label: 'faturamento em 30 dias' },
    { emoji: '🍰', valor: data.produtosAtivos, label: 'produtos ativos' },
    { emoji: '💸', valor: `R$ ${((data.faturamento30dias * 0.12) / 1000).toFixed(0)} mil`, label: 'economia vs apps de delivery' },
  ]

  return (
    <section className="stats-section">
      <div className="container">
        <h2 className="reveal">Números que <span className="highlight">falam por si</span></h2>
        <div className="stats-grid">
          {items.map((item, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-emoji">{item.emoji}</div>
              <div className="stat-value">{item.valor}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    icon: '🛍️',
    title: 'Loja Online Própria',
    text: 'Catálogo com fotos, carrinho e checkout no seu próprio site, com domínio próprio e a identidade da sua marca.',
  },
  {
    icon: '🏪',
    title: 'Venda Presencial (PDV)',
    text: 'Registre as vendas do balcão em segundos e mantenha online e presencial no mesmo caixa, sem retrabalho.',
  },
  {
    icon: '💳',
    title: 'Pagamento PIX',
    text: 'Cliente paga online e você recebe na hora, com confirmação automática do pagamento.',
  },
  {
    icon: '📦',
    title: 'Gestão de Encomendas',
    text: 'Agenda de produção, pré-venda e controle de entregas — chega de caderninho e pedidos perdidos.',
  },
  {
    icon: '📊',
    title: 'Painel de Gestão',
    text: 'Pedidos, estoque e relatórios financeiros em tempo real, do celular ou do computador.',
  },
  {
    icon: '🎨',
    title: 'Sua Marca, Seu Estilo',
    text: 'Cores, logotipo e banner personalizados direto no painel, sem precisar de código.',
  },
]

function Features() {
  return (
    <section id="recursos">
      <div className="container">
        <h2 className="reveal">
          Tudo que sua <span className="highlight">confeitaria</span> precisa
        </h2>
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

const STEPS = [
  {
    title: 'Fale com a gente',
    text: 'Nos chame informando o nome da sua confeitaria e as cores da sua marca.',
  },
  {
    title: 'A gente cria sua loja',
    text: 'Em até 24h sua loja está no ar com cardápio, domínio e identidade visual.',
  },
  {
    title: 'Cadastre seus produtos',
    text: 'Pelo painel, publique bolos, doces e salgados com fotos e preços.',
  },
  {
    title: 'Venda online e no balcão',
    text: 'Acompanhe todos os pedidos e vendas em tempo real, num painel só.',
  },
]

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
              <h4>{s.title}</h4>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
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
              <div className="price-old">
                de <s>R$ 500</s>
              </div>
              <div className="price-now">
                <span className="currency">R$</span>300
                <span className="discount-badge">−40%</span>
              </div>
              <div className="price-plus">+</div>
              <div className="price-monthly">
                <strong>R$ 50</strong>/mês
              </div>
              <div className="price-note">Sem fidelidade. Cancele quando quiser.</div>
            </div>
            <ul className="pricing-list">
              <li>Loja online completa com domínio próprio</li>
              <li>PDV para venda presencial</li>
              <li>Pagamento PIX com confirmação automática</li>
              <li>Gestão de encomendas e agenda de produção</li>
              <li>Controle de estoque</li>
              <li>Relatórios financeiros</li>
              <li>Layout com a identidade da sua marca</li>
              <li>Suporte e atualizações inclusos</li>
            </ul>
          </div>
          <a className="btn btn-primary btn-big" href={WHATSAPP} target="_blank" rel="noreferrer">
            Garantir minha oferta 🚀
          </a>
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
            <a href={s.url} target="_blank" rel="noreferrer" className="store-preview reveal" key={s.name}>
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

function FinalCTA() {
  return (
    <section>
      <div className="container">
        <div className="cta-section reveal">
          <h2>
            Pronto pra <span className="grad">profissionalizar</span> sua confeitaria?
          </h2>
          <p>
            Mande uma mensagem agora e em até 24h sua loja está no ar.
            Implantação de <s>R$ 500</s> por <strong>R$ 300</strong> + R$ 50/mês.
          </p>
          <a className="btn btn-light btn-big" href={WHATSAPP} target="_blank" rel="noreferrer">
            Quero minha loja 🚀
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer>
      <div className="container">
        <p>
          © 2026 <a href="https://smartiza.com.br">Smartiza</a> — Tecnologia para confeitarias
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  useReveal()
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Ticker />
        <Stats />
        <Features />
        <HowItWorks />
        <Pricing />
        <Stores />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
