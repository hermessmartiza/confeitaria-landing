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

function FormStep({ onSubmit, submitting, error }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', storeName: '', slug: '' })

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
      onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
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

  async function handleSubmit(form) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Não foi possível criar sua conta.'); return }
      trackFunnel('signup_started', data.slug)
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
