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
  claim: boolean
  annexed: boolean
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
}
