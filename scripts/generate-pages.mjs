// Gera páginas estáticas de verdade (Termos, Privacidade, FAQ, Blog) em
// public/, ANTES do build da Vite. Rodam como HTML puro, sem depender do
// bundle React — diferente da landing principal (SPA), o conteúdo delas
// existe desde a primeira resposta do servidor. Ferramentas de SEO, crawlers
// de rede social e o próprio Google (na primeira passada, antes de renderizar
// JS) enxergam o conteúdo e os links reais, não uma casca vazia.
//
// Roda via "prebuild" (ver package.json) — `public/` é copiado pra `dist/`
// verbatim pela própria Vite, o mesmo mecanismo que já serve `public/brand`.
// Também regenera sitemap.xml com todas as URLs (a estática, que só listava
// a raiz).

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { FAQ_ITEMS, TERMOS_SECTIONS, PRIVACIDADE_SECTIONS, BLOG_POSTS } from './pages-content.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '..', 'public')

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/blog/', label: 'Blog' },
  { href: '/faq', label: 'Perguntas frequentes' },
  { href: '/termos', label: 'Termos de uso' },
  { href: '/privacidade', label: 'Privacidade' },
]

function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Escapa texto pra uso seguro tanto em atributo (content="...") quanto em nó de texto. */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Casca comum a toda página estática — mesma paleta/fonte da landing principal. */
function layout({ title, description, canonicalPath, bodyHtml, articleMeta, structuredData = [] }) {
  const canonical = `https://confeitto.app${canonicalPath}`
  const safeTitle = esc(title)
  const safeDescription = esc(description)
  const graph = [
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: `${title} — Confeitto`,
      description,
      inLanguage: 'pt-BR',
      isPartOf: { '@id': 'https://confeitto.app/#website' },
    },
    ...(canonicalPath === '/' ? [] : [{
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://confeitto.app/' },
        { '@type': 'ListItem', position: 2, name: title, item: canonical },
      ],
    }]),
    ...(articleMeta ? [{
      '@type': 'BlogPosting',
      headline: title,
      description,
      url: canonical,
      datePublished: articleMeta.datePublished,
      dateModified: articleMeta.datePublished,
      image: 'https://confeitto.app/brand/og-image.png',
      author: { '@type': 'Organization', name: 'Confeitto', url: 'https://confeitto.app/' },
      publisher: {
        '@type': 'Organization',
        name: 'Confeitto',
        logo: { '@type': 'ImageObject', url: 'https://confeitto.app/brand/icon-512.png' },
      },
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
    }] : []),
    ...structuredData,
  ]
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} — Confeitto</title>
  <meta name="description" content="${safeDescription}" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
  <meta name="theme-color" content="#4a1526" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="pt-BR" href="${canonical}" />
  <link rel="alternate" hreflang="x-default" href="${canonical}" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/svg+xml" href="/brand/icone.svg" />
  <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="llms.txt" href="/llms.txt" />

  <meta property="og:type" content="${articleMeta ? 'article' : 'website'}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="Confeitto" />
  <meta property="og:title" content="${safeTitle} — Confeitto" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:image" content="https://confeitto.app/brand/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="Confeitto — sistema de gestão para confeitarias" />
  <meta property="og:locale" content="pt_BR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle} — Confeitto" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="https://confeitto.app/brand/og-image.png" />
  <meta name="twitter:image:alt" content="Confeitto — sistema de gestão para confeitarias" />
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>

  <link rel="stylesheet" href="/landing-assets/fonts/outfit.css" />
  <link rel="stylesheet" href="/static-pages.css" />
</head>
<body>
  <a href="#main-content" class="skip-link">Pular para o conteúdo</a>
  <header class="sp-header">
    <div class="sp-container sp-header-inner">
      <a href="/" class="sp-logo">
        <img src="/brand/simbolo.svg" alt="Confeitto, sistema de gestão para confeitarias" width="28" height="28" />
        <span>Conf<em>ei</em>tto</span>
      </a>
      <nav class="sp-nav" aria-label="Navegação">
        ${NAV_LINKS.map(l => `<a href="${l.href}">${l.label}</a>`).join('\n        ')}
      </nav>
    </div>
  </header>

  <main class="sp-main" id="main-content">
    <div class="sp-container">
      ${bodyHtml}
    </div>
  </main>

  <footer class="sp-footer">
    <div class="sp-container">
      <nav aria-label="Rodapé">
        ${NAV_LINKS.map(l => `<a href="${l.href}">${l.label}</a>`).join('\n        ')}
      </nav>
      <p>© 2026 <a href="https://smartiza.com.br">Smartiza</a> — Tecnologia para confeitarias</p>
    </div>
  </footer>
</body>
</html>
`
}

function sectionsHtml(sections) {
  return sections.map(s => `<section class="sp-section"><h2>${s.title}</h2><p>${s.body}</p></section>`).join('\n')
}

function write(relPath, html) {
  const full = join(PUBLIC_DIR, relPath)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, html)
  console.log(`[generate-pages] ${relPath}`)
}

// ─── Termos ──────────────────────────────────────────────────────────────
write('termos.html', layout({
  title: 'Termos de Uso',
  description: 'Termos de uso do Confeitto — condições de assinatura, cobrança, cancelamento e responsabilidades.',
  canonicalPath: '/termos',
  bodyHtml: `
    <h1>Termos de Uso</h1>
    <p class="sp-updated">Última atualização: 30 de julho de 2026</p>
    ${sectionsHtml(TERMOS_SECTIONS)}
  `,
}))

// ─── Privacidade ─────────────────────────────────────────────────────────
write('privacidade.html', layout({
  title: 'Política de Privacidade',
  description: 'Como o Confeitto trata os dados pessoais de lojistas cadastrados na plataforma, em conformidade com a LGPD.',
  canonicalPath: '/privacidade',
  bodyHtml: `
    <h1>Política de Privacidade</h1>
    <p class="sp-updated">Última atualização: 30 de julho de 2026</p>
    ${sectionsHtml(PRIVACIDADE_SECTIONS)}
  `,
}))

// ─── FAQ ─────────────────────────────────────────────────────────────────
write('faq.html', layout({
  title: 'Perguntas Frequentes',
  description: 'Tire suas dúvidas sobre o Confeitto: cadastro, pagamento, cancelamento e segurança dos dados.',
  canonicalPath: '/faq',
  structuredData: [{
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }],
  bodyHtml: `
    <h1>Perguntas frequentes</h1>
    <div class="sp-faq">
      ${FAQ_ITEMS.map(f => `<details class="sp-faq-item"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('\n      ')}
    </div>
    <p class="sp-cta"><a href="/">Ainda tem dúvida? Fale com a gente pela loja.</a></p>
  `,
}))

// ─── Blog: índice ────────────────────────────────────────────────────────
const postsSortedDesc = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date))
write('blog/index.html', layout({
  title: 'Blog',
  description: 'Dicas de gestão, precificação e vendas para confeitarias e negócios de doces.',
  canonicalPath: '/blog/',
  bodyHtml: `
    <h1>Blog do Confeitto</h1>
    <p class="sp-sub">Conteúdo pra quem faz doce e também precisa tocar o negócio. Aqui a gente escreve sobre
    o lado prático de administrar uma confeitaria — precificação, atendimento, organização de pedidos e as
    obrigações legais que todo negócio pequeno acaba tendo que entender, mesmo sem departamento jurídico
    nem contador em tempo integral.</p>
    <p class="sp-sub">Os textos vêm de situações reais de quem já vende doce no dia a dia — não é teoria de
    curso de gestão, é o que costuma travar uma confeitaria pequena na prática e como resolver sem
    complicar.</p>
    <div class="sp-blog-list">
      ${postsSortedDesc.map(p => `
      <article class="sp-blog-card">
        <a href="/blog/${p.slug}">
          <time datetime="${p.date}">${fmtDate(p.date)}</time>
          <h2>${p.title}</h2>
          <p>${p.excerpt}</p>
        </a>
      </article>`).join('\n')}
    </div>
  `,
}))

// ─── Blog: posts ─────────────────────────────────────────────────────────
// Cada post linka pros outros 2 (além do link vindo do índice do blog) —
// sem isso, um post só tinha 1 link interno de entrada no site inteiro.
for (const post of BLOG_POSTS) {
  const related = BLOG_POSTS.filter(p => p.slug !== post.slug)
  write(`blog/${post.slug}.html`, layout({
    title: post.title,
    description: post.excerpt,
    canonicalPath: `/blog/${post.slug}`,
    articleMeta: { datePublished: post.date },
    bodyHtml: `
      <article class="sp-article">
        <p class="sp-back"><a href="/blog/">← Voltar pro blog</a></p>
        <time datetime="${post.date}">${fmtDate(post.date)}</time>
        <h1>${post.title}</h1>
        ${post.body}
        <p class="sp-cta"><a href="/">Quer organizar sua confeitaria? Conheça o Confeitto →</a></p>
      </article>
      <aside class="sp-related">
        <h2>Veja também</h2>
        <ul>
          ${related.map(p => `<li><a href="/blog/${p.slug}">${p.title}</a></li>`).join('\n          ')}
        </ul>
      </aside>
    `,
  }))
}

// ─── Sitemap ─────────────────────────────────────────────────────────────
// Substitui o sitemap estático (só listava a raiz) por um gerado com todas
// as páginas reais — landing, Termos, Privacidade, FAQ, blog e cada post.
const BUILD_DATE = new Date().toISOString().slice(0, 10)
const latestPostDate = BLOG_POSTS.reduce((max, p) => (p.date > max ? p.date : max), BLOG_POSTS[0].date)
const staticUrls = [
  { loc: '/', priority: '1.0', changefreq: 'weekly', lastmod: BUILD_DATE },
  { loc: '/faq', priority: '0.7', changefreq: 'monthly', lastmod: BUILD_DATE },
  { loc: '/termos', priority: '0.3', changefreq: 'yearly', lastmod: BUILD_DATE },
  { loc: '/privacidade', priority: '0.3', changefreq: 'yearly', lastmod: BUILD_DATE },
  { loc: '/blog/', priority: '0.6', changefreq: 'weekly', lastmod: latestPostDate },
  ...BLOG_POSTS.map(p => ({ loc: `/blog/${p.slug}`, priority: '0.5', changefreq: 'monthly', lastmod: p.date })),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(u => `  <url>
    <loc>https://confeitto.app${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`
write('sitemap.xml', sitemap)

// ─── Web app manifest ──────────────────────────────────────────────────────
// /favicon.ico e /manifest.json são pedidos direto pelo navegador (fora do
// nosso controle de qual link a página declara) — sem isso caíam no
// catch-all da loja (confeitto-frontend) e voltavam a SPA errada, por isso
// o ícone genérico aparecia em vez do nosso.
const manifest = JSON.stringify({
  name: 'Confeitto',
  short_name: 'Confeitto',
  description: 'Sistema de vendas e gestão para confeitarias com loja online e 0% de comissão percentual.',
  id: '/',
  scope: '/',
  icons: [
    { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
  theme_color: '#4a1526',
  background_color: '#faf9f7',
  display: 'standalone',
  start_url: '/',
  lang: 'pt-BR',
  categories: ['business', 'food', 'shopping'],
}, null, 2)
write('site.webmanifest', manifest)
write('manifest.json', manifest)

// ─── llms.txt ────────────────────────────────────────────────────────────
// Markdown com H1 + links reais, seguindo a convenção llmstxt.org.
const llmsTxt = `# Confeitto

> Sistema de vendas e gestão para confeitarias com loja online própria, 0% de comissão percentual, PIX automático, PDV, encomendas, estoque e relatórios financeiros.

## Páginas principais

- [Início](https://confeitto.app/): Loja online sem comissão percentual, recursos, comparação e planos
- [Perguntas frequentes](https://confeitto.app/faq): Dúvidas sobre cadastro, pagamento e segurança
- [Blog](https://confeitto.app/blog/): Conteúdo sobre gestão de confeitarias
- [Termos de uso](https://confeitto.app/termos)
- [Política de privacidade](https://confeitto.app/privacidade)

## Blog

${postsSortedDesc.map(p => `- [${p.title}](https://confeitto.app/blog/${p.slug}): ${p.excerpt}`).join('\n')}
`
write('llms.txt', llmsTxt)

console.log(`[generate-pages] ${5 + BLOG_POSTS.length} páginas + sitemap + manifest + llms.txt gerados.`)
