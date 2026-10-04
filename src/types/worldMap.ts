export type NationType = 'kingdom' | 'empire' | 'federation' | 'republic' | 'holy_empire' | 'wilderness'

export interface Nation {
  id: string
  name: string
  type: NationType
  typeLabel: string
  baseColor: string
  borderHighlightColor: string
  emblem: string
  capital: string
  ruler: string
  totalTroops: string
  relationLabel: string
  militaryPower: string
  economyPower: string
  description: string
}

export interface Province {
  id: string
  name: string
  nationId: string
  center: [number, number]
  vertices: [number, number][]
  color: string
  troops: string
  isPlayerFief?: boolean
  rulerName: string
  defense: number
  economy: number
  specialty: string
  description: string
}
