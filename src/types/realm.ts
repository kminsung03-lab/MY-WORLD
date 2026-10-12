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

export type DiplomaticStage = 'none' | 'non_aggression' | 'alliance' | 'vassal'

export interface DiplomaticRouteEvaluation {
  neighborId: string
  neighborName: string
  stage: DiplomaticStage
  isSuspended: boolean
  suspendReason?: string
  costs: RealmResources
  yields: RealmResources
  net: RealmResources
  manpowerYield: number
  deltaRelation: number
  deltaLoyalty: number
}

export interface DiplomacySummary {
  evaluations: DiplomaticRouteEvaluation[]
  totalCosts: RealmResources
  totalYields: RealmResources
  totalNet: RealmResources
  totalManpowerYield: number
  activeAllianceCount: number
  activeVassalCount: number
  suspendedCount: number
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
  diplomaticStage?: DiplomaticStage
  treatyMonths?: number
  subjectLoyalty?: number
  treatySuspended?: boolean
  treatySuspendReason?: string
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

export type GovernanceMode =
  | 'military_occupation'
  | 'local_autonomy'
  | 'cultural_integration'

export type RebellionRiskTier = '안정' | '주의' | '경고' | '반란 임박'

export interface AnnexedTerritoryGovernance {
  neighborId: string
  governanceMode: GovernanceMode
  loyalty: number // 0 - 100
  unrest: number // 0 - 100
  integration: number // 0 - 100
  isCore: boolean
  lastReport?: string
}

export interface GovernedTerritoryEvaluation {
  neighborId: string
  neighborName: string
  specialty: string
  mode: GovernanceMode
  loyalty: number
  unrest: number
  integration: number
  isCore: boolean
  isFunded: boolean
  isStalled: boolean
  stalledReason?: string
  costs: RealmResources
  yields: RealmResources
  net: RealmResources
  deltaLoyalty: number
  deltaUnrest: number
  deltaIntegration: number
  rebellionRiskTier: RebellionRiskTier
}

export interface DominionGovernanceSummary {
  evaluations: GovernedTerritoryEvaluation[]
  totalCosts: RealmResources
  totalYields: RealmResources
  totalNet: RealmResources
  coreCount: number
  highRiskCount: number
  stalledCount: number
}

export interface RealmLog {
  id: string
  date: string
  title: string
  detail: string
  tone: 'good' | 'neutral' | 'danger' | 'royal'
}

export type RivalIntentType =
  | 'crown_audit'
  | 'crown_tithe'
  | 'sylvana_nature_pact'
  | 'sylvana_herbal_exchange'
  | 'ironridge_border_fortify'
  | 'ironridge_raid_threat'
  | 'auric_tariff_war'
  | 'auric_investment_offer'
  | 'goblin_border_raid'
  | 'goblin_tribute_demand'

export type RivalThreatLevel = '기회' | '주의' | '경고' | '위기'

export interface RivalCounterAction {
  id: string
  name: string
  description: string
  character: string
  costs: {
    capacities?: Partial<RealmCapacities>
    resources?: Partial<RealmResources>
  }
  outcomeHint: string
}

export interface RivalIntent {
  id: string
  neighborId: string
  type: RivalIntentType
  title: string
  summary: string
  threatLevel: RivalThreatLevel
  monthsRemaining: number
  chosenCounterActionId?: string | null
  counterStatus?: 'pending' | 'countered' | 'unprepared'
}

export type AmbitionVictoryId =
  | 'military_hegemony'
  | 'commercial_dominion'
  | 'royal_grand_duke'
  | 'grand_coalition'

export type AmbitionDefeatId =
  | 'crown_deposition'
  | 'bankrupt_anarchy'
  | 'conquest_collapse'

export interface AmbitionRequirement {
  label: string
  current: number
  target: number
  unit: string
  isMet: boolean
}

export interface AmbitionGoal {
  id: AmbitionVictoryId
  name: string
  title: string
  icon: string
  doctrineBranch: Exclude<Doctrine, 'unset'> | 'all'
  description: string
  requirements: AmbitionRequirement[]
  isCompleted: boolean
}

export interface DynastyAmbitionState {
  chosenAmbitionId?: AmbitionVictoryId | null
  triumphAchieved?: AmbitionVictoryId | null
  defeatTriggered?: AmbitionDefeatId | null
  acknowledgedOutcome?: boolean
}

export interface StrategicDirective {
  id: string
  step: number
  title: string
  description: string
  targetHint: string
  isCompleted: boolean
  rewardClaimed: boolean
  rewardDesc: string
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
  governance: Record<string, AnnexedTerritoryGovernance>
  logs: RealmLog[]
  pendingWorldEvent?: WorldEvent | null
  activeCampaign?: ActiveCampaign | null
  rivalIntents?: RivalIntent[]
  ambitionState?: DynastyAmbitionState
  directives?: StrategicDirective[]
}

