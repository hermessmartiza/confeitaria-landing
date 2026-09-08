// Conteúdo das páginas estáticas (Termos, Privacidade, FAQ, Blog).
//
// São HTML de verdade, gerados ANTES do build da Vite — diferente da landing
// principal (SPA, conteúdo só existe depois do JavaScript rodar), essas
// páginas existem no HTML desde a primeira resposta do servidor. É o que
// resolve o "nenhum link interno encontrado" que a ferramenta de SEO apontou:
// ela (como a maioria dos scanners e os crawlers de rede social) não executa
// JavaScript, então via só a casca vazia da SPA antes disso.

export const FAQ_ITEMS = [
  {
    q: 'Preciso ter CNPJ pra usar o Confeitto?',
    a: 'Não. Muita confeiteira começa como MEI ou até informal, e o Confeitto funciona do mesmo jeito. Quando você formalizar, nada muda no sistema.',
  },
  {
    q: 'Funciona pelo celular?',
    a: 'Sim, o painel inteiro roda no navegador do celular, sem precisar instalar nada. A vitrine que seus clientes veem também é pensada primeiro pra tela pequena — é de lá que a maioria das vendas vem.',
  },
  {
    q: 'Como funciona o pagamento dos meus clientes?',
    a: 'PIX com confirmação automática e cartão de crédito, direto na sua conta — o dinheiro cai pra você, não passa pelo Confeitto no meio do caminho.',
  },
  {
    q: 'Preciso saber mexer com site ou programação?',
    a: 'Não. Você cadastra seus produtos, ativa PIX, e sua loja já está pronta pra vender. O painel foi pensado pra quem nunca configurou um sistema antes.',
  },
  {
    q: 'Quanto custa?',
    a: 'Uma taxa única de implantação e uma mensalidade fixa, nos valores exibidos no cadastro. O Confeitto cobra 0% de comissão sobre o valor das vendas e R$ 0,00 de taxa por pedido. Tarifas do meio de pagamento e o frete escolhido são cobrados pelos respectivos fornecedores.',
  },
  {
    q: 'O Confeitto cobra comissão sobre minhas vendas?',
    a: 'Não. O Confeitto fica com 0% do valor dos seus pedidos e não cobra taxa por pedido. O dinheiro da venda vai para a conta configurada pela sua confeitaria. Tarifas do meio de pagamento e do frete continuam sujeitas às condições dos fornecedores escolhidos.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim, direto no painel, sem precisar ligar pra ninguém. Sua loja continua funcionando normalmente até o fim do período já pago — você não perde o que pagou.',
  },
  {
    q: 'Se eu atrasar o pagamento, perco meus pedidos e produtos?',
    a: 'Não. Atraso bloqueia o acesso temporariamente, nunca apaga dado. Assim que regularizar, a loja volta a vender exatamente do jeito que estava.',
  },
  {
    q: 'Meus dados e os dos meus clientes ficam seguros?',
    a: 'As credenciais de pagamento ficam cifradas no banco, cada loja é isolada das outras, e toda ação administrativa relevante fica registrada. Detalhes completos na nossa Política de Privacidade.',
  },
  {
    q: 'Já vendo só pelo WhatsApp, preciso mesmo de uma loja online?',
    a: 'Não precisa parar de usar o WhatsApp — muita confeiteira usa os dois juntos. A diferença é que a loja online tira de você a parte repetitiva (responder preço, confirmar pagamento, anotar endereço) e deixa o WhatsApp livre pra atender de verdade.',
  },
  {
    q: 'Dá pra usar em outros tipos de negócio, não só confeitaria?',
    a: 'O Confeitto foi desenhado pensando em confeitaria e negócios de doces — o painel de encomendas, o controle de estoque e o catálogo seguem esse fluxo. Pra outros ramos de venda de comida, pode funcionar, mas não é o foco.',
  },
  {
    q: 'Como troco o cartão da mensalidade?',
    a: 'Direto no painel administrativo, na tela de assinatura — você cadastra o novo cartão e ele passa a ser cobrado a partir da próxima renovação, sem precisar falar com suporte.',
  },
  {
    q: 'Tem suporte se eu tiver dúvida usando o sistema?',
    a: 'Sim, o canal de suporte fica acessível direto do seu painel administrativo, sem precisar sair do sistema pra abrir chamado em outro lugar.',
  },
]

export const TERMOS_SECTIONS = [
  {
    title: '1. O que é o Confeitto',
    body: `O Confeitto é um sistema de gestão para confeitarias e negócios de doces, operado pela Smartiza.
    Ele inclui: vitrine online, painel administrativo, PDV para venda presencial, gestão de encomendas,
    controle de estoque e processamento de pagamentos (PIX e cartão) integrado a gateways de pagamento de terceiros.`,
  },
  {
    title: '2. Cadastro e responsabilidade da conta',
    body: `Ao criar uma conta, você declara que as informações fornecidas são verdadeiras e se compromete a
    mantê-las atualizadas. Você é responsável por manter sua senha em sigilo e por toda atividade realizada
    através da sua conta. Avise imediatamente se suspeitar de acesso não autorizado.`,
  },
  {
    title: '3. Assinatura, cobrança e cancelamento',
    body: `O uso do Confeitto é pago através de uma taxa de implantação (cobrada uma única vez, no cadastro) e
    uma mensalidade recorrente, nos valores vigentes exibidos no momento da contratação. A mensalidade é cobrada
    automaticamente no método de pagamento escolhido. O Confeitto cobra 0% de comissão sobre o valor das vendas
    e, enquanto esta condição comercial estiver vigente, não cobra taxa por pedido. Tarifas do meio de pagamento
    e do serviço de entrega escolhido permanecem sujeitas às condições dos respectivos fornecedores.
    Você pode cancelar a qualquer momento pelo próprio painel;
    o cancelamento interrompe cobranças futuras e sua loja permanece ativa até o fim do período já pago,
    sem reembolso proporcional do período em curso.`,
  },
  {
    title: '4. Inadimplência',
    body: `Pagamentos em atraso seguem uma régua de avisos antes de qualquer suspensão. A suspensão bloqueia o
    acesso e a venda através da loja, mas nunca apaga produtos, pedidos, clientes ou qualquer outro dado —
    o acesso é restabelecido automaticamente assim que o pagamento for confirmado.`,
  },
  {
    title: '5. Uso aceitável',
    body: `Você concorda em não usar o Confeitto para atividades ilegais, para vender produtos proibidos, para
    tentar acessar dados de outras contas, ou para qualquer ação que comprometa a segurança ou o funcionamento
    da plataforma. Reservamo-nos o direito de suspender contas que violem estes termos.`,
  },
  {
    title: '6. Seus dados e os dados dos seus clientes',
    body: `O tratamento de dados pessoais — seus, como titular da conta, e dos consumidores que compram na sua
    loja — segue nossa <a href="/privacidade">Política de Privacidade</a>, em conformidade com a
    Lei Geral de Proteção de Dados (LGPD).`,
  },
  {
    title: '7. Propriedade e conteúdo',
    body: `Você mantém a propriedade sobre o conteúdo que cadastra (fotos de produtos, descrições, dados de
    clientes). O Confeitto, sua marca, código e design permanecem de propriedade da Smartiza.`,
  },
  {
    title: '8. Limitação de responsabilidade',
    body: `O Confeitto é fornecido "como está". Fazemos o possível para manter o serviço disponível e seguro,
    mas não garantimos operação ininterrupta e não somos responsáveis por perdas indiretas decorrentes de
    indisponibilidade eventual, falhas de terceiros (como gateways de pagamento) ou uso indevido da conta.`,
  },
  {
    title: '9. Alterações nestes termos',
    body: `Podemos atualizar estes termos para refletir mudanças no serviço ou na lei. Mudanças relevantes
    serão comunicadas com antecedência razoável pelos canais de contato cadastrados.`,
  },
  {
    title: '10. Lei aplicável',
    body: `Estes termos são regidos pelas leis brasileiras. Fica eleito o foro do domicílio do consumidor,
    ou, na ausência deste, o foro da comarca de domicílio da Smartiza, para dirimir eventuais controvérsias.`,
  },
]

export const PRIVACIDADE_SECTIONS = [
  {
    title: '1. Quem trata seus dados',
    body: `A Smartiza, operadora do Confeitto, é a controladora dos dados pessoais tratados nesta política
    quando você se cadastra como lojista na plataforma. Cada loja criada no Confeitto é, por sua vez,
    controladora dos dados dos próprios clientes finais que compram nela — essa relação é descrita na
    política de privacidade de cada loja individualmente.`,
  },
  {
    title: '2. Quais dados coletamos de você (lojista)',
    body: `Nome, e-mail, telefone, CPF e data de nascimento (necessários para o processamento de pagamento),
    e dados de cartão de crédito — que nunca chegam aos nossos servidores em texto puro: a tokenização
    acontece no seu próprio navegador, diretamente com o gateway de pagamento, antes de qualquer dado
    trafegar até nós.`,
  },
  {
    title: '3. Por que coletamos',
    body: `Para criar e manter sua conta, provisionar sua loja, processar a cobrança da assinatura, prevenir
    fraude, cumprir obrigações legais e fiscais, e para contato sobre o próprio serviço (avisos de cobrança,
    suporte, atualizações relevantes).`,
  },
  {
    title: '4. Como protegemos seus dados',
    body: `Credenciais de pagamento são cifradas em repouso (AES-256). Cada loja opera isolada das demais —
    uma loja não tem acesso a dados de outra. Ações administrativas sensíveis (suspensão, alteração de
    assinatura, acesso de suporte à sua conta) ficam registradas em um log de auditoria. Fazemos backup
    periódico dos dados de cada loja.`,
  },
  {
    title: '5. O que acontece se você atrasar ou cancelar',
    body: `Atraso no pagamento suspende o acesso, nunca apaga dado. No cancelamento, seus dados são exportados
    automaticamente e mantidos em retenção antes de qualquer exclusão definitiva — você pode voltar a
    operar sua loja mesmo depois de um período parado.`,
  },
  {
    title: '6. Compartilhamento com terceiros',
    body: `Compartilhamos dados estritamente necessários com o gateway de pagamento (para processar cobranças)
    e com provedores de infraestrutura (hospedagem, envio de e-mail transacional). Não vendemos dados
    pessoais a terceiros para fins de marketing.`,
  },
  {
    title: '7. Seus direitos',
    body: `Como titular dos dados, você pode solicitar acesso, correção, portabilidade ou exclusão dos seus
    dados, revogar consentimentos e obter informações sobre o tratamento, conforme a LGPD (Lei nº 13.709/2018).
    Solicitações podem ser feitas pelos canais de contato da plataforma.`,
  },
  {
    title: '8. Retenção',
    body: `Mantemos seus dados enquanto sua conta estiver ativa e pelo período adicional necessário para
    cumprir obrigações legais (fiscais, contábeis) após o encerramento, respeitando os prazos mínimos
    exigidos pela legislação brasileira.`,
  },
  {
    title: '9. Contato',
    body: `Dúvidas sobre esta política ou sobre o tratamento dos seus dados podem ser enviadas para o
    e-mail de suporte informado no seu painel administrativo.`,
  },
]

export const BLOG_POSTS = [
  {
    slug: 'como-precificar-bolo-sem-prejuizo',
    title: 'Como precificar seu bolo sem sair no prejuízo',
    excerpt: 'A diferença entre "vender bastante" e "sobrar dinheiro no fim do mês" quase sempre está na precificação — e não no quanto você trabalha.',
    date: '2026-07-15',
    body: `
      <p>É comum a confeiteira olhar pro fim do mês, ver que vendeu bastante, e mesmo assim sentir que sobrou pouco.
      Na maioria das vezes o problema não é vender pouco — é precificar errado.</p>

      <h2>O erro mais comum: só contar o ingrediente</h2>
      <p>Quando você precifica só pelo custo do ingrediente ("gastei R$15 de farinha, ovo e recheio, vou cobrar R$30"),
      fica de fora tudo que também é custo real: o gás, a energia, a embalagem, o tempo que você gastou fazendo,
      e a parte da conta de luz que é da confeitaria mesmo trabalhando em casa.</p>

      <h2>A conta que realmente fecha</h2>
      <p>Uma forma simples de começar: some o custo direto dos ingredientes, adicione uma margem para custos fixos
      (proporcional ao quanto você produz no mês) e só depois aplique a margem de lucro que você quer ter.
      Preço de venda sem essa margem de lucro não é preço — é rateio de despesa.</p>

      <h2>Um exemplo com números</h2>
      <p>Pega um bolo de pote simples: R$8 de ingredientes, 40 minutos de preparo, embalagem de R$2.
      Se você só soma ingrediente + embalagem e cobra R$15, "ganhou" R$5 — mas não pagou nada pelos 40 minutos
      nem pela fatia da conta de luz e do gás daquele dia. Coloca um valor-hora, mesmo que baixo no começo
      (R$15/hora, por exemplo), e o mesmo bolo passa a custar R$20 de verdade antes de qualquer margem de lucro.
      A diferença entre R$15 e R$20 não é ganância — é o que estava sendo dado de graça sem perceber.</p>

      <h2>Cobrar igual ao concorrente não é estratégia, é risco</h2>
      <p>É comum olhar pro preço de outra confeitaria da região e cobrar parecido, achando que isso é "preço de
      mercado". O problema é que você não sabe o custo interno de quem você está copiando — pode ser que ela
      compre insumo mais barato, produza em volume maior, ou pior: pode estar com o preço tão errado quanto
      o seu. Preço de referência serve pra entender o teto que o cliente aceita pagar, não pra decidir se
      aquele valor cobre o seu custo.</p>

      <h2>O que fazer quando o preço do insumo sobe</h2>
      <p>Quando o preço do chocolate ou da farinha sobe (e sobe com frequência), o reflexo mais comum é não
      reajustar nada — por medo de perder cliente. O problema é que cada mês sem reajuste é margem que
      desaparece de verdade, não só no papel. O caminho mais seguro é revisar a ficha de custo do produto
      sempre que um insumo-chave mudar de preço, em vez de esperar o fim do mês pra descobrir que sobrou menos.</p>

      <h2>Por que isso trava tanta confeiteira</h2>
      <p>Fazer essa conta na mão, produto por produto, toda vez que o preço da farinha ou do chocolate muda, é
      trabalho — e é exatamente o tipo de trabalho que costuma ficar pra depois. É por isso que ferramentas de
      gestão como o <a href="/">Confeitto</a> calculam a margem automaticamente a partir do custo cadastrado:
      você atualiza o preço do insumo uma vez, e a margem de cada produto se ajusta sozinha.</p>
    `,
  },
  {
    slug: 'whatsapp-ou-loja-propria',
    title: 'WhatsApp ou loja própria: o que muda pro seu negócio crescer',
    excerpt: 'Vender só pelo WhatsApp funciona no começo. O problema aparece quando o número de pedidos cresce mais rápido que sua capacidade de responder.',
    date: '2026-07-20',
    body: `
      <p>Quase toda confeitaria começa vendendo pelo WhatsApp — e faz sentido, é onde o cliente já está.
      O problema aparece quando os pedidos crescem: cada venda vira uma conversa inteira repetida (cardápio,
      preço, disponibilidade, forma de pagamento), e a confeiteira passa mais tempo respondendo mensagem
      do que na cozinha.</p>

      <h2>O que uma loja própria resolve</h2>
      <p>Com uma vitrine online, o cliente vê o cardápio, os preços e a disponibilidade sozinho, monta o
      pedido, e paga — sem precisar de uma conversa pra cada etapa. O WhatsApp continua existindo, mas vira
      canal de atendimento, não o único caminho pra vender.</p>

      <h2>Isso substitui o WhatsApp?</h2>
      <p>Não precisa. O ideal é os dois trabalhando juntos: a loja resolve o pedido padrão sozinha, e o
      WhatsApp fica livre pra encomenda especial, dúvida de cliente, e o relacionamento que faz a pessoa
      voltar a comprar. É esse o modelo que a maioria das confeitarias que cresceram de verdade acabou adotando.</p>

      <h2>Sinais de que já passou da hora de migrar</h2>
      <p>Tem alguns sinais que costumam aparecer antes de a confeiteira perceber que precisa de uma loja: você
      perde pedido porque demorou pra responder, dois clientes fazem o mesmo pedido em horários diferentes e
      você esquece de um deles, ou você já perdeu as contas de quantas vezes mandou o cardápio em foto naquele
      dia. Nenhum desses problemas é falta de organização pessoal — é o WhatsApp sendo usado pra uma coisa que
      ele não foi feito pra fazer, que é gerenciar um catálogo e um fluxo de pedidos.</p>

      <h2>O que se perde numa conversa de WhatsApp</h2>
      <p>Uma conversa resolve o pedido daquele dia, mas não vira histórico útil: não dá pra saber, sem abrir
      cada conversa, quanto um cliente já comprou no total, o que ele mais pede, ou se um produto está saindo
      mais que outro. É informação que existe, mas fica presa em texto solto — nenhum relatório nasce disso
      sozinho.</p>

      <h2>"Meu cliente já está acostumado a pedir pelo zap"</h2>
      <p>Essa é a objeção mais comum, e é justamente por isso que a loja não substitui o WhatsApp: o link da
      loja pode ser mandado dentro da própria conversa, o cliente escolhe e paga sem sair do fluxo que já
      conhece, e você só entra na conversa se ele tiver alguma dúvida. Muda o que você faz manualmente, não
      o canal que o cliente já usa.</p>

      <h2>Por onde começar</h2>
      <p>Não precisa saber programar nem contratar ninguém pra montar isso — plataformas como o
      <a href="/">Confeitto</a> deixam sua loja no ar em minutos, com PIX automático já configurado.</p>
    `,
  },
  {
    slug: 'lgpd-na-sua-confeitaria',
    title: 'LGPD na sua confeitaria: o que você precisa saber',
    excerpt: 'Se você guarda nome, telefone ou endereço de cliente numa planilha ou caderno, a LGPD já se aplica ao seu negócio — mesmo pequeno.',
    date: '2026-07-25',
    body: `
      <p>Muita confeiteira acha que LGPD é assunto de empresa grande. Não é: se você guarda nome, telefone,
      endereço de entrega ou CPF de cliente — mesmo numa planilha, mesmo no caderno — a lei já se aplica ao
      seu negócio.</p>

      <h2>O que a lei realmente pede</h2>
      <p>Na prática, os pontos que mais pesam pra um negócio pequeno são: só pedir o dado que você realmente
      precisa, guardar com segurança, não vender nem compartilhar sem necessidade, e conseguir apagar o dado
      de um cliente se ele pedir.</p>

      <h2>Onde a maioria erra</h2>
      <p>O erro mais comum não é má-fé — é falta de estrutura. Planilha sem senha, número de WhatsApp salvo
      sem critério, dado de cliente antigo que nunca é apagado. Nada disso é feito por querer prejudicar
      ninguém, mas é exatamente o que a lei cobra que se resolva.</p>

      <h2>O que conta como dado pessoal, na prática</h2>
      <p>Não é só CPF e endereço: nome completo, telefone, e-mail, e até o histórico do que a pessoa comprou
      já contam como dado pessoal. Se essas informações identificam alguém, mesmo indiretamente, a LGPD se
      aplica — não importa se está numa planilha do Google, no bloco de notas do celular ou espalhado em
      conversas de WhatsApp.</p>

      <h2>O que pode acontecer se um negócio não se organizar</h2>
      <p>Não é sobre viver com medo de multa — pra negócio pequeno, o risco mais real costuma ser reputacional:
      um vazamento de dados de cliente (uma planilha compartilhada por engano, um celular perdido com o
      histórico de pedidos) vira um problema de confiança difícil de reverter, especialmente numa cidade
      pequena onde o boca a boca é a maior fonte de venda.</p>

      <h2>Um checklist simples pra começar</h2>
      <p>Três perguntas ajudam a saber se você está no caminho certo: você só coleta o dado que realmente
      precisa pra entregar o pedido? Ele está guardado em algum lugar com senha, não solto numa planilha
      compartilhada? E se um cliente pedir pra apagar os dados dele, você sabe onde procurar tudo que existe
      sobre essa pessoa? Se a resposta for "não" em alguma delas, já é um ponto concreto pra ajustar.</p>

      <h2>O que o Confeitto já resolve por você</h2>
      <p>Toda loja criada na plataforma já vem com política de privacidade própria, registro de consentimento
      do cliente no checkout, e um encarregado (DPO) configurável — sem você precisar entender a lei linha por
      linha pra estar em conformidade. É trabalho que fica pronto junto com o resto da loja.</p>
    `,
  },
]
