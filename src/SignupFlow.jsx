import { useEffect, useRef, useState } from 'react'
import PreviewLoja from './PreviewLoja'

const API = import.meta.env.VITE_API_URL || 'https://confeitaria.smartiza.com.br/api'
const WHATSAPP = 'https://wa.me/554197601739'

const moeda = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`

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

function useCardTokenization() {
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

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const soDigitos = (v) => String(v || '').replace(/\D/g, '')

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

function CardFields({ card, onChange, erros = {} }) {
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
function registrarLead(payload) {
  return fetch(`${API}/signup/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

const PASSOS = ['Conta', 'Loja', 'Pagamento']

function Stepper({ atual }) {
  return (
    <ol className="signup-stepper" aria-label={`Passo ${atual + 1} de ${PASSOS.length}`}>
      {PASSOS.map((label, i) => (
        <li
          key={label}
          className={`signup-step${i === atual ? ' active' : ''}${i < atual ? ' done' : ''}`}
          aria-current={i === atual ? 'step' : undefined}
        >
          <span className="signup-step-dot">{i < atual ? '✓' : i + 1}</span>
          <span className="signup-step-label">{label}</span>
        </li>
      ))}
    </ol>
  )
}

// Checkout em 3 passos em vez de uma tela só com 15 campos (incluindo cartão),
// que afundava a conversão. O 1º passo registra o lead ANTES do pagamento —
// quem desiste no meio vira contato em vez de sumir sem deixar rastro.
function FormStep({ onSubmit, submitting, error, presetStore }) {
  const [passo, setPasso] = useState(0)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    storeName: presetStore?.name || '', slug: presetStore?.slug || '',
    paymentMethod: 'CARD', marketingConsent: false,
    brandColor: '', logoUrl: '', couponCode: '',
  })
  // Só entra em form.couponCode depois que o backend validou — nunca mandamos
  // código digitado direto, senão o signup falha lá na frente com o cartão já
  // tokenizado.
  const [cupom, setCupom] = useState('')
  const [cupomInfo, setCupomInfo] = useState(null)
  const [cupomErro, setCupomErro] = useState(null)
  const [cupomCarregando, setCupomCarregando] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState(null)
  // Plano padrão só pra MOSTRAR os valores e o desconto do PIX — quem decide
  // o preço cobrado é o backend, isto aqui é vitrine.
  const [plano, setPlano] = useState(null)

  useEffect(() => {
    fetch(`${API}/signup/plans`)
      .then((r) => r.json())
      .then((planos) => setPlano(planos.find((p) => p.isDefault) || planos[0] || null))
      .catch(() => {})
  }, [])

  async function aplicarCupom() {
    const code = cupom.trim()
    if (!code) return
    setCupomCarregando(true)
    setCupomErro(null)
    try {
      const qs = new URLSearchParams({ code, ...(plano ? { planId: plano.id } : {}) })
      const r = await fetch(`${API}/signup/validate-coupon?${qs}`)
      const body = await r.json()
      if (!r.ok) {
        setCupomInfo(null)
        setForm((f) => ({ ...f, couponCode: '' }))
        setCupomErro(body?.error || 'Cupom inválido')
        return
      }
      setCupomInfo(body)
      setForm((f) => ({ ...f, couponCode: body.code }))
    } catch {
      setCupomErro('Não foi possível validar o cupom agora. Tente de novo.')
    } finally {
      setCupomCarregando(false)
    }
  }

  function removerCupom() {
    setCupom('')
    setCupomInfo(null)
    setCupomErro(null)
    setForm((f) => ({ ...f, couponCode: '' }))
  }

  // Cupom e desconto do PIX ACUMULAM: o cupom abate o valor fixo primeiro e o
  // percentual do PIX incide sobre o que sobrou. Quando há cupom validado os
  // números vêm prontos do backend — aqui não se recalcula nada, só exibe.
  const setupCartao = cupomInfo ? cupomInfo.setupFeeComCupom : plano?.setupFee
  const setupPix = cupomInfo
    ? cupomInfo.setupFeeCupomMaisPix
    : (plano ? plano.setupFee * (1 - (plano.pixDiscountPercent || 0) / 100) : null)

  async function onLogoSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError(null)
    setLogoUploading(true)
    try {
      const body = new FormData()
      body.append('logo', file)
      const r = await fetch(`${API}/signup/logo`, { method: 'POST', body })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Falha ao enviar a logo')
      setForm((f) => ({ ...f, logoUrl: data.url }))
    } catch (err) {
      setLogoError(err.message)
    } finally {
      setLogoUploading(false)
    }
  }
  const [card, setCard] = useState(EMPTY_CARD)
  const [erroPasso, setErroPasso] = useState(null)
  const [errosCartao, setErrosCartao] = useState({})
  const slugStatus = useSlugCheck(form.slug)

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => {
      const next = { ...f, [key]: value }
      if (key === 'storeName' && !f.slugTouched) next.slug = slugify(value)
      return next
    })
  }

  function avancarDaConta(e) {
    e.preventDefault()
    setErroPasso(null)
    if (form.password.length < 8) return setErroPasso('A senha precisa de ao menos 8 caracteres.')
    // Lead gravado aqui: a partir deste ponto a pessoa não se perde mais.
    registrarLead({ email: form.email, marketingConsent: form.marketingConsent, step: 'conta' })
    trackFunnel('signup_step_conta')
    // Conversão de loja de apresentação: nome/slug já existem (a loja já está
    // no ar) — pula direto pro pagamento, sem passar pelo passo "Loja".
    if (presetStore) {
      if (!form.name || !form.phone) return setErroPasso('Preencha seu nome e WhatsApp.')
      setPasso(2)
      return
    }
    setPasso(1)
  }

  function avancarDaLoja(e) {
    e.preventDefault()
    setErroPasso(null)
    // useSlugCheck devolve 'available', 'checking', null, ou a mensagem de erro
    // vinda do backend (slug reservado/inválido) — qualquer outra coisa barra.
    if (slugStatus === 'checking') return setErroPasso('Verificando o endereço, aguarde um instante.')
    if (slugStatus && slugStatus !== 'available') {
      return setErroPasso(slugStatus === 'taken' ? 'Esse endereço já está em uso. Escolha outro.' : String(slugStatus))
    }
    if (!form.slug || form.slug.length < 3) return setErroPasso('Escolha o endereço da sua loja.')
    // A Efí exige nome e sobrenome do titular. Sem esta checagem aqui, a pessoa
    // só descobria depois de preencher o cartão inteiro e clicar em pagar —
    // aconteceu com um cliente real em 29/07/2026.
    if (!/\S+\s+\S+/.test(form.name.trim())) {
      return setErroPasso('Informe seu nome completo (nome e sobrenome) — é o titular do cartão.')
    }
    if (/\d/.test(form.name)) return setErroPasso('O nome não deve conter números.')
    // DDD + 8 ou 9 dígitos. Barra o "asqwe2313" que chegou de um cadastro real.
    const tel = soDigitos(form.phone)
    if (tel.length < 10 || tel.length > 11) return setErroPasso('WhatsApp inválido. Use DDD + número, ex: (41) 99999-9999.')
    if (/^(\d)\1+$/.test(tel)) return setErroPasso('WhatsApp inválido.')
    registrarLead({
      email: form.email, marketingConsent: form.marketingConsent, step: 'loja',
      name: form.name, phone: form.phone, storeName: form.storeName, slug: form.slug,
    })
    trackFunnel('signup_step_loja')
    setPasso(2)
  }

  // Cada erro barrado aqui é uma tentativa a menos queimada no gateway — e uma
  // mensagem clara em vez do erro cru da Efí.
  function validarCartao() {
    const e = {}
    if (!cartaoValido(card.number)) e.number = 'Número de cartão inválido. Confira os dígitos.'
    const mes = Number(card.expirationMonth)
    const ano = Number(card.expirationYear)
    const agora = new Date()
    if (!(mes >= 1 && mes <= 12)) e.validade = 'Mês de validade inválido (use 01 a 12).'
    else if (!(ano >= agora.getFullYear() && ano <= agora.getFullYear() + 25)) e.validade = 'Ano de validade inválido.'
    else if (ano === agora.getFullYear() && mes < agora.getMonth() + 1) e.validade = 'Este cartão já venceu.'
    if (card.cvv.length < 3) e.validade = e.validade || 'CVV incompleto.'
    if (!cpfValido(card.cpf)) e.cpf = 'CPF inválido. Confira os números.'
    if (!card.birth) e.birth = 'Informe a data de nascimento.'
    else {
      const idade = (Date.now() - new Date(card.birth).getTime()) / (365.25 * 24 * 3600 * 1000)
      if (idade < 18) e.birth = 'O titular do cartão precisa ter 18 anos ou mais.'
      if (idade > 120) e.birth = 'Data de nascimento inválida.'
    }
    if (soDigitos(card.zipcode).length !== 8) e.endereco = 'CEP incompleto.'
    else if (!card.street || !card.neighborhood || !card.city || !card.state) e.endereco = 'Complete o endereço de cobrança.'
    else if (!card.number_addr) e.endereco = 'Informe o número do endereço.'
    return e
  }

  function enviar(e) {
    e.preventDefault()
    const erros = validarCartao()
    setErrosCartao(erros)
    if (Object.keys(erros).length > 0) return

    registrarLead({
      email: form.email, marketingConsent: form.marketingConsent, step: 'pagamento',
      name: form.name, phone: form.phone, storeName: form.storeName, slug: form.slug,
    })
    onSubmit(form, card)
  }

  // Em conversão de loja de apresentação o passo "Loja" (1) não existe —
  // voltar do pagamento (2) tem que cair direto na conta (0), não nele.
  const voltar = () => { setErroPasso(null); setPasso((p) => (presetStore && p === 2 ? 0 : p - 1)) }

  return (
    <div className="signup-wizard">
      <h3>Vamos criar sua loja</h3>
      <p className="signup-sub">Leva 2 minutos. Sua loja fica no ar assim que o pagamento confirmar.</p>

      <Stepper atual={passo} />

      {passo === 0 && (
        <form className="signup-form" onSubmit={avancarDaConta}>
          {presetStore && (
            <p className="signup-hint" style={{ marginBottom: 16 }}>
              Ativando a versão completa de <strong>{presetStore.name}</strong> ({presetStore.slug}).
            </p>
          )}
          <div className="signup-field">
            <label htmlFor="signup-email">Seu email</label>
            <input id="signup-email" type="email" value={form.email} onChange={set('email')} autoFocus required />
          </div>
          <div className="signup-field">
            <label htmlFor="signup-password">Crie uma senha</label>
            <input id="signup-password" type="password" minLength={8} value={form.password} onChange={set('password')} required />
            <p className="signup-hint">Mínimo de 8 caracteres. É com ela que você entra no painel da sua loja.</p>
          </div>

          {presetStore && (
            <>
              <div className="signup-field">
                <label htmlFor="signup-name">Seu nome completo</label>
                <input id="signup-name" value={form.name} onChange={set('name')} placeholder="Nome e sobrenome" required />
              </div>
              <div className="signup-field">
                <label htmlFor="signup-phone">Seu WhatsApp (com DDD)</label>
                <input id="signup-phone" type="tel" inputMode="numeric" autoComplete="tel" value={form.phone}
                  onChange={(e) => {
                    const d = soDigitos(e.target.value).slice(0, 11)
                    const fmt = d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
                      : d.length > 6 ? d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
                      : d.length > 2 ? d.replace(/(\d{2})(\d*)/, '($1) $2') : d
                    setForm((f) => ({ ...f, phone: fmt }))
                  }}
                  placeholder="(41) 99999-9999" required />
              </div>
            </>
          )}

          <label className="signup-check">
            <input type="checkbox" checked={form.marketingConsent} onChange={set('marketingConsent')} />
            <span>Quero receber novidades, dicas de vendas e ofertas por email.</span>
          </label>

          {erroPasso && <p className="signup-error">{erroPasso}</p>}

          <button className="btn btn-primary btn-big signup-submit" type="submit">Continuar</button>
          <p className="signup-alt">
            Prefere falar com a gente antes? <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">Chama no WhatsApp</a>
          </p>
        </form>
      )}

      {passo === 1 && (
        <div className="signup-com-preview">
        <form className="signup-form" onSubmit={avancarDaLoja}>
          <div className="signup-field">
            <label htmlFor="signup-storeName">Nome da confeitaria</label>
            <input id="signup-storeName" value={form.storeName} onChange={set('storeName')} placeholder="Ex: Doce Encanto" autoFocus required />
          </div>

          <SlugField slug={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v, slugTouched: true }))} />

          <div className="signup-field">
            <label htmlFor="signup-name">Seu nome completo</label>
            <input id="signup-name" value={form.name} onChange={set('name')} placeholder="Nome e sobrenome" required />
          </div>
          <div className="signup-field">
            <label htmlFor="signup-phone">Seu WhatsApp (com DDD)</label>
            <input id="signup-phone" type="tel" inputMode="numeric" autoComplete="tel" value={form.phone}
              onChange={(e) => {
                const d = soDigitos(e.target.value).slice(0, 11)
                const fmt = d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
                  : d.length > 6 ? d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
                  : d.length > 2 ? d.replace(/(\d{2})(\d*)/, '($1) $2') : d
                setForm((f) => ({ ...f, phone: fmt }))
              }}
              placeholder="(41) 99999-9999" required />
          </div>

          <div className="signup-field">
            <label htmlFor="signup-brandColor">Cor da sua marca <span className="signup-optional">(opcional)</span></label>
            <div className="signup-color-row">
              <input id="signup-brandColor" type="color"
                value={form.brandColor || '#b84a5a'}
                onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))} />
              {form.brandColor && (
                <button type="button" className="signup-color-clear" onClick={() => setForm((f) => ({ ...f, brandColor: '' }))}>
                  Usar cor padrão
                </button>
              )}
            </div>
            <p className="signup-hint">Não precisa escolher agora — dá pra mudar depois no painel.</p>
          </div>

          <div className="signup-field">
            <label htmlFor="signup-logo">Logo da sua confeitaria <span className="signup-optional">(opcional)</span></label>
            <input id="signup-logo" type="file" accept="image/*" onChange={onLogoSelected} disabled={logoUploading} />
            {logoUploading && <p className="signup-hint">Enviando...</p>}
            {form.logoUrl && !logoUploading && (
              <div className="signup-logo-preview">
                <img src={form.logoUrl} alt="Prévia da logo" />
                <span>Logo enviada ✓</span>
              </div>
            )}
            {logoError && <p className="signup-error">{logoError}</p>}
            <p className="signup-hint">Também dá pra subir depois, direto no painel.</p>
          </div>

          {erroPasso && <p className="signup-error">{erroPasso}</p>}

          <div className="signup-nav">
            <button className="btn btn-ghost" type="button" onClick={voltar}>Voltar</button>
            <button className="btn btn-primary" type="submit">Continuar</button>
          </div>
        </form>
        <PreviewLoja nome={form.storeName} brandColor={form.brandColor} logoUrl={form.logoUrl} slug={form.slug} />
        </div>
      )}

      {passo === 2 && (
        <form className="signup-form" onSubmit={enviar}>
          <div className="signup-field">
            <label>Cupom de desconto (opcional)</label>
            {cupomInfo ? (
              <div className="signup-cupom-ok">
                <span><strong>{cupomInfo.code}</strong> — {moeda(cupomInfo.discountAmount)} de desconto na implantação</span>
                <button type="button" className="signup-cupom-remove" onClick={removerCupom}>remover</button>
              </div>
            ) : (
              <div className="signup-cupom-row">
                <input
                  value={cupom}
                  onChange={(e) => setCupom(e.target.value.toUpperCase())}
                  placeholder="Digite o código"
                  autoComplete="off"
                />
                <button type="button" className="signup-cupom-btn" onClick={aplicarCupom} disabled={cupomCarregando || !cupom.trim()}>
                  {cupomCarregando ? 'Validando...' : 'Aplicar'}
                </button>
              </div>
            )}
            {cupomErro && <p className="signup-cupom-erro">{cupomErro}</p>}
            {cupomInfo && (
              <p className="signup-hint">
                De {moeda(cupomInfo.setupFee)} por {moeda(cupomInfo.setupFeeComCupom)}
                {cupomInfo.pixDiscountPercent > 0 && ` — ou ${moeda(cupomInfo.setupFeeCupomMaisPix)} pagando no PIX, somando os ${cupomInfo.pixDiscountPercent}% de desconto`}.
              </p>
            )}
          </div>

          <div className="signup-field">
            <label>Como quer pagar a implantação?</label>
            <div className="signup-paymethods">
              <button type="button"
                className={`signup-paymethod${form.paymentMethod === 'CARD' ? ' ativo' : ''}`}
                onClick={() => setForm((f) => ({ ...f, paymentMethod: 'CARD' }))}>
                <strong>💳 Cartão</strong>
                {plano && (
                  cupomInfo
                    ? <span>{moeda(setupCartao)} <em>cupom</em></span>
                    : <span>{moeda(plano.setupFee)}</span>
                )}
              </button>
              <button type="button"
                className={`signup-paymethod${form.paymentMethod === 'PIX' ? ' ativo' : ''}`}
                onClick={() => setForm((f) => ({ ...f, paymentMethod: 'PIX' }))}>
                <strong>⚡ PIX</strong>
                {plano && (
                  plano.pixDiscountPercent > 0 || cupomInfo
                    ? <span>{moeda(setupPix)} {plano.pixDiscountPercent > 0 && <em>{plano.pixDiscountPercent}% off{cupomInfo ? ' + cupom' : ''}</em>}</span>
                    : <span>{moeda(plano.setupFee)}</span>
                )}
              </button>
            </div>
            <p className="signup-hint">
              {form.paymentMethod === 'PIX'
                ? 'Você paga a implantação por PIX e sua loja entra no ar assim que o pagamento cair.'
                : 'A implantação é cobrada agora no cartão.'}
              {' '}A mensalidade{plano ? ` de ${moeda(plano.monthlyFee)}` : ''} é sempre no cartão de crédito, renovando sozinha todo mês — por isso pedimos os dados do cartão abaixo nos dois casos.
            </p>
          </div>

          <CardFields card={card} onChange={setCard} erros={errosCartao} />

          {error && <p className="signup-error">{error}</p>}

          <div className="signup-nav">
            <button className="btn btn-ghost" type="button" onClick={voltar} disabled={submitting}>Voltar</button>
            <button className="btn btn-primary btn-big signup-submit" type="submit" disabled={submitting}>
              {submitting ? 'Criando...' : 'Finalizar e criar minha loja 🚀'}
            </button>
          </div>
        </form>
      )}
    </div>
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
          <p className="signup-qr-label">Escaneie o QR code no seu banco</p>
          <img className="signup-qr-image" src={signup.payment.qrCode} alt="QR code do PIX" />
          <textarea className="signup-copypaste" readOnly value={signup.payment.pixCopyPaste || ''} onFocus={(e) => e.target.select()} />
        </>
      ) : (
        <p className="signup-error">
          Não conseguimos gerar o PIX agora. {signup.payment?.error || 'Tente novamente em instantes.'}
          {' '}Se persistir, <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">fala com a gente no WhatsApp</a>.
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
      <a className="btn btn-primary btn-big" href={storeUrl} target="_blank" rel="noopener noreferrer">
        Ir para minha loja
      </a>
    </div>
  )
}

export default function SignupModal({ open, onClose, presetStore }) {
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
      const payload = {
        email: form.email, password: form.password, name: form.name, phone: form.phone, storeName: form.storeName, slug: form.slug,
        ...(form.brandColor ? { brandColor: form.brandColor } : {}),
        ...(form.logoUrl ? { logoUrl: form.logoUrl } : {}),
        ...(form.couponCode ? { couponCode: form.couponCode } : {}),
      }

      // O cartão é tokenizado nos DOIS caminhos: a implantação pode ir no PIX
      // (com desconto), mas a mensalidade é sempre cartão recorrente. O token
      // reutilizável (reuse:true) é o da assinatura; o de uso único só é
      // gerado quando a implantação também vai no cartão.
      const pagaImplantacaoNoCartao = form.paymentMethod === 'CARD'
      try {
        const cardData = { ...card, brand: detectBrand(card.number) }
        payload.paymentTokenSubscription = await getPaymentToken(cardData, { reuse: true })
        if (pagaImplantacaoNoCartao) {
          payload.paymentToken = await getPaymentToken(cardData, { reuse: false })
        }
      } catch (tokenErr) {
        setError(tokenErr.message || 'Não foi possível processar o cartão. Confira os dados e tente de novo.')
        return
      }
      payload.paymentMethod = pagaImplantacaoNoCartao ? 'CARD' : 'PIX'
      payload.cpf = card.cpf
      payload.birth = card.birth
      payload.billingAddress = {
        zipcode: card.zipcode, street: card.street, number: card.number_addr,
        neighborhood: card.neighborhood, city: card.city, state: card.state,
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
        {step === 'form' && <FormStep onSubmit={handleSubmit} submitting={submitting} error={error} presetStore={presetStore} />}
        {step === 'payment' && signup && <PaymentStep signup={signup} />}
        {step === 'success' && signup && <SuccessStep signup={signup} />}
      </div>
    </div>
  )
}
