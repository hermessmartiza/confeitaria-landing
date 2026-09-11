import { useEffect, useRef, useState } from 'react'

export const API = import.meta.env.VITE_API_URL || 'https://confeitaria.smartiza.com.br/api'
const GOOGLE_ADS_CONVERSION = 'AW-310946501/2SxkCIr-g_AcEMXVopQB'

export const moeda = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`

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

// Conversão do Google Ads: só deve ser chamada depois que o backend confirmar
// o pagamento e ativar a loja. O transaction_id evita contar duas vezes se o
// React remontar a tela ou se o usuário repetir uma renderização.
export function trackGoogleAdsConversion({ value = 1.0, currency = 'BRL', transactionId } = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return

  const dedupeKey = `confeitto_google_ads_conversion:${transactionId || 'signup'}`
  try {
    if (window.sessionStorage.getItem(dedupeKey)) return
    window.sessionStorage.setItem(dedupeKey, '1')
  } catch {
    // O evento ainda pode ser enviado se o navegador bloquear o storage.
  }

  window.gtag('event', 'conversion', {
    send_to: GOOGLE_ADS_CONVERSION,
    value,
    currency,
    ...(transactionId ? { transaction_id: transactionId } : {}),
  })
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
}

export function useSlugCheck(slug) {
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
// SDK oficial "payment-token-efi" (pacote npm, global window.EfiPay) — a API
// antiga "$gn.ready"/URL dinâmica por payeeCode (domínio gerencianet.com.br)
// não existe mais: o domínio hoje redireciona pra sejaefi.com.br e aquele
// endpoint devolve 404 (confirmado em 28/07/2026, é isso que causava "falha
// ao carregar SDK de pagamento"). Trocado pelo script estático da CDN +
// EfiPay.CreditCard.setAccount/setEnvironment/setCreditCardData/getPaymentToken,
// que é o que a lib de verdade expõe (conferido no arquivo publicado, não só
// na documentação). Versão fixada (não "latest") pra não quebrar sozinho se a
// Efí publicar uma versão nova incompatível.
const EFI_SDK_URL = 'https://cdn.jsdelivr.net/npm/payment-token-efi@3.4.1/dist/payment-token-efi-umd.min.js'

function loadEfiScript() {
  return new Promise((resolve, reject) => {
    if (window.EfiPay) return resolve(window.EfiPay)
    const existing = document.getElementById('efi-tokenization-sdk')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.EfiPay))
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar o SDK de pagamento')))
      return
    }
    const script = document.createElement('script')
    script.id = 'efi-tokenization-sdk'
    script.src = EFI_SDK_URL
    script.onload = () => resolve(window.EfiPay)
    script.onerror = () => reject(new Error('Falha ao carregar o SDK de pagamento'))
    document.head.appendChild(script)
  })
}

export function useCardTokenization() {
  const [efiConfig, setEfiConfig] = useState(null)
  useEffect(() => {
    fetch(`${API}/signup/efi-public-config`).then(r => r.json()).then(setEfiConfig).catch(() => {})
  }, [])

  // reuse:true só faz sentido pra quem vai ser cobrado de novo sem o cliente
  // presente (a mensalidade, meses seguintes). A implantação é cobrada uma
  // vez só — usar reuse:true nela também não teria motivo, e evita qualquer
  // acoplamento entre as duas cobranças na Efí (30/07/2026: cada token é
  // dedicado à cobrança que ele serve).
  async function getPaymentToken(card, { reuse } = { reuse: false }) {
    if (!efiConfig?.payeeCode) throw new Error('Configuração de pagamento indisponível — tente novamente em instantes.')
    const EfiPay = await loadEfiScript()
    try {
      const result = await EfiPay.CreditCard
        .setAccount(efiConfig.payeeCode)
        .setEnvironment(efiConfig.sandbox ? 'sandbox' : 'production')
        .setCreditCardData({
          brand: card.brand,
          number: card.number.replace(/\D/g, ''),
          cvv: card.cvv,
          expirationMonth: card.expirationMonth,
          expirationYear: card.expirationYear,
          reuse,
        })
        .getPaymentToken()

      // O SDK nem sempre rejeita a promessa quando falha — já devolveu objeto
      // sem token válido, e a gente repassava isso pra Efí, que respondia com
      // o regex cru ("A string não corresponde ao modelo ^[a-fA-F0-9]{40}$").
      // O cliente via uma mensagem sem sentido nenhum (caso real, 29/07/2026).
      const token = result?.payment_token
      if (!token || !/^[a-fA-F0-9]{40}$/.test(token)) {
        console.error('[efi] token inesperado do SDK:', typeof token, token ? `len=${String(token).length}` : 'ausente', result)
        throw new Error('Não conseguimos validar seu cartão. Confira número, validade e CVV, e tente de novo.')
      }
      return token
    } catch (err) {
      throw new Error(err?.error_description || 'Cartão recusado. Confira os dados e tente de novo.')
    }
  }

  return { getPaymentToken, ready: !!efiConfig }
}

export function detectBrand(number) {
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

export function SlugField({ slug, onChange }) {
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

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export const soDigitos = (v) => String(v || '').replace(/\D/g, '')

const mascaraCartao = (v) => soDigitos(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ').trim()
const mascaraCpf = (v) => {
  const d = soDigitos(v).slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}
const mascaraCep = (v) => {
  const d = soDigitos(v).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

/** CPF de verdade: confere os dois dígitos verificadores. Pega "111.111.111-11"
 *  e qualquer sequência inventada, que só a contagem de 11 dígitos deixava passar. */
function cpfValido(valor) {
  const cpf = soDigitos(valor)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i)
  let d1 = (soma * 10) % 11
  if (d1 === 10) d1 = 0
  if (d1 !== Number(cpf[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i)
  let d2 = (soma * 10) % 11
  if (d2 === 10) d2 = 0
  return d2 === Number(cpf[10])
}

/** Luhn — o mesmo algoritmo que a bandeira usa. Descarta número digitado errado
 *  antes de gastar uma tentativa no gateway. */
function cartaoValido(valor) {
  const n = soDigitos(valor)
  if (n.length < 13 || n.length > 19) return false
  let soma = 0, dobra = false
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i])
    if (dobra) { d *= 2; if (d > 9) d -= 9 }
    soma += d
    dobra = !dobra
  }
  return soma % 10 === 0
}

export function CardFields({ card, onChange, erros = {} }) {
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erroCep, setErroCep] = useState(null)
  const set = (key, transform) => (e) => onChange({ ...card, [key]: transform ? transform(e.target.value) : e.target.value })

  // ViaCEP preenche rua, bairro, cidade e UF. Além de poupar digitação, é o que
  // impede endereço inventado: os campos vêm da base dos Correios, não do
  // que a pessoa resolveu escrever.
  async function buscarCep(valor) {
    const cep = soDigitos(valor)
    if (cep.length !== 8) return
    setBuscandoCep(true)
    setErroCep(null)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = await r.json()
      if (d.erro) { setErroCep('CEP não encontrado. Confira o número.'); return }
      onChange({
        ...card,
        zipcode: mascaraCep(cep),
        street: d.logradouro || card.street,
        neighborhood: d.bairro || card.neighborhood,
        city: d.localidade || '',
        state: d.uf || '',
      })
    } catch {
      // Sem internet ou ViaCEP fora do ar: libera o preenchimento manual em vez
      // de travar a venda.
      setErroCep('Não foi possível buscar o CEP. Preencha o endereço manualmente.')
    } finally {
      setBuscandoCep(false)
    }
  }

  const cepCompleto = soDigitos(card.zipcode).length === 8
  const autoPreenchido = cepCompleto && card.city && card.state && !erroCep

  return (
    <div className="signup-card-fields">
      <div className="signup-field">
        <label htmlFor="card-number">Número do cartão</label>
        <input id="card-number" inputMode="numeric" autoComplete="cc-number" value={card.number}
          onChange={set('number', mascaraCartao)} placeholder="0000 0000 0000 0000" required />
        {erros.number && <p className="signup-hint signup-hint-bad">{erros.number}</p>}
      </div>
      <div className="signup-field-row">
        <div className="signup-field">
          <label htmlFor="card-expmonth">Validade (mês)</label>
          <input id="card-expmonth" inputMode="numeric" autoComplete="cc-exp-month" maxLength={2} value={card.expirationMonth}
            onChange={set('expirationMonth', (v) => soDigitos(v).slice(0, 2))} placeholder="MM" required />
        </div>
        <div className="signup-field">
          <label htmlFor="card-expyear">Validade (ano)</label>
          <input id="card-expyear" inputMode="numeric" autoComplete="cc-exp-year" maxLength={4} value={card.expirationYear}
            onChange={set('expirationYear', (v) => soDigitos(v).slice(0, 4))} placeholder="AAAA" required />
        </div>
        <div className="signup-field">
          <label htmlFor="card-cvv">CVV</label>
          <input id="card-cvv" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={card.cvv}
            onChange={set('cvv', (v) => soDigitos(v).slice(0, 4))} placeholder="123" required />
        </div>
      </div>
      {erros.validade && <p className="signup-hint signup-hint-bad">{erros.validade}</p>}

      <div className="signup-field">
        <label htmlFor="card-cpf">CPF do titular</label>
        <input id="card-cpf" inputMode="numeric" value={card.cpf} onChange={set('cpf', mascaraCpf)} placeholder="000.000.000-00" required />
        {erros.cpf && <p className="signup-hint signup-hint-bad">{erros.cpf}</p>}
      </div>
      <div className="signup-field">
        <label htmlFor="card-birth">Data de nascimento do titular</label>
        <input id="card-birth" type="date" max={new Date().toISOString().slice(0, 10)} value={card.birth} onChange={set('birth')} required />
        {erros.birth && <p className="signup-hint signup-hint-bad">{erros.birth}</p>}
      </div>

      <p className="signup-sub" style={{ marginTop: '4px' }}>Endereço de cobrança</p>
      <div className="signup-field-row">
        <div className="signup-field">
          <label htmlFor="card-cep">CEP</label>
          <input id="card-cep" inputMode="numeric" autoComplete="postal-code" value={card.zipcode}
            onChange={(e) => { const v = mascaraCep(e.target.value); onChange({ ...card, zipcode: v }); if (soDigitos(v).length === 8) buscarCep(v) }}
            onBlur={(e) => buscarCep(e.target.value)} placeholder="00000-000" required />
          {buscandoCep && <p className="signup-hint">buscando endereço...</p>}
          {erroCep && <p className="signup-hint signup-hint-bad">{erroCep}</p>}
          {autoPreenchido && <p className="signup-hint signup-hint-ok">✓ endereço encontrado</p>}
        </div>
        <div className="signup-field">
          <label htmlFor="card-street">Rua</label>
          <input id="card-street" value={card.street} onChange={set('street')} required />
        </div>
        <div className="signup-field">
          <label htmlFor="card-number-addr">Número</label>
          <input id="card-number-addr" inputMode="numeric" value={card.number_addr} onChange={set('number_addr')} placeholder="123" required />
        </div>
      </div>
      <div className="signup-field-row">
        <div className="signup-field">
          <label htmlFor="card-neighborhood">Bairro</label>
          <input id="card-neighborhood" value={card.neighborhood} onChange={set('neighborhood')} required />
        </div>
        <div className="signup-field">
          <label htmlFor="card-city">Cidade</label>
          {/* Vem do CEP; só libera digitação se o ViaCEP não respondeu */}
          <input id="card-city" value={card.city} onChange={set('city')} readOnly={autoPreenchido} required />
        </div>
        <div className="signup-field">
          <label htmlFor="card-state">UF</label>
          {/* Lista fechada: sem campo livre, não existe UF inventada */}
          <select id="card-state" value={card.state} onChange={set('state')} required>
            <option value="">--</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
      </div>
      {erros.endereco && <p className="signup-hint signup-hint-bad">{erros.endereco}</p>}
    </div>
  )
}

const EMPTY_CARD = {
  number: '', expirationMonth: '', expirationYear: '', cvv: '', cpf: '', birth: '',
  zipcode: '', street: '', number_addr: '', neighborhood: '', city: '', state: '',
}

/** Registra/atualiza o lead. Silencioso de propósito: se falhar, o funil segue. */
export function registrarLead(payload) {
  return fetch(`${API}/signup/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

const PASSOS = ['Conta', 'Loja', 'Pagamento']

// ─── Nota ────────────────────────────────────────────────────────────────────
// O modal de cadastro que vivia aqui foi substituído pela tela /criar
// (SignupPage.jsx). Este arquivo virou a casa da lógica compartilhada:
// tokenização de cartão, máscaras, validações de cartão/CPF/CEP, checagem de
// slug e registro de lead. Nada aqui renderiza o fluxo — só o alimenta.
