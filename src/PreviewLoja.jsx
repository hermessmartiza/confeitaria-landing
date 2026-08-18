import { useEffect, useRef, useState } from 'react'

const PREVIEW_URL = import.meta.env.VITE_PREVIEW_URL || '/_preview'

/**
 * Preview ao vivo da loja durante o cadastro.
 *
 * O iframe aponta para o app REAL da loja (/_preview), não para uma cópia aqui
 * na landing. É o mesmo LandingRenderer e o mesmo template do provisionamento —
 * a pessoa vê exatamente o que vai receber. Uma reimplementação daria um preview
 * mais fácil de escrever e uma promessa que quebra no primeiro ajuste do tema.
 *
 * A comunicação é por postMessage porque recarregar o iframe a cada tecla faria
 * a tela piscar e refazer o fetch do template.
 */
export default function PreviewLoja({ nome, brandColor, logoUrl, slug }) {
  const iframeRef = useRef(null)
  const [pronto, setPronto] = useState(false)
  const [carregou, setCarregou] = useState(false)
  const [dispositivo, setDispositivo] = useState('desktop')

  // src calculado UMA vez: os valores iniciais vão na query pra primeira pintura
  // já sair certa. Recalcular a cada tecla recarregaria o iframe e faria a tela
  // piscar — as atualizações seguintes vão por postMessage.
  const [src] = useState(() => {
    const q = new URLSearchParams()
    if (nome) q.set('name', nome)
    if (brandColor) q.set('brandColor', brandColor)
    if (logoUrl) q.set('logoUrl', logoUrl)
    const qs = q.toString()
    return qs ? `${PREVIEW_URL}?${qs}` : PREVIEW_URL
  })

  // O iframe avisa quando montou; antes disso qualquer postMessage se perde.
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.tipo === 'confeitto:preview-pronto') setPronto(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Debounce curto: sem ele o template é refeito a cada tecla do nome.
  useEffect(() => {
    if (!pronto) return
    const t = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { tipo: 'confeitto:preview', dados: { name: nome, brandColor, logoUrl } },
        '*',
      )
    }, 350)
    return () => clearTimeout(t)
  }, [pronto, nome, brandColor, logoUrl])

  return (
    <aside className="signup-preview">
      <div className="signup-preview-head">
        <span className="signup-preview-titulo">Sua loja, ao vivo</span>
        <div className="signup-preview-toggle">
          <button type="button" className={dispositivo === 'desktop' ? 'ativo' : ''}
            onClick={() => setDispositivo('desktop')} aria-label="Ver em computador">🖥️</button>
          <button type="button" className={dispositivo === 'mobile' ? 'ativo' : ''}
            onClick={() => setDispositivo('mobile')} aria-label="Ver em celular">📱</button>
        </div>
      </div>

      <div className={`signup-preview-moldura signup-preview-${dispositivo}`}>
        <div className="signup-preview-barra">
          <span className="signup-preview-pontos"><i /><i /><i /></span>
          <span className="signup-preview-url">confeitto.app/{slug || 'sualoja'}</span>
        </div>
        <iframe
          ref={iframeRef}
          src={src}
          title="Prévia da sua loja"
          onLoad={() => setCarregou(true)}
          sandbox="allow-scripts allow-same-origin"
        />
        {!carregou && <div className="signup-preview-carregando">Montando sua loja...</div>}
      </div>

      <p className="signup-preview-nota">
        É a loja de verdade — o mesmo layout que vai pro ar. Tudo dá pra ajustar depois no painel.
      </p>
    </aside>
  )
}
