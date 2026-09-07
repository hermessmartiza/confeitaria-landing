import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {
  HERO,
  HERO_PROOFS,
  COMPARISON,
  FEATURES,
  FEATURES_INTRO,
  STEPS,
  PRICING_INCLUDES,
} from './src/heroContent.js'

// A home é uma SPA: sem isso, a primeira resposta HTML tem <div id="root">
// vazio e nenhum <h1> — crawlers que não executam JS (a maioria dos
// scanners de SEO e alguns bots de IA) não veem texto nenhum na página mais
// importante do domínio, e o texto real fica curto demais (thin content).
// Este plugin injeta o header+hero+features+como-funciona reais dentro de
// #root antes do build; o React (createRoot().render) substitui esse
// conteúdo assim que hidrata no navegador, então quem tem JS não percebe
// diferença — mesmo texto, mesmas classes CSS. Preço não entra aqui de
// propósito: vem de uma API em tempo real, não tem como pré-renderizar sem
// arriscar mostrar um valor desatualizado.
function prerenderHeroPlugin() {
  return {
    name: 'prerender-hero',
    transformIndexHtml(html) {
      const staticShell = `
    <header>
      <div class="container header-inner">
        <a class="logo" href="/" aria-label="Confeitto — início">
          <img src="/brand/simbolo.svg" alt="Confeitto, sistema de gestão para confeitarias" width="30" height="30" class="logo-mark" fetchpriority="high" />
          <span class="logo-text">Conf<span class="logo-ei">ei</span>tto</span>
        </a>
        <nav class="header-nav" aria-label="Navegação principal">
          <a href="#comparativo">Por que mudar</a>
          <a href="#recursos">Recursos</a>
          <a href="#oferta">Preço</a>
        </nav>
      </div>
    </header>
    <main id="main-content">
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-content">
          <div class="hero-badge">↓ ${HERO.badge}</div>
          <div class="hero-eyebrow">${HERO.eyebrow}</div>
          <h1>${HERO.headingBefore}<span class="grad">${HERO.headingGrad1}</span>${HERO.headingMiddle}<span class="grad">${HERO.headingGrad2}</span></h1>
          <p>${HERO.paragraph}</p>
          <div class="hero-actions">
            <a class="btn btn-light" href="/criar">${HERO.ctaPrimaryLabel} →</a>
            <a class="btn btn-ghost" href="${HERO.ctaSecondaryHref}">${HERO.ctaSecondaryLabel}</a>
          </div>
          <ul class="hero-proofs">
            ${HERO_PROOFS.map(proof => `<li>${proof}</li>`).join('\n            ')}
          </ul>
        </div>
        <aside class="hero-money-card" aria-label="Exemplo de comissão em um pedido de cem reais">
          <div class="money-card-top"><span>Exemplo de pedido</span><strong>R$ 100,00</strong></div>
          <div class="money-divider"></div>
          <div class="money-zero-row"><div><span>Comissão do Confeitto</span><strong>R$ 0,00</strong></div><div class="zero-orbit"><span>0%</span></div></div>
          <div class="money-result"><span>O valor da sua venda</span><strong>continua sendo seu.</strong></div>
          <p>Retirada, entrega própria, balcão e mesa: R$ 0,00 de taxa do Confeitto por pedido.</p>
          <div class="money-seal">✓ Sem surpresa no fechamento</div>
        </aside>
      </div>
    </section>
    <section id="comparativo" class="comparison-section">
      <div class="container">
        <div class="section-kicker">${COMPARISON.eyebrow}</div>
        <h2>${COMPARISON.title}</h2>
        <p class="section-intro comparison-intro">${COMPARISON.intro}</p>
        <div class="comparison-grid">
          <article class="comparison-card comparison-apps">
            <div class="comparison-card-head"><span class="comparison-icon">↓</span><div><span class="comparison-label">${COMPARISON.apps.label}</span><h3>${COMPARISON.apps.badge}</h3></div></div>
            <ul>${COMPARISON.apps.items.map(item => `<li>${item}</li>`).join('')}</ul>
            <p class="comparison-footer">${COMPARISON.apps.footer}</p>
          </article>
          <article class="comparison-card comparison-confeitto">
            <div class="comparison-card-head"><span class="comparison-icon">↑</span><div><span class="comparison-label">${COMPARISON.confeitto.label}</span><h3>${COMPARISON.confeitto.badge}</h3></div></div>
            <ul>${COMPARISON.confeitto.items.map(item => `<li>${item}</li>`).join('')}</ul>
            <p class="comparison-footer">${COMPARISON.confeitto.footer}</p>
          </article>
        </div>
      </div>
    </section>
    <section id="recursos">
      <div class="container">
        <h2>Tudo que sua confeitaria precisa</h2>
        <p class="section-intro">${FEATURES_INTRO}</p>
        <div class="features-grid">
          ${FEATURES.map(f => `<div class="feature-card"><div class="icon">${f.icon}</div><h3>${f.title}</h3><p>${f.text}</p></div>`).join('\n          ')}
        </div>
      </div>
    </section>
    <section class="section-alt">
      <div class="container">
        <h2>Como funciona</h2>
        <div class="steps">
          ${STEPS.map((s, i) => `<div class="step"><div class="step-num">${i + 1}</div><h3>${s.title}</h3><p>${s.text}</p></div>`).join('\n          ')}
        </div>
      </div>
    </section>
    <section id="oferta" class="pricing">
      <div class="container">
        <div class="section-kicker">Previsível para você. Transparente para o cliente.</div>
        <h2>Zero comissão. Um plano simples.</h2>
        <ul class="pricing-list">
          ${PRICING_INCLUDES.map(item => `<li>${item}</li>`).join('\n          ')}
        </ul>
      </div>
    </section>
    </main>
    <footer>
      <div class="container">
        <nav class="footer-nav">
          <a href="/blog/">Blog</a>
          <a href="/faq">Perguntas frequentes</a>
          <a href="/termos">Termos de uso</a>
          <a href="/privacidade">Privacidade</a>
        </nav>
        <p>© 2026 <a href="https://smartiza.com.br">Smartiza</a> — Tecnologia para confeitarias</p>
      </div>
    </footer>
  `
      return html.replace('<div id="root"></div>', `<div id="root">${staticShell}</div>`)
    },
  }
}

export default defineConfig({
  plugins: [react(), prerenderHeroPlugin()],
  build: {
    // "assets" (padrão do Vite) colide com o mesmo prefixo usado pelo build da
    // loja (confeitaria-frontend) — os dois passam a viver no mesmo domínio
    // (confeitto.app) quando a landing serve a raiz e a loja serve /{slug}.
    // Prefixo próprio evita que uma pisque no chunk da outra.
    assetsDir: 'landing-assets',
  },
})
