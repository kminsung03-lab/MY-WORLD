export type RealmResourceKey = 'treasury' | 'grain' | 'iron' | 'timber'
export type CapacityKey = 'administration' | 'diplomacy' | 'command'
export type Doctrine = 'unset' | 'stewardship' | 'commerce' | 'military'
export type IndustryId = 'farms' | 'ironworks' | 'market' | 'lumberyard'
export type PolicyId =
  | 'land_register'
  | 'royal_bureau'
  | 'merchant_charter'
  | 'free_port'
  | 'border_muster'
  | 'standing_guard'

export interface RealmResources {
  treasury: number
  grain: number
  iron: number
  timber: number
}
export interface RealmCapacities {
  administration: number
  diplomacy: number
  command: number
}

export interface RealmIndustry {
  id: IndustryId
  level: number
}

export type TradeContractId =
  | 'balanced_exchange'
  | 'provisions_import'
  | 'materials_import'
  | 'export_charter'

export interface TradeRouteEvaluation {
  neighborId: string
  neighborName: string
  contractId: TradeContractId
  isSuspended: boolean
  suspendReason?: string
  efficiency: number
  costs: RealmResources
  yields: RealmResources
  net: RealmResources
}

export interface NeighborRealm {
  id: string
  name: string
  title: string
  ruler: string
  icon: string
  relation: number
  strength: number
  attitude: '우호' | '중립' | '경계' | '적대' | '종주국'
  specialty: string
  tradeActive: boolean
  tradeContract?: TradeContractId | null
  claim: boolean
  annexed: boolean
  lastAction?: string
  lastActionDate?: string
}

export type WorldEventRisk = '낮음' | '보통' | '높음' | '위기'

export interface WorldEventChoiceEffects {
  treasury?: number
  grain?: number
  iron?: number
  timber?: number
  stability?: number
  legitimacy?: number
  autonomy?: number
  royalFavor?: number
  relation?: number
  neighborStrength?: number
  tradeActive?: boolean
}

export interface WorldEventChoice {
  id: string
  label: string
  description: string
  expectedEffects: string
  effects: WorldEventChoiceEffects
}

export interface WorldEvent {
  id: string
  neighborId: string
  senderName: string
  senderTitle: string
  senderIcon: string
  title: string
  description: string
  riskLevel: WorldEventRisk
  choices: [WorldEventChoice, WorldEventChoice]
}

export type CampaignOrderId = 'assault' | 'siege' | 'resupply'

export interface ActiveCampaign {
  targetId: string
  targetName: string
  startYear: number
  startMonth: number
  campaignTurn: number
  phase: string
  progress: number
  enemyMorale: number
  supply: number
  selectedOrder: CampaignOrderId | null
  lostSoldiers: number
  lostLevies: number
  lastReport?: string
}

export interface RealmLog {
  id: string
  date: string
  title: string
  detail: string
  tone: 'good' | 'neutral' | 'danger' | 'royal'
}

export interface RealmState {
  year: number
  month: number
  name: string
  ruler: string
  rank: string
  doctrine: Doctrine
  resources: RealmResources
  capacities: RealmCapacities
  industries: Record<IndustryId, RealmIndustry>
  policies: PolicyId[]
  population: number
  manpower: number
  soldiers: number
  levies: number
  stability: number
  legitimacy: number
  autonomy: number
  royalFavor: number
  neighbors: NeighborRealm[]
  logs: RealmLog[]
  pendingWorldEvent?: WorldEvent | null
  activeCampaign?: ActiveCampaign | null
}
