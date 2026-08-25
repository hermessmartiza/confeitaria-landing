// As perguntas do cadastro, em ordem, cada uma com sua própria validação.
//
// Separadas do componente de propósito: a tela vira um laço sobre esta lista, e
// adicionar/remover/reordenar campo não mexe em JSX nenhum. Cada `validar`
// devolve `null` (ok) ou a MENSAGEM que a pessoa vai ler — nada de códigos de
// erro traduzidos depois, porque foi assim que apareceu "é o titular do cartão"
// numa tela sem cartão.

export const soDigitos = (v) => String(v || '').replace(/\D/g, '')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Domínios que a gente vê errado com frequência — o custo de um email com typo
// é a pessoa nunca receber o acesso da loja que acabou de pagar.
const TYPOS = {
  'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmail.co': 'hotmail.com',
  'outlok.com': 'outlook.com', 'yahoo.com.b': 'yahoo.com.br',
}

export function sugestaoEmail(email) {
  const dominio = String(email).split('@')[1]?.toLowerCase()
  return dominio && TYPOS[dominio] ? email.replace(dominio, TYPOS[dominio]) : null
}

export function forcaSenha(senha) {
  let n = 0
  if (senha.length >= 8) n++
  if (senha.length >= 12) n++
  if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) n++
  if (/\d/.test(senha)) n++
  if (/[^A-Za-z0-9]/.test(senha)) n++
  return Math.min(n, 4) // 0-4
}

export const PERGUNTAS = [
  {
    id: 'email',
    titulo: 'Qual é o seu email?',
    ajuda: 'É por aqui que você entra no painel e recebe o acesso da loja.',
    tipo: 'email',
    placeholder: 'voce@email.com',
    autoComplete: 'email',
    validar: (v) => {
      if (!v.trim()) return 'Precisamos do seu email pra criar sua conta.'
      if (!EMAIL_RE.test(v.trim())) return 'Esse email não parece completo. Confira se tem o @ e o domínio, como em ana@gmail.com.'
      return null
    },
  },
  {
    id: 'password',
    titulo: 'Crie uma senha',
    ajuda: 'Pelo menos 8 caracteres. Guarde bem — é ela que abre o painel da sua loja.',
    tipo: 'password',
    placeholder: 'Sua senha',
    autoComplete: 'new-password',
    validar: (v) => {
      if (!v) return 'Escolha uma senha pra proteger sua conta.'
      if (v.length < 8) return `Faltam ${8 - v.length} caractere${8 - v.length > 1 ? 's' : ''} pra chegar em 8.`
      return null
    },
  },
  {
    id: 'name',
    titulo: 'Como podemos te chamar?',
    ajuda: 'Nome e sobrenome, como no seu documento.',
    tipo: 'text',
    placeholder: 'Ana Silva',
    autoComplete: 'name',
    validar: (v) => {
      const t = v.trim()
      if (!t) return 'Só pra gente saber com quem está falando.'
      if (/\d/.test(t)) return 'Nome não leva números — capricha aí. 🙂'
      if (!/\S+\s+\S+/.test(t)) return 'Faltou o sobrenome.'
      return null
    },
  },
  {
    id: 'phone',
    titulo: 'Qual seu WhatsApp?',
    ajuda: 'É por onde a gente fala com você se algo travar. Não vira lista de promoção.',
    tipo: 'tel',
    inputMode: 'numeric',
    placeholder: '(41) 99999-9999',
    autoComplete: 'tel',
    mascara: (v) => {
      const d = soDigitos(v).slice(0, 11)
      if (d.length > 10) return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
      if (d.length > 6) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
      if (d.length > 2) return d.replace(/(\d{2})(\d*)/, '($1) $2')
      return d
    },
    validar: (v) => {
      const d = soDigitos(v)
      if (!d) return 'Precisamos de um número pra te encontrar.'
      if (d.length < 10) return 'Faltam dígitos. Use DDD + número, como (41) 99999-9999.'
      if (d.length > 11) return 'Número com dígitos demais. Confira o DDD.'
      if (/^(\d)\1+$/.test(d)) return 'Esse número não parece real.'
      return null
    },
  },
  {
    id: 'storeName',
    titulo: 'E qual o nome da sua confeitaria?',
    ajuda: 'É o nome que suas clientes vão ver. Dá pra mudar depois.',
    tipo: 'text',
    placeholder: 'Doces da Ana',
    validar: (v) => {
      const t = v.trim()
      if (!t) return 'Sua loja precisa de um nome pra existir. 🎂'
      if (t.length < 2) return 'Um nome um pouquinho maior que isso.'
      if (t.length > 60) return 'Nome muito longo — tente algo com até 60 caracteres.'
      return null
    },
  },
]
