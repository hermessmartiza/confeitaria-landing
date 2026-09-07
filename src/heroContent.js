// Copy do header/hero da home, extraída pra cá pra servir de fonte única:
// tanto o React (App.jsx) quanto o plugin de pre-render (vite.config.js, que
// injeta o mesmo markup estático em index.html antes do JS rodar) usam este
// arquivo — evita o conteúdo divergir entre a versão crawlable e a real.
export const HERO = {
  badge: '0% de comissão sobre suas vendas',
  eyebrow: 'Sua confeitaria não trabalha para aplicativo',
  headingBefore: 'Pare de entregar ',
  headingGrad1: 'uma fatia',
  headingMiddle: ' de cada venda para ',
  headingGrad2: 'apps de delivery',
  paragraph:
    'Venda pelo seu próprio site, receba direto na sua conta e fique com o dinheiro do seu trabalho. Loja online, PIX automático, pedidos e gestão em um só lugar.',
  ctaPrimaryLabel: 'Quero vender sem comissão',
  ctaSecondaryLabel: 'Comparar custos',
  ctaSecondaryHref: '#comparativo',
}

export const HERO_PROOFS = [
  '0% de comissão',
  'Dinheiro direto na sua conta',
  'Sua marca e seus clientes',
]

export const COMPARISON = {
  eyebrow: 'A conta que os aplicativos não colocam em destaque',
  title: 'Quanto mais você vende, mais deveria sobrar para você.',
  intro:
    'Em plataformas que cobram percentual, cada pedido tira mais uma parte da sua margem. No Confeitto, o crescimento da sua confeitaria continua sendo seu.',
  apps: {
    label: 'Plataformas com comissão',
    badge: 'Uma fatia de cada venda',
    items: [
      'Cobrança percentual sobre o valor do pedido',
      'Seu custo aumenta justamente quando você vende mais',
      'Sua marca disputa espaço com dezenas de concorrentes',
    ],
    footer: 'Você produz. Você entrega. A plataforma fica com uma parte.',
  },
  confeitto: {
    label: 'Sua loja com Confeitto',
    badge: '0% de comissão',
    items: [
      'R$ 0,00 de comissão sobre o valor das vendas',
      'Apenas R$ 0,50 fixos por pedido online pago, separado para o cliente',
      'Seu domínio, sua identidade e relacionamento direto com o cliente',
    ],
    footer: 'Você vende mais. O dinheiro do pedido continua com você.',
  },
}

export const FEATURES_INTRO =
  'Chega de improvisar com caderno, planilha e conversa perdida. O Confeitto foi pensado para a rotina real de quem produz, vende e entrega doces todos os dias.'

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
