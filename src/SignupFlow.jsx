import { useEffect, useRef, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://confeitaria.smartiza.com.br/api'
const WHATSAPP = 'https://wa.me/554197601739'

// Loja = path no domínio único (ex: dominio.com/minha-loja), não subdomínio.
// Se VITE_STORE_BASE_DOMAIN não for setado no build, deriva do próprio host
// da landing (que roda em landing.<dominio-da-loja>) tirando o prefixo.
const STORE_BASE_DOMAIN = import.meta.env.VITE_STORE_BASE_DOMAIN
  || (typeof window !== 'undefined' ? window.location.hostname.replace(/^landing\./, '') : '')

// Métricas de funil (Fase 6): visita → signup iniciado → pago → provisionado.
// sessionId anônimo, só pra amarrar os degraus de uma mesma visita — sem
// nome, email ou qualquer dado pessoal.
function getSessionId() {
  try {
    let id = localStorage.getItem('confeitto_funnel_session')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('confeitto_funnel_session', id)
    }
    return id
  } catch {
    return 'no-storage'
  }
}

export function trackFunnel(step, slug) {
  fetch(`${API}/signup/funnel-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step, sessionId: getSessionId(), slug }),
  }).catch(() => {})
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
}

function useSlugCheck(slug) {
  const [status, setStatus] = useState(null) // null | 'checking' | 'available' | 'taken' | { error }
  useEffect(() => {
    if (!slug || slug.length < 3) { setStatus(null); return }
    setStatus('checking')
    const t = setTimeout(() => {
      fetch(`${API}/signup/check-slug?slug=${encodeURIComponent(slug)}`)
        .then(r => r.json())
        .then(d => setStatus(d.available ? 'available' : (d.error || 'taken')))
        .catch(() => setStatus(null))
    }, 400)
    return () => clearTimeout(t)
  }, [slug])
  return status
}

// ─── Tokenização de cartão (Fase 5) ─────────────────────────────────────────
// NÃO VERIFICADO EM NAVEGADOR REAL NESTA SESSÃO. O SDK de tokenização da Efí
// (nome público "EfiJs"/"payment-token-efi") tokeniza o cartão no navegador
// do cliente — número e CVV nunca chegam no nosso backend, só o payment_token
// resultante. A URL do script e o formato exato de $gn.ready/getPaymentToken
// aqui seguem a documentação pública da Efí como eu a conheço, mas isso
// precisa ser testado num navegador de verdade antes de confiar — não há
// acesso a navegador nesta sessão pra confirmar visualmente. Se o SDK não
// carregar ou a API mudou de nome, o erro aparece no console do navegador
// e a tokenização falha com uma mensagem clara em vez de travar silenciosa.
function loadEfiScript(payeeCode, sandbox) {
  return new Promise((resolve, reject) => {
    if (window.$gn) return resolve(window.$gn)
    const existing = document.getElementById('efi-tokenization-sdk')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.$gn))
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.id = 'efi-tokenization-sdk'
    const env = sandbox ? 'sandbox' : 'production'
    script.src = `https://${sandbox ? 'sandbox.' : ''}gerencianet.com.br/v1/cdn/${payeeCode}/${crypto.randomUUID().replace(/-/g, '')}`
    script.dataset.env = env
    script.onload = () => resolve(window.$gn)
    script.onerror = () => reject(new Error('Falha ao carregar o SDK de pagamento'))
    document.head.appendChild(script)
  })
}

function useCardTokenization() {
  const [efiConfig, setEfiConfig] = useState(null)
  useEffect(() => {
    fetch(`${API}/signup/efi-public-config`).then(r => r.json()).then(setEfiConfig).catch(() => {})
  }, [])

  async function getPaymentToken(card) {
    if (!efiConfig?.payeeCode) throw new Error('Configuração de pagamento indisponível — tente novamente em instantes.')
    const gn = await loadEfiScript(efiConfig.payeeCode, efiConfig.sandbox)
    return new Promise((resolve, reject) => {
      gn.ready((checkout) => {
        checkout.getPaymentToken({
          brand: card.brand,
          number: card.number.replace(/\D/g, ''),
          cvv: card.cvv,
          expirationMonth: card.expirationMonth,
          expirationYear: card.expirationYear,
          reuse: false,
        }, (error, response) => {
          if (error) return reject(new Error(error.error_description || 'Cartão recusado. Confira os dados e tente de novo.'))
          resolve(response.data.payment_token)
        })
      })
    })
  }

  return { getPaymentToken, ready: !!efiConfig }
}

function detectBrand(number) {
  const n = number.replace(/\D/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^6(?:011|5)/.test(n)) return 'discover'
  if (/^(?:2131|1800|35)/.test(n)) return 'jcb'
  if (/^36/.test(n)) return 'diners'
  if (/^(?:4011|4312|4389|4514|4573|6277|6362|6363|650|6516|6550)/.test(n)) return 'elo'
  return 'visa' // fallback — o SDK recusa se estiver errado, não é um dado sensível
}

function SlugField({ slug, onChange }) {
  const status = useSlugCheck(slug)
  return (
    <div className="signup-field">
      <label htmlFor="signup-slug">Endereço da sua loja</label>
      <div className="signup-slug-row">
        <span className="signup-slug-prefix">{STORE_BASE_DOMAIN}/</span>
        <input
          id="signup-slug"
          value={slug}
          onChange={(e) => onChange(slugify(e.target.value))}
          placeholder="minha-confeitaria"
          required
        />
      </div>
      {status === 'checking' && <p className="signup-hint">verificando...</p>}
      {status === 'available' && <p className="signup-hint signup-hint-ok">✓ disponível</p>}
      {status === 'taken' && <p className="signup-hint signup-hint-bad">já está em uso</p>}
      {status && status !== 'checking' && status !== 'available' && status !== 'taken' && (
        <p className="signup-hint signup-hint-bad">{status}</p>
      )}
    </div>
  )
}

function CardFields({ card, onChange }) {
  const set = (key) => (e) => onChange({ ...card, [key]: e.target.value })
  return (
    <div className="signup-card-fields">
      <div className="signup-field">
        <label htmlFor="card-number">Número do cartão</label>
        <input id="card-number" inputMode="numeric" value={card.number} onChange={set('number')} placeholder="0000 0000 0000 0000" required />
      </div>
      <div className="signup-field-row">
        <div className="signup-field">
          <label htmlFor="card-expmonth">Validade (mês)</label>
          <input id="card-expmonth" inputMode="numeric" maxLength={2} value={card.expirationMonth} onChange={set('expirationMonth')} placeholder="MM" required />
        </div>
        <div className="signup-field">
          <label htmlFor="card-expyear">Validade (ano)</label>
          <input id="card-expyear" inputMode="numeric" maxLength={4} value={card.expirationYear} onChange={set('expirationYear')} placeholder="AAAA" required />
        </div>
        <div className="signup-field">
          <label htmlFor="card-cvv">CVV</label>
          <input id="card-cvv" inputMode="numeric" maxLength={4} value={card.cvv} onChange={set('cvv')} placeholder="123" required />
        </div>
      </div>
      <div className="signup-field">
        <label htmlFor="card-cpf">CPF do titular</label>
        <input id="card-cpf" inputMode="numeric" value={card.cpf} onChange={set('cpf')} placeholder="000.000.000-00" required />
      </div>
      <div className="signup-field">
        <label htmlFor="card-birth">Data de nascimento do titular</label>
        <input id="card-birth" type="date" value={card.birth} onChange={set('birth')} required />
      </div>
      <p className="signup-sub" style={{ marginTop: '4px' }}>Endereço de cobrança</p>
      <div className="signup-field-row">
        <div className="signup-field">
          <label htmlFor="card-cep">CEP</label>
          <input id="card-cep" value={card.zipcode} onChange={set('zipcode')} required />
        </div>
        <div className="signup-field">
          <label htmlFor="card-street">Rua</label>
          <input id="card-street" value={card.street} onChange={set('street')} required />
        </div>
        <div className="signup-field">
          <label htmlFor="card-number-addr">Número</label>
          <input id="card-number-addr" value={card.number_addr} onChange={set('number_addr')} required />
        </div>
      </div>
      <div className="signup-field-row">
        <div className="signup-field">
          <label htmlFor="card-neighborhood">Bairro</label>
          <input id="card-neighborhood" value={card.neighborhood} onChange={set('neighborhood')} required />
        </div>
        <div className="signup-field">
          <label htmlFor="card-city">Cidade</label>
          <input id="card-city" value={card.city} onChange={set('city')} required />
        </div>
        <div className="signup-field">
          <label htmlFor="card-state">UF</label>
          <input id="card-state" maxLength={2} value={card.state} onChange={set('state')} placeholder="SP" required />
        </div>
      </div>
    </div>
  )
}

const EMPTY_CARD = {
  number: '', expirationMonth: '', expirationYear: '', cvv: '', cpf: '', birth: '',
  zipcode: '', street: '', number_addr: '', neighborhood: '', city: '', state: '',
}

function FormStep({ onSubmit, submitting, error }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', storeName: '', slug: '', paymentMethod: 'PIX' })
  const [card, setCard] = useState(EMPTY_CARD)

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => {
      const next = { ...f, [key]: value }
      // Sugere o slug a partir do nome da loja até o usuário editar o slug na mão
      if (key === 'storeName' && !f.slugTouched) next.slug = slugify(value)
      return next
    })
  }

  return (
    <form
      className="signup-form"
      onSubmit={(e) => { e.preventDefault(); onSubmit(form, card) }}
    >
      <h3>Vamos criar sua loja</h3>
      <p className="signup-sub">Leva 2 minutos. Sua loja fica no ar assim que o pagamento confirmar.</p>

      <div className="signup-field">
        <label htmlFor="signup-storeName">Nome da confeitaria</label>
        <input id="signup-storeName" value={form.storeName} onChange={set('storeName')} placeholder="Ex: Doce Encanto" required />
      </div>

      <SlugField slug={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v, slugTouched: true }))} />

      <div className="signup-field">
        <label htmlFor="signup-name">Seu nome</label>
        <input id="signup-name" value={form.name} onChange={set('name')} required />
      </div>
      <div className="signup-field">
        <label htmlFor="signup-email">Seu email</label>
        <input id="signup-email" type="email" value={form.email} onChange={set('email')} required />
      </div>
      <div className="signup-field">
        <label htmlFor="signup-password">Crie uma senha</label>
        <input id="signup-password" type="password" minLength={8} value={form.password} onChange={set('password')} required />
      </div>

      <div className="signup-field">
        <label>Forma de pagamento</label>
        <div className="signup-payment-toggle">
          <button type="button" className={`signup-toggle-btn${form.paymentMethod === 'PIX' ? ' active' : ''}`} onClick={() => setForm(f => ({ ...f, paymentMethod: 'PIX' }))}>
            PIX
          </button>
          <button type="button" className={`signup-toggle-btn${form.paymentMethod === 'CARD' ? ' active' : ''}`} onClick={() => setForm(f => ({ ...f, paymentMethod: 'CARD' }))}>
            Cartão (mensalidade automática)
          </button>
        </div>
        {form.paymentMethod === 'CARD' && (
          <p className="signup-hint">Assinatura recorrente: cobra a implantação e a mensalidade nesse cartão, e renova sozinha todo mês.</p>
        )}
      </div>

      {form.paymentMethod === 'CARD' && <CardFields card={card} onChange={setCard} />}

      {error && <p className="signup-error">{error}</p>}

      <button className="btn btn-primary btn-big signup-submit" type="submit" disabled={submitting}>
        {submitting ? 'Criando...' : 'Continuar para o pagamento 🚀'}
      </button>
      <p className="signup-alt">
        Prefere falar com a gente antes? <a href={WHATSAPP} target="_blank" rel="noreferrer">Chama no WhatsApp</a>
      </p>
    </form>
  )
}

function PaymentStep({ signup }) {
  const [status, setStatus] = useState('PENDING_PAYMENT')
  const pollRef = useRef(null)

  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetch(`${API}/signup/${signup.subscriptionId}/status`)
        .then(r => r.json())
        .then(d => setStatus(d.status))
        .catch(() => {})
    }, 3000)
    return () => clearInterval(pollRef.current)
  }, [signup.subscriptionId])

  if (status === 'ACTIVE') return null // App troca pra SuccessStep

  return (
    <div className="signup-payment">
      <h3>Falta só o pagamento</h3>
      <p className="signup-sub">
        R$ {signup.setupFee} de implantação (única vez). Assim que confirmar, sua loja vai pro ar sozinha.
      </p>
      {signup.payment?.qrCode ? (
        <>
          <div className="signup-qr-placeholder">Escaneie o QR code no seu banco</div>
          <textarea className="signup-copypaste" readOnly value={signup.payment.qrCode} onFocus={(e) => e.target.select()} />
        </>
      ) : (
        <p className="signup-error">
          Não conseguimos gerar o PIX agora. {signup.payment?.error || 'Tente novamente em instantes.'}
          {' '}Se persistir, <a href={WHATSAPP} target="_blank" rel="noreferrer">fala com a gente no WhatsApp</a>.
        </p>
      )}
      <p className="signup-waiting">
        <span className="signup-spinner" aria-hidden="true" /> Aguardando confirmação do pagamento...
      </p>
    </div>
  )
}

function SuccessStep({ signup }) {
  const storeUrl = `https://${STORE_BASE_DOMAIN}/${signup.slug}`
  return (
    <div className="signup-success">
      <div className="signup-success-emoji">🎉</div>
      <h3>Sua loja está no ar!</h3>
      <p className="signup-sub">{storeUrl}</p>
      <a className="btn btn-primary btn-big" href={storeUrl} target="_blank" rel="noreferrer">
        Ir para minha loja
      </a>
    </div>
  )
}

export default function SignupModal({ open, onClose }) {
  const [step, setStep] = useState('form')
  const [signup, setSignup] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { getPaymentToken } = useCardTokenization()

  useEffect(() => {
    if (!open) { setStep('form'); setSignup(null); setError(null) }
  }, [open])

  useEffect(() => {
    if (step === 'payment' && signup) {
      const t = setInterval(() => {
        fetch(`${API}/signup/${signup.subscriptionId}/status`)
          .then(r => r.json())
          .then(d => {
            if (d.status === 'ACTIVE') {
              clearInterval(t)
              trackFunnel('signup_paid', signup.slug)
              trackFunnel('signup_provisioned', signup.slug)
              setStep('success')
            }
          })
          .catch(() => {})
      }, 3000)
      return () => clearInterval(t)
    }
  }, [step, signup])

  if (!open) return null

  async function handleSubmit(form, card) {
    setSubmitting(true)
    setError(null)
    try {
      const payload = { email: form.email, password: form.password, name: form.name, storeName: form.storeName, slug: form.slug }

      if (form.paymentMethod === 'CARD') {
        let paymentToken
        try {
          paymentToken = await getPaymentToken({ ...card, brand: detectBrand(card.number) })
        } catch (tokenErr) {
          setError(tokenErr.message || 'Não foi possível processar o cartão. Confira os dados e tente de novo.')
          return
        }
        payload.paymentMethod = 'CARD'
        payload.paymentToken = paymentToken
        payload.cpf = card.cpf
        payload.birth = card.birth
        payload.billingAddress = {
          zipcode: card.zipcode, street: card.street, number: card.number_addr,
          neighborhood: card.neighborhood, city: card.city, state: card.state,
        }
      }

      const res = await fetch(`${API}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Não foi possível criar sua conta.'); return }
      trackFunnel('signup_started', data.slug)

      // Cartão confirma na hora (sem QR pra esperar) — se deu certo, a loja
      // já está no ar; se falhou, mostra o erro sem avançar de tela.
      if (form.paymentMethod === 'CARD') {
        if (!data.payment.ok) {
          setError(data.payment.error || 'Cartão recusado. Confira os dados e tente de novo.')
          return
        }
        setSignup(data)
        trackFunnel('signup_paid', data.slug)
        trackFunnel('signup_provisioned', data.slug)
        setStep('success')
        return
      }

      setSignup(data)
      setStep('payment')
    } catch {
      setError('Falha de conexão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="signup-overlay" onClick={onClose}>
      <div className="signup-modal" onClick={(e) => e.stopPropagation()}>
        <button className="signup-close" onClick={onClose} aria-label="Fechar">×</button>
        {step === 'form' && <FormStep onSubmit={handleSubmit} submitting={submitting} error={error} />}
        {step === 'payment' && signup && <PaymentStep signup={signup} />}
        {step === 'success' && signup && <SuccessStep signup={signup} />}
      </div>
    </div>
  )
}
