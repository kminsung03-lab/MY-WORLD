import type { RealmCapacities, RealmResources } from './realm'

export type FieldQuestId =
  | 'frontier_beast_patrol'
  | 'ancient_vein_prospecting'
  | 'wandering_artisan_convoy'

export interface RealmTrait {
  id: string
  name: string
  icon: string
  description: string
  durationMonths?: number // undefined for permanent
  effects: {
    monthlyTreasury?: number
    monthlyGrain?: number
    monthlyIron?: number
    monthlyTimber?: number
    adminBonus?: number
    commandBonus?: number
    diplomacyBonus?: number
    constructionDiscountRate?: number // e.g. 0.15 for 15% discount
  }
}

export interface FieldQuestRiskDisclosure {
  successRate: number // 0-100 percentage
  successTitle: string
  successPreview: string
  failureTitle: string
  failurePreview: string
  isRecoverable: boolean
}

export interface FieldQuestChoiceImpact {
  resources?: Partial<RealmResources>
  capacities?: Partial<RealmCapacities>
  stability?: number
  legitimacy?: number
  manpower?: number
  relationTargetId?: string
  relationDelta?: number
  traitAcquired?: RealmTrait
  logTitle: string
  logDetail: string
  logTone: 'good' | 'neutral' | 'danger' | 'royal'
}

export interface FieldQuestChoice {
  id: string
  label: string
  description: string
  costs?: Partial<RealmResources>
  costsCapacities?: Partial<RealmCapacities>
  riskDisclosure?: FieldQuestRiskDisclosure
  nextStepId?: string
  isTerminal?: boolean
  impact?: FieldQuestChoiceImpact
  failureImpact?: FieldQuestChoiceImpact
}

export interface FieldQuestStep {
  id: string
  title: string
  narrative: string
  choices: FieldQuestChoice[]
}

export interface FieldQuest {
  id: FieldQuestId
  title: string
  category: '안보·군사' | '탐사·자원' | '외교·인재'
  location: string
  summary: string
  currentStepId: string
  steps: Record<string, FieldQuestStep>
  isJackpotOpportunity?: boolean
  seed: number
  resolvedStepHistory?: string[]
}

export type CivicFocusId =
  | 'balanced'
  | 'agrarian_expansion'
  | 'deep_mining'
  | 'timber_harvest'
  | 'market_boom'
  | 'fortress_drill'

export type CivicBuildingId =
  | 'townHall'
  | 'residences'
  | 'granary'
  | 'fortifications'

export interface CivicBuilding {
  id: CivicBuildingId
  name: string
  icon: string
  level: number
  maxLevel: number
  description: string
  benefitText: string
  baseCost: RealmResources
}
