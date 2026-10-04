export interface Resources {
  gold: number
  wood: number
  stone: number
  iron: number
  food: number
}

export interface Territory {
  secured: number // Total secured land plots (from clearing monsters)
  used: number    // Used land plots by buildings
}

export interface Player {
  level: number
  exp: number
  maxExp: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  miningPower: number
}

export interface BuildingCost {
  gold: number
  wood: number
  stone: number
  iron: number
}

export interface Building {
  id: string
  name: string
  icon: string
  description: string
  level: number
  maxLevel: number
  landCost: number // Territory required per level
  baseCost: BuildingCost
  benefitText: string
}

export interface Monster {
  id: string
  name: string
  icon: string
  description: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  expReward: number
  goldReward: number
  territoryReward: number // Land unlocked upon defeating
  foodReward: number
  recommendedLevel: number
}

export interface MiningNode {
  id: string
  name: string
  icon: string
  description: string
  hp: number
  maxHp: number
  stoneReward: number
  ironReward: number
  goldReward: number
  reqMiningPower: number
}

export interface GameLog {
  id: string
  timestamp: string
  text: string
  type: 'info' | 'combat' | 'mine' | 'build' | 'level' | 'event'
}

export interface DayState {
  day: number
  ap: number
  maxAp: number
  upcomingWarning: string
}

export interface NightEvent {
  day: number
  title: string
  icon: string
  storyText: string
  resultText: string
  success: boolean
  resourceChanges?: Partial<Resources>
  hpChange?: number
  territoryChange?: number
  nextWarning: string
}

export interface GameState {
  dayState: DayState
  currentNightEvent: NightEvent | null
  resources: Resources
  territory: Territory
  player: Player
  buildings: Record<string, Building>
  logs: GameLog[]
}
