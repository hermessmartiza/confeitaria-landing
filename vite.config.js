import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { HERO, FEATURES, FEATURES_INTRO, STEPS, PRICING_INCLUDES } from './src/heroContent.js'

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
        <div class="logo">
          <img src="/brand/simbolo.svg" alt="Confeitto, sistema de gestão para confeitarias" width="30" height="30" class="logo-mark" fetchpriority="high" />
          <span class="logo-text">Conf<span class="logo-ei">ei</span>tto</span>
        </div>
      </div>
    </header>
    <section class="hero">
      <div class="container hero-content">
        <div class="hero-badge">${HERO.badge}</div>
        <h1>${HERO.headingBefore}<span class="grad">${HERO.headingGrad1}</span>${HERO.headingMiddle}<span class="grad">${HERO.headingGrad2}</span></h1>
        <p>${HERO.paragraph}</p>
        <div class="hero-actions">
          <span class="btn btn-light">${HERO.ctaPrimaryLabel}</span>
          <a class="btn btn-ghost" href="${HERO.ctaSecondaryHref}">${HERO.ctaSecondaryLabel}</a>
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
        <h2>Um plano só. Tudo incluso.</h2>
        <ul class="pricing-list">
          ${PRICING_INCLUDES.map(item => `<li>${item}</li>`).join('\n          ')}
        </ul>
      </div>
    </section>
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
