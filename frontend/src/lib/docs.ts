import type { DocumentItem } from '../types'

export const CATEGORIES = ['Normas técnicas', 'Legislação', 'Boas práticas'] as const
export type Category = typeof CATEGORIES[number]

/** O backend não guarda categoria; ela é deduzida pelo nome do arquivo. */
export function categoryOf(name: string): Category {
  const n = name.toLowerCase()
  if (/lgpd|lei\b|decreto|marco civil/.test(n)) return 'Legislação'
  if (/iso|nbr|iec|abnt|nist|cis\b/.test(n)) return 'Normas técnicas'
  return 'Boas práticas'
}

export const CATEGORY_HINT: Record<Category, string> = {
  'Normas técnicas': 'Segurança e gestão',
  'Legislação': 'Privacidade e proteção de dados',
  'Boas práticas': 'Guias e referências',
}

export const displayName = (name: string) => name.replace(/\.[^.]+$/, '').replace(/\s+/g, ' ').replace(/_/g, ' ').trim()

export const TYPE_LABEL: Record<DocumentItem['type'], string> = { pdf: 'PDF', docx: 'DOCX', txt: 'TXT', md: 'MD' }

export const SUGGESTIONS = [
  { tag: 'Segurança da informação', icon: 'shield', q: 'Como posso começar a implementar segurança da informação na minha empresa?' },
  { tag: 'Incidentes', icon: 'alert', q: 'Um funcionário clicou em um link suspeito e inseriu suas credenciais. Quais os primeiros passos?' },
  { tag: 'LGPD', icon: 'scale', q: 'Como a LGPD influencia a criação de políticas de segurança nas empresas?' },
] as const

export const timeOf = (at: number) => new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
