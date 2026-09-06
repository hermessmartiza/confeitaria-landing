import { useEffect, useMemo, useRef, useState } from 'react'
import {
  API, moeda, slugify, useSlugCheck, useCardTokenization,
  detectBrand, CardFields, registrarLead, trackFunnel, trackGoogleAdsConversion,
} from './SignupFlow'
import { PERGUNTAS, sugestaoEmail, forcaSenha, soDigitos } from './signupPerguntas'

/**
 * Tela de cadastro (substitui o modal).
 *
 * Uma pergunta por vez, estilo conversa: a pessoa responde e avança com Enter.
 * O modal antigo mostrava 4-5 campos empilhados por passo, o que anunciava o
 * tamanho do formulário antes de a pessoa começar — e formulário longo à vista
 * é o que faz desistir.
 *
 * Cor da marca e logo saíram daqui: são decisões visuais que a pessoa toma
 * melhor DEPOIS, no painel, vendo a loja pronta — e não valem o custo de dois
 * campos antes do pagamento.
 */

// Frases por marco: dão a sensação de progresso sem mentir sobre o que falta.
function recado(pct) {
  if (pct >= 100) return 'Tudo pronto!'
  if (pct >= 75) return 'Quase lá — falta o pagamento.'
  if (pct >= 50) return 'Metade do caminho!'
  if (pct >= 25) return 'Indo bem.'
  return 'Leva menos de 2 minutos.'
}

function Progresso({ etapa, respondidas, perguntas, etapaEndereco, totalEtapas }) {
  const pct = Math.round((etapa / totalEtapas) * 100)
  return (
    <div className="cad-progresso">
      <div className="cad-progresso-topo">
        <span className="cad-progresso-pct">{pct}%</span>
        <span className="cad-progresso-recado">{recado(pct)}</span>
      </div>
      <div className="cad-barra" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="cad-barra-fill" style={{ width: `${pct}%` }} />
      </div>
      <ul className="cad-chips">
        {perguntas.map((p, i) => (
          <li key={p.id} className={`cad-chip${respondidas[p.id] ? ' feito' : ''}${i === etapa ? ' atual' : ''}`}>
            <span className="cad-chip-marca">{respondidas[p.id] ? '✓' : i + 1}</span>
            <span className="cad-chip-texto">{respondidas[p.id] || p.titulo.replace('?', '')}</span>
          </li>
        ))}
        <li className={`cad-chip${etapa >= etapaEndereco ? ' feito' : ''}${etapa === etapaEndereco ? ' atual' : ''}`}>
          <span className="cad-chip-marca">{etapa > etapaEndereco ? '✓' : perguntas.length + 1}</span>
          <span className="cad-chip-texto">Endereço da loja</span>
        </li>
        <li className={`cad-chip${etapa === totalEtapas - 1 ? ' atual' : ''}`}>
          <span className="cad-chip-marca">{totalEtapas}</span>
          <span className="cad-chip-texto">Pagamento</span>
        </li>
      </ul>
    </div>
  )
}

export default function SignupPage() {
  // Conversão de loja de apresentação (?convert=slug): a loja JÁ existe, com
  // nome e endereço definidos. Perguntar de novo faria a pessoa renomear a
  // própria loja sem querer — então essas duas etapas somem.
  const convertSlug = useMemo(
    () => new URLSearchParams(window.location.search).get('convert') || null, [])
  const [lojaExistente, setLojaExistente] = useState(null)

  const [etapa, setEtapa] = useState(0)
  const [respostas, setRespostas] = useState({ email: '', password: '', name: '', phone: '', storeName: '' })
  const [slug, setSlug] = useState('')
  const [slugEditado, setSlugEditado] = useState(false)
  const [erro, setErro] = useState(null)
  // null | 'checando' | 'livre' | 'retomavel' | 'em_uso'
  const [emailStatus, setEmailStatus] = useState(null)
  const [tremendo, setTremendo] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const inputRef = useRef(null)

  // Na conversão, a lista de perguntas para antes do nome da loja.
  const perguntas = lojaExistente ? PERGUNTAS.filter((p) => p.id !== 'storeName') : PERGUNTAS
  const etapaEndereco = perguntas.length
  const etapaPagamento = perguntas.length + (lojaExistente ? 0 : 1)
  const totalEtapas = etapaPagamento + 1

  const pergunta = perguntas[etapa]
  const slugStatus = useSlugCheck(lojaExistente ? '' : slug)

  useEffect(() => {
    if (!convertSlug) return
    fetch(`${API}/signup/check-slug?slug=${encodeURIComponent(convertSlug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.isPresentation) return
        setLojaExistente({ slug: convertSlug, name: d.storeName })
        setSlug(convertSlug)
        setRespostas((r) => ({ ...r, storeName: d.storeName }))
      })
      .catch(() => {})
  }, [convertSlug])

  // Foco automático a cada troca de pergunta: o fluxo é de teclado, a pessoa
  // não deveria precisar clicar no campo.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 260)
    return () => clearTimeout(t)
  }, [etapa])

  // Endereço nasce do nome da loja. Se a pessoa editar, para de seguir o nome —
  // senão a edição dela seria sobrescrita ao voltar e corrigir o nome.
  useEffect(() => {
    if (!slugEditado) setSlug(slugify(respostas.storeName || ''))
  }, [respostas.storeName, slugEditado])

  function valorAtual() {
    return pergunta ? (respostas[pergunta.id] || '') : ''
  }

  // Checa o email na PRIMEIRA pergunta. Antes, quem já tinha conta só descobria
  // no fim, depois de escolher endereço, plano e forma de pagamento — e o erro
  // ainda era um beco sem saída.
  useEffect(() => {
    const email = (respostas.email || '').trim()
    if (pergunta?.id !== 'email' || !email.includes('@') || !email.includes('.')) {
      setEmailStatus(null)
      return
    }
    setEmailStatus('checando')
    const t = setTimeout(() => {
      fetch(`${API}/signup/check-email?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((d) => setEmailStatus(d.status))
        .catch(() => setEmailStatus(null))
    }, 500)
    return () => clearTimeout(t)
  }, [respostas.email, pergunta])

  function digitar(v) {
    const valor = pergunta.mascara ? pergunta.mascara(v) : v
    setRespostas((r) => ({ ...r, [pergunta.id]: valor }))
    if (erro) setErro(null) // erro some assim que a pessoa corrige
  }

  function errar(msg) {
    setErro(msg)
    setTremendo(true)
    setTimeout(() => setTremendo(false), 420)
  }

  function avancar() {
    if (etapa < perguntas.length) {
      const msg = pergunta.validar(valorAtual())
      if (msg) return errar(msg)
      if (pergunta.id === 'email' && emailStatus === 'em_uso') {
        return errar('Esse email já tem uma loja. Entre na sua conta ou use outro email pra criar uma segunda.')
      }
      // Lead gravado assim que temos email: quem desiste no meio vira contato
      // em vez de sumir sem deixar rastro.
      if (pergunta.id === 'email') {
        registrarLead({ email: valorAtual().trim(), step: 'conta' })
        trackFunnel('signup_step_conta')
      }
    }
    if (etapa === etapaEndereco && !lojaExistente) {
      if (!slug || slug.length < 3) return errar('Escolha um endereço com pelo menos 3 letras.')
      if (slugStatus === 'checking') return errar('Só um instante, estamos conferindo se esse endereço está livre.')
      if (slugStatus === 'taken') return errar('Esse endereço já é de outra confeitaria. Tente uma variação.')
      if (slugStatus && slugStatus !== 'available') return errar(String(slugStatus))
      registrarLead({ ...respostas, slug, step: 'loja' })
      trackFunnel('signup_step_loja')
    }
    setSaindo(true)
    setTimeout(() => { setEtapa((e) => e + 1); setSaindo(false); setErro(null) }, 180)
  }

  function voltar() {
    if (etapa === 0) { window.location.href = '/'; return }
    setSaindo(true)
    setTimeout(() => { setEtapa((e) => e - 1); setSaindo(false); setErro(null) }, 180)
  }

  function aoTeclar(e) {
    if (e.key === 'Enter') { e.preventDefault(); avancar() }
  }

  const sugestao = pergunta?.id === 'email' ? sugestaoEmail(valorAtual()) : null
  const forca = pergunta?.id === 'password' ? forcaSenha(valorAtual()) : 0

  if (etapa >= etapaPagamento) {
    return <EtapaPagamento dados={{ ...respostas, slug }} onVoltar={voltar} />
  }

  return (
    <div className="cad-tela">
      <aside className="cad-rail">
        <a className="cad-marca" href="/">
          <img src="/brand/confeitto-mark.svg" alt="" width="34" height="34" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <span>Confeitto</span>
        </a>
        <Progresso etapa={etapa} respondidas={respostas} perguntas={perguntas}
          etapaEndereco={etapaEndereco} totalEtapas={totalEtapas} />
        <p className="cad-rail-nota">Sua loja fica no ar assim que o pagamento confirmar.</p>
      </aside>

      <main className="cad-palco">
        <div className={`cad-cartao${saindo ? ' saindo' : ''}${tremendo ? ' tremendo' : ''}`} key={etapa}>
          {etapa < perguntas.length ? (
            <>
              <span className="cad-contador">Pergunta {etapa + 1} de {totalEtapas}</span>
              <h1 className="cad-titulo">{pergunta.titulo}</h1>
              <p className="cad-ajuda">{pergunta.ajuda}</p>

              <input
                ref={inputRef}
                className={`cad-input${erro ? ' com-erro' : ''}`}
                type={pergunta.tipo}
                inputMode={pergunta.inputMode}
                autoComplete={pergunta.autoComplete}
                placeholder={pergunta.placeholder}
                value={valorAtual()}
                onChange={(e) => digitar(e.target.value)}
                onKeyDown={aoTeclar}
                aria-invalid={!!erro}
                aria-describedby={erro ? 'cad-erro' : undefined}
              />

              {pergunta.id === 'password' && valorAtual() && (
                <div className="cad-forca" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`cad-forca-barra${i < forca ? ` nivel-${forca}` : ''}`} />
                  ))}
                </div>
              )}

              {pergunta.id === 'email' && emailStatus && !['livre', 'invalido', 'desconhecido'].includes(emailStatus) && (
                <div className={`cad-email-status ${emailStatus}`} aria-live="polite">
                  {emailStatus === 'checando' && <span>Conferindo...</span>}
                  {emailStatus === 'retomavel' && (
                    <span>Você já começou um cadastro com este email — use a mesma senha pra continuar de onde parou.</span>
                  )}
                  {emailStatus === 'em_uso' && (
                    <span>
                      Esse email já tem uma loja no Confeitto. Use outro email pra abrir uma segunda,
                      ou entre no painel da loja que você já tem.
                    </span>
                  )}
                </div>
              )}

              {sugestao && !erro && (
                <button type="button" className="cad-sugestao" onClick={() => digitar(sugestao)}>
                  Você quis dizer <strong>{sugestao}</strong>? Toque pra corrigir.
                </button>
              )}
            </>
          ) : (
            <>
              <span className="cad-contador">Pergunta {etapaEndereco + 1} de {totalEtapas}</span>
              <h1 className="cad-titulo">O endereço da sua loja</h1>
              <p className="cad-ajuda">É o link que você vai mandar pras clientes. Escolhemos um a partir do nome — mude se quiser.</p>

              <div className={`cad-endereco${erro ? ' com-erro' : ''}`}>
                <span className="cad-endereco-base">confeitto.app/</span>
                <input
                  ref={inputRef}
                  className="cad-endereco-input"
                  value={slug}
                  onChange={(e) => { setSlugEditado(true); setSlug(slugify(e.target.value)); if (erro) setErro(null) }}
                  onKeyDown={aoTeclar}
                  placeholder="doces-da-ana"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              <div className="cad-slug-status" aria-live="polite">
                {slugStatus === 'checking' && <span className="conferindo">Conferindo...</span>}
                {slugStatus === 'available' && <span className="livre">✓ Livre! Esse endereço é seu.</span>}
                {slugStatus === 'taken' && <span className="ocupado">Já usado. Que tal {slug}-doces?</span>}
              </div>
            </>
          )}

          {erro && <p className="cad-erro" id="cad-erro" role="alert">{erro}</p>}

          <div className="cad-acoes">
            <button type="button" className="cad-voltar" onClick={voltar}>
              {etapa === 0 ? 'Cancelar' : '← Voltar'}
            </button>
            <button type="button" className="cad-avancar" onClick={avancar}>
              {etapa === etapaEndereco ? 'Ir para o pagamento' : 'Continuar'}
              <kbd>Enter ↵</kbd>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

/**
 * Etapa final: cupom, como pagar a implantação, como pagar a mensalidade e —
 * só se alguma das duas for cartão — os dados do cartão.
 *
 * Diferente das perguntas, aqui tudo aparece junto de propósito: são decisões
 * que se influenciam (o desconto do PIX muda o valor, o cupom muda de novo), e
 * esconder uma da outra faria a pessoa avançar e voltar pra comparar.
 */
function EtapaPagamento({ dados, onVoltar }) {
  const [plano, setPlano] = useState(null)
  const [cupom, setCupom] = useState('')
  const [cupomInfo, setCupomInfo] = useState(null)
  const [cupomErro, setCupomErro] = useState(null)
  const [cupomCarregando, setCupomCarregando] = useState(false)
  const [metodoImplantacao, setMetodoImplantacao] = useState('PIX')
  const [metodoMensalidade, setMetodoMensalidade] = useState('PIX')
  const [card, setCard] = useState({})
  const [errosCartao, setErrosCartao] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const [resultado, setResultado] = useState(null)
  const { getPaymentToken } = useCardTokenization()

  useEffect(() => {
    fetch(`${API}/signup/plans`).then((r) => r.json())
      .then((ps) => setPlano(ps.find((p) => p.isDefault) || ps[0] || null))
      .catch(() => {})
  }, [])

  const precisaCartao = metodoImplantacao === 'CARD' || metodoMensalidade === 'CARD'

  const setupCartao = cupomInfo ? cupomInfo.setupFeeComCupom : plano?.setupFee
  const setupPix = cupomInfo
    ? cupomInfo.setupFeeCupomMaisPix
    : (plano ? plano.setupFee * (1 - (plano.pixDiscountPercent || 0) / 100) : null)
  const totalHoje = metodoImplantacao === 'PIX' ? setupPix : setupCartao

  async function aplicarCupom() {
    const code = cupom.trim()
    if (!code) return
    setCupomCarregando(true); setCupomErro(null)
    try {
      const qs = new URLSearchParams({ code, ...(plano ? { planId: plano.id } : {}) })
      const r = await fetch(`${API}/signup/validate-coupon?${qs}`)
      const body = await r.json()
      if (!r.ok) { setCupomInfo(null); setCupomErro(body?.error || 'Cupom inválido'); return }
      setCupomInfo(body)
    } catch { setCupomErro('Não foi possível validar agora. Tente de novo.') }
    finally { setCupomCarregando(false) }
  }

  async function pagar() {
    setErro(null)
    if (precisaCartao) {
      const faltando = {}
      for (const [campo, rotulo] of [['number', 'número do cartão'], ['cvv', 'CVV'], ['cpf', 'CPF'], ['zipcode', 'CEP']]) {
        if (!card[campo]) faltando[campo] = `Informe o ${rotulo}.`
      }
      if (Object.keys(faltando).length) {
        setErrosCartao(faltando)
        setErro('Faltam alguns dados do cartão logo abaixo.')
        return
      }
    }
    setEnviando(true)
    try {
      const payload = {
        email: dados.email, password: dados.password, name: dados.name.trim(),
        phone: dados.phone, storeName: dados.storeName.trim(), slug: dados.slug,
        paymentMethod: metodoImplantacao, subscriptionMethod: metodoMensalidade,
        ...(cupomInfo ? { couponCode: cupomInfo.code } : {}),
      }
      if (precisaCartao) {
        try {
          const cardData = { ...card, brand: detectBrand(card.number) }
          if (metodoMensalidade === 'CARD') payload.paymentTokenSubscription = await getPaymentToken(cardData, { reuse: true })
          if (metodoImplantacao === 'CARD') payload.paymentToken = await getPaymentToken(cardData, { reuse: false })
        } catch (e) {
          setErro(e.message || 'Não conseguimos validar seu cartão. Confira os dados e tente de novo.')
          return
        }
        payload.cpf = card.cpf
        payload.birth = card.birth
        payload.billingAddress = {
          zipcode: card.zipcode, street: card.street, number: card.number_addr,
          neighborhood: card.neighborhood, city: card.city, state: card.state,
        }
      }
      registrarLead({ ...dados, step: 'pagamento' })
      const res = await fetch(`${API}/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        // O 409 de email só chega aqui se a checagem da pergunta 1 falhou (rede)
        // ou se a conta foi criada nesse meio-tempo. Em vez de travar na última
        // etapa, devolve a pessoa pro campo que precisa mudar.
        if (res.status === 409 && /email/i.test(body.error || '')) {
          setErro('Esse email já tem uma loja. Volte e use outro — o resto das suas respostas fica guardado.')
          return
        }
        setErro(body.error || 'Não foi possível criar sua conta.')
        return
      }
      trackFunnel('signup_started', body.slug)
      setResultado(body)
    } finally { setEnviando(false) }
  }

  if (resultado) return <EtapaConfirmacao resultado={resultado} metodo={metodoImplantacao} />

  return (
    <div className="cad-tela">
      <aside className="cad-rail">
        <a className="cad-marca" href="/"><span>Confeitto</span></a>
        <div className="cad-resumo">
          <h2>Sua loja</h2>
          <p className="cad-resumo-loja">{dados.storeName}</p>
          <p className="cad-resumo-url">confeitto.app/{dados.slug}</p>
          <dl>
            <div><dt>Implantação</dt><dd>{plano ? moeda(totalHoje) : '—'}</dd></div>
            <div><dt>Mensalidade</dt><dd>{plano ? moeda(plano.monthlyFee) : '—'}</dd></div>
          </dl>
          <p className="cad-resumo-total"><span>Você paga hoje</span><strong>{plano ? moeda(totalHoje) : '—'}</strong></p>
        </div>
      </aside>

      <main className="cad-palco">
        <div className="cad-cartao largo">
          <span className="cad-contador">Última etapa</span>
          <h1 className="cad-titulo">Como você prefere pagar?</h1>

          <div className="cad-bloco">
            <label className="cad-rotulo">Tem um cupom?</label>
            {cupomInfo ? (
              <div className="signup-cupom-ok">
                <span><strong>{cupomInfo.code}</strong> — {moeda(cupomInfo.discountAmount)} de desconto</span>
                <button type="button" className="signup-cupom-remove" onClick={() => { setCupomInfo(null); setCupom('') }}>remover</button>
              </div>
            ) : (
              <div className="signup-cupom-row">
                <input value={cupom} onChange={(e) => setCupom(e.target.value.toUpperCase())} placeholder="Código do cupom" autoComplete="off" />
                <button type="button" className="signup-cupom-btn" onClick={aplicarCupom} disabled={cupomCarregando || !cupom.trim()}>
                  {cupomCarregando ? 'Validando...' : 'Aplicar'}
                </button>
              </div>
            )}
            {cupomErro && <p className="signup-cupom-erro">{cupomErro}</p>}
          </div>

          <div className="cad-bloco">
            <label className="cad-rotulo">A implantação (uma vez só)</label>
            <div className="cad-opcoes">
              <button type="button" className={`cad-opcao${metodoImplantacao === 'PIX' ? ' ativa' : ''}`} onClick={() => setMetodoImplantacao('PIX')}>
                <strong>⚡ PIX</strong>
                <span>{plano ? moeda(setupPix) : '—'}</span>
                {plano?.pixDiscountPercent > 0 && <em>{plano.pixDiscountPercent}% off</em>}
              </button>
              <button type="button" className={`cad-opcao${metodoImplantacao === 'CARD' ? ' ativa' : ''}`} onClick={() => setMetodoImplantacao('CARD')}>
                <strong>💳 Cartão</strong>
                <span>{plano ? moeda(setupCartao) : '—'}</span>
              </button>
            </div>
          </div>

          <div className="cad-bloco">
            <label className="cad-rotulo">A mensalidade{plano ? ` de ${moeda(plano.monthlyFee)}` : ''}</label>
            <div className="cad-opcoes">
              <button type="button" className={`cad-opcao${metodoMensalidade === 'PIX' ? ' ativa' : ''}`} onClick={() => setMetodoMensalidade('PIX')}>
                <strong>⚡ PIX</strong>
                <span>Você paga todo mês</span>
              </button>
              <button type="button" className={`cad-opcao${metodoMensalidade === 'CARD' ? ' ativa' : ''}`} onClick={() => setMetodoMensalidade('CARD')}>
                <strong>💳 Cartão</strong>
                <span>Renova sozinha</span>
              </button>
            </div>
            <p className="cad-nota">
              {metodoMensalidade === 'CARD'
                ? 'A cobrança entra sozinha no cartão todo mês. Cancela quando quiser, pelo painel.'
                : 'Todo mês mandamos um PIX. Se atrasar mais de 15 dias o acesso é bloqueado — mas nada é apagado.'}
            </p>
          </div>

          {precisaCartao && (
            <div className="cad-bloco">
              <CardFields card={card} onChange={setCard} erros={errosCartao} />
            </div>
          )}

          {erro && <p className="cad-erro" role="alert">{erro}</p>}

          <div className="cad-acoes">
            <button type="button" className="cad-voltar" onClick={onVoltar}>← Voltar</button>
            <button type="button" className="cad-avancar destaque" onClick={pagar} disabled={enviando || !plano}>
              {enviando ? 'Criando sua loja...' : `Criar minha loja — ${plano ? moeda(totalHoje) : ''}`}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

/** QR do PIX ou confirmação do cartão, com polling até a loja subir. */
function EtapaConfirmacao({ resultado, metodo }) {
  const [status, setStatus] = useState(metodo === 'CARD' ? 'ACTIVE' : 'PENDING_PAYMENT')

  useEffect(() => {
    if (status !== 'ACTIVE') return
    trackGoogleAdsConversion({
      value: 1.0,
      currency: 'BRL',
      transactionId: resultado.subscriptionId,
    })
  }, [status, resultado.subscriptionId])

  useEffect(() => {
    if (status === 'ACTIVE') return
    const t = setInterval(() => {
      fetch(`${API}/signup/${resultado.subscriptionId}/status`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status === 'ACTIVE') {
            setStatus('ACTIVE')
            trackFunnel('signup_paid', resultado.slug)
            trackFunnel('signup_provisioned', resultado.slug)
          }
        })
        .catch(() => {})
    }, 3000)
    return () => clearInterval(t)
  }, [status, resultado])

  if (status === 'ACTIVE') {
    return (
      <div className="cad-tela cad-tela-final">
        <main className="cad-palco">
          <div className="cad-cartao cad-festa">
            <div className="cad-confete" aria-hidden="true">
              {Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}
            </div>
            <div className="cad-selo">🎉</div>
            <h1 className="cad-titulo">Sua loja está no ar!</h1>
            <p className="cad-ajuda">Agora é escolher as cores, subir sua logo e cadastrar os primeiros doces.</p>
            <a className="cad-avancar destaque" href={`/${resultado.slug}/admin`}>Entrar no meu painel →</a>
            <a className="cad-link-secundario" href={`/${resultado.slug}`}>ver minha loja</a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="cad-tela cad-tela-final">
      <main className="cad-palco">
        <div className="cad-cartao">
          <span className="cad-contador">Falta só o pagamento</span>
          <h1 className="cad-titulo">Escaneie o QR no seu banco</h1>
          <p className="cad-ajuda">
            {moeda(resultado.setupFee)} de implantação, uma vez só. Assim que o pagamento cair, sua loja sobe sozinha —
            pode deixar esta tela aberta.
          </p>
          {resultado.payment?.qrCode ? (
            <img className="cad-qr" src={resultado.payment.qrCode} alt="QR code do PIX" />
          ) : (
            <p className="cad-erro">Não conseguimos gerar o PIX agora. {resultado.payment?.error || 'Tente de novo em instantes.'}</p>
          )}
          {resultado.payment?.pixCopyPaste && (
            <button type="button" className="cad-copiar"
              onClick={() => navigator.clipboard?.writeText(resultado.payment.pixCopyPaste)}>
              copiar código PIX
            </button>
          )}
          <p className="cad-aguardando"><span className="cad-pulso" /> Aguardando confirmação...</p>
        </div>
      </main>
    </div>
  )
}
