export type NationType = 'kingdom' | 'empire' | 'federation' | 'republic' | 'holy_empire'

export type RelationType = 'liege' | 'allied' | 'neutral' | 'wary' | 'hostile'

export interface Nation {
  id: string
  name: string
  type: NationType
  typeLabel: string
  color: string
  accentColor: string
  emblem: string
  capital: string
  ruler: string
  relation: RelationType
  relationLabel: string
  militaryPower: string
  economyPower: string
  description: string
  territoryPoints: [number, number][] // Polygon points for realm boundaries on canvas
}

export type FiefType = 'player' | 'capital' | 'neighbor' | 'fortress' | 'trade_port' | 'sanctuary'

export interface Fief {
  id: string
  name: string
  nationId: string
  type: FiefType
  x: number // Map coordinate (0 to 1600)
  y: number // Map coordinate (0 to 1100)
  rulerName: string
  title: string
  level: number
  defense: number
  economy: number
  specialty: string
  description: string
}

export interface MapTerrainFeature {
  type: 'mountain' | 'forest' | 'river' | 'lake' | 'desert'
  name: string
  x: number
  y: number
  width: number
  height: number
  label?: string
}
