// Copy do header/hero da home, extraída pra cá pra servir de fonte única:
// tanto o React (App.jsx) quanto o plugin de pre-render (vite.config.js, que
// injeta o mesmo markup estático em index.html antes do JS rodar) usam este
// arquivo — evita o conteúdo divergir entre a versão crawlable e a real.
export const HERO = {
  badge: '✨ Lançamento especial — implantação com 40% OFF',
  headingBefore: 'O sistema ',
  headingGrad1: 'completo',
  headingMiddle: ' para sua confeitaria ',
  headingGrad2: 'vender mais',
  paragraph:
    'Venda online e presencial, encomendas organizadas, estoque, PIX automático e relatórios — tudo em um só painel, com a cara da sua marca.',
  ctaPrimaryLabel: 'Quero começar agora 🚀',
  ctaSecondaryLabel: 'Ver oferta',
  ctaSecondaryHref: '#oferta',
}

export const FEATURES_INTRO =
  'Nenhum sistema genérico adaptado às pressas: cada parte do Confeitto foi pensada pro dia a dia da confeiteira que faz e vende doce — da produção até o pagamento cair na conta.'

export const FEATURES = [
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
    title: 'Encomendas Organizadas',
    text: 'Agenda produtiva, pré-venda e controle das entregas — acabou o caderninho e os pedidos perdidos.',
  },
  {
    icon: '📊',
    title: 'Painel Completo',
    text: 'Pedidos, estoque e relatórios financeiros em tempo real, pelo celular ou computador.',
  },
  {
    icon: '🎨',
    title: 'Sua Marca, Seu Estilo',
    text: 'Cores, logotipo e banner personalizados direto no painel, sem escrever código.',
  },
]

export const STEPS = [
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

export const PRICING_INCLUDES = [
  'Loja online completa com domínio próprio',
  'PDV para venda presencial',
  'Pagamento PIX com confirmação automática',
  'Encomendas organizadas com agenda produtiva',
  'Estoque sob controle',
  'Relatórios financeiros',
  'Layout com a identidade da sua marca',
  'Suporte e atualizações inclusos',
]
