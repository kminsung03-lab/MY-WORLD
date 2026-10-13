import type { RealmState } from '../types/realm'

export type GrowthTier = 1 | 2 | 3
export type RealmSpecialization = 'balanced' | 'agrarian' | 'commercial' | 'military'
export type DistressLevel = 'normal' | 'distressed' | 'critical'

export interface RealmVisualAnalysis {
  tier: GrowthTier
  tierLabel: string
  tierTitle: string
  specialization: RealmSpecialization
  specLabel: string
  specIcon: string
  specColor: string
  distress: DistressLevel
  distressReason?: string
  
  // Specific progression scores (0 to 100)
  agriScore: number
  commScore: number
  milScore: number
  totalInvestmentPoints: number

  // Visual cues
  summaryPhrase: string
  recentMilestone: string
  nextGoal: string

  // Detailed visual elements
  features: {
    hasGranaryComplex: boolean
    hasGoldenFields: boolean
    hasWindmills: boolean
    hasBustlingMarket: boolean
    hasTradeCaravan: boolean
    hasMerchantGuild: boolean
    hasStoneWalls: boolean
    hasWatchtowers: boolean
    hasTrainingCamp: boolean
    hasKeepUpgrade: boolean
    hasSmokeAndRuins: boolean
    hasUnrestCrowd: boolean
  }
}

/**
 * Pure function that analyzes RealmState and evaluates the living realm's
 * visual growth tier, primary specialization, and distress level.
 * Does NOT mutate state or increase save game payload.
 */
export function analyzeRealmGrowth(state: RealmState): RealmVisualAnalysis {
  const civicBuildings = state.civicBuildings || {
    townHall: { id: 'townHall', name: '영주 관저', icon: '🏛️', level: 1 },
    residences: { id: 'residences', name: '정착민 거주구', icon: '🏘️', level: 1 },
    granary: { id: 'granary', name: '중앙 비축창고', icon: '🌾', level: 1 },
    fortifications: { id: 'fortifications', name: '외곽 방벽', icon: '🏰', level: 1 },
  }

  const farmsLvl = state.industries?.farms?.level ?? 1
  const marketLvl = state.industries?.market?.level ?? 1
  const ironworksLvl = state.industries?.ironworks?.level ?? 1
  const granaryLvl = civicBuildings.granary?.level ?? 1
  const fortLvl = civicBuildings.fortifications?.level ?? 1
  const hallLvl = civicBuildings.townHall?.level ?? 1
  const resLvl = civicBuildings.residences?.level ?? 1

  // 1. Calculate sector investment points
  // Agricultural points
  let agriScore = (farmsLvl - 1) * 20 + (granaryLvl - 1) * 25
  if (state.civicFocus === 'agrarian_expansion') agriScore += 20
  if (state.policies.includes('land_register')) agriScore += 20
  if (state.doctrine === 'stewardship') agriScore += 25
  if (state.resources.grain >= 600) agriScore += 10

  // Commercial points
  const activeTradeCount = state.neighbors.filter((n) => n.tradeActive && !n.annexed).length
  let commScore = (marketLvl - 1) * 20 + (hallLvl - 1) * 15 + activeTradeCount * 12
  if (state.civicFocus === 'market_boom') commScore += 20
  if (state.policies.includes('merchant_charter')) commScore += 20
  if (state.policies.includes('free_port')) commScore += 20
  if (state.doctrine === 'commerce') commScore += 25
  if (state.resources.treasury >= 800) commScore += 10

  // Military points
  const totalTroops = state.soldiers + Math.round(state.levies * 0.5)
  let milScore = (fortLvl - 1) * 25 + (ironworksLvl - 1) * 18
  if (totalTroops >= 300) milScore += 15
  if (totalTroops >= 600) milScore += 20
  if (state.civicFocus === 'fortress_drill') milScore += 20
  if (state.policies.includes('standing_guard')) milScore += 20
  if (state.policies.includes('border_muster')) milScore += 15
  if (state.doctrine === 'military') milScore += 25

  agriScore = Math.min(100, Math.max(0, agriScore))
  commScore = Math.min(100, Math.max(0, commScore))
  milScore = Math.min(100, Math.max(0, milScore))

  // Total concrete investment points (cannot grow simply by idle months passing!)
  const buildingUpgrades =
    (farmsLvl - 1) + (marketLvl - 1) + (ironworksLvl - 1) +
    (granaryLvl - 1) + (fortLvl - 1) + (hallLvl - 1) + (resLvl - 1)
  const policyCount = state.policies.length
  const totalInvestmentPoints = (buildingUpgrades * 14) + (policyCount * 12) + (activeTradeCount * 8)

  const maxScore = Math.max(agriScore, commScore, milScore)

  // 2. Determine Tier (Must be earned by concrete physical investments, not free time)
  const hasLevel3Structure =
    farmsLvl >= 3 || marketLvl >= 3 || ironworksLvl >= 3 ||
    granaryLvl >= 3 || fortLvl >= 3 || hallLvl >= 3 || resLvl >= 3

  let tier: GrowthTier = 1
  if (
    (hasLevel3Structure && buildingUpgrades >= 2 && (totalInvestmentPoints >= 45 || maxScore >= 65)) ||
    (totalInvestmentPoints >= 75 && buildingUpgrades >= 3)
  ) {
    tier = 3
  } else if (
    totalInvestmentPoints >= 18 ||
    buildingUpgrades >= 1 ||
    policyCount >= 1 ||
    maxScore >= 25
  ) {
    tier = 2
  }

  // 3. Determine Primary Specialization
  let specialization: RealmSpecialization = 'balanced'
  if (maxScore >= 24) {
    if (agriScore === maxScore && agriScore >= commScore + 8 && agriScore >= milScore + 8) {
      specialization = 'agrarian'
    } else if (commScore === maxScore && commScore >= agriScore + 8 && commScore >= milScore + 8) {
      specialization = 'commercial'
    } else if (milScore === maxScore && milScore >= agriScore + 8 && milScore >= commScore + 8) {
      specialization = 'military'
    } else {
      // If two are close or above threshold, choose the one distinctly matching doctrine/focus
      if (state.doctrine === 'stewardship' || state.civicFocus === 'agrarian_expansion') {
        specialization = 'agrarian'
      } else if (state.doctrine === 'commerce' || state.civicFocus === 'market_boom') {
        specialization = 'commercial'
      } else if (state.doctrine === 'military' || state.civicFocus === 'fortress_drill') {
        specialization = 'military'
      } else {
        specialization = agriScore > commScore && agriScore > milScore ? 'agrarian' :
                         commScore > milScore ? 'commercial' :
                         milScore > 20 ? 'military' : 'balanced'
      }
    }
  }

  // 4. Determine Distress / Damage
  let distress: DistressLevel = 'normal'
  let distressReason: string | undefined

  const uncounteredCrisis = state.rivalIntents?.find(
    (i) => (i.threatLevel === '위기' || i.threatLevel === '경고') && i.counterStatus !== 'countered' && i.monthsRemaining <= 1
  )

  if (state.stability < 30 || (state.activeCampaign && state.activeCampaign.phase.includes('패전'))) {
    distress = 'critical'
    distressReason = state.stability < 30 ? '심각한 민심 붕괴 및 치안 공백' : '전선 패퇴 및 영내 침탈 피해'
  } else if (state.stability < 48 || state.activeCampaign || uncounteredCrisis) {
    distress = 'distressed'
    distressReason = uncounteredCrisis
      ? `적대 세력(${uncounteredCrisis.title})의 침입 위협 임박`
      : state.activeCampaign
      ? `전장 원정 수행에 따른 후방 물자 징발 및 긴장`
      : '치안 불안정과 잦은 민원'
  }

  // 5. Tier & Spec Titles
  let tierTitle = '초기 개척 장원'
  let tierLabel = '제1단계 (개척 정착촌)'
  if (tier === 2) {
    tierTitle = specialization === 'agrarian' ? '번창하는 곡창 성읍' :
                specialization === 'commercial' ? '성장하는 시장 소도시' :
                specialization === 'military' ? '견고한 변경 요새진' : '정돈된 자치 성읍'
    tierLabel = '제2단계 (발전 성읍)'
  } else if (tier === 3) {
    tierTitle = specialization === 'agrarian' ? '황금 대곡창 영지' :
                specialization === 'commercial' ? '번영하는 상업 중심도시' :
                specialization === 'military' ? '철벽의 군사 수도' : '융성한 변경 중심도시'
    tierLabel = '제3단계 (번영 중심도시)'
  }

  let specLabel = '균형 내정형'
  let specIcon = '⚖️'
  let specColor = '#38bdf8'
  if (specialization === 'agrarian') {
    specLabel = '농업·곡창 특화'
    specIcon = '🌾'
    specColor = '#22c55e'
  } else if (specialization === 'commercial') {
    specLabel = '상업·무역 특화'
    specIcon = '🪙'
    specColor = '#eab308'
  } else if (specialization === 'military') {
    specLabel = '방벽·군사 특화'
    specIcon = '🛡️'
    specColor = '#ef4444'
  }

  // 6. Summary Phrase & Chronicle Notes
  let summaryPhrase = '소박한 목책과 개척 농가들이 흩어져 있는 변경의 시작점입니다.'
  if (distress === 'critical') {
    summaryPhrase = '전란과 불안정으로 외곽 시설 곳곳에서 연기가 피어오르고 장벽이 훼손되었습니다.'
  } else if (distress === 'distressed') {
    summaryPhrase = '대외 긴장과 물자 징발로 경계가 삼엄하며 민심 동요가 관측됩니다.'
  } else if (tier === 3) {
    if (specialization === 'agrarian') summaryPhrase = '지평선 가득 황금빛 보리밭과 사일로, 풍차가 돌아가는 대륙 굴지의 곡창입니다.'
    else if (specialization === 'commercial') summaryPhrase = '포석 광장과 거대 상단 장터, 환전소에 각국 상인이 운집한 대무역 거점입니다.'
    else if (specialization === 'military') summaryPhrase = '다중 석조 옹벽과 능보, 높게 솟은 감시탑과 상비군 열병이 돋보이는 난공불락의 요새입니다.'
    else summaryPhrase = '행정 관저와 성벽, 풍요로운 농경과 시장이 어우러진 번영의 변경 중심도시입니다.'
  } else if (tier === 2) {
    if (specialization === 'agrarian') summaryPhrase = '개간된 계단식 농지와 중앙 비축창고가 증설되어 식량이 넉넉해진 농경 성읍입니다.'
    else if (specialization === 'commercial') summaryPhrase = '도로 포장과 천막 시장, 정기 상단 통로가 개설되어 활기가 도는 상업 소도시입니다.'
    else if (specialization === 'military') summaryPhrase = '외곽에 목책 대신 석조 방벽과 감시초소가 세워져 전운에 대비하는 요새형 성읍입니다.'
    else summaryPhrase = '기본 인프라가 갖추어져 인구가 늘고 자급 체계가 정착된 성읍입니다.'
  }

  // Recent Milestone
  let recentMilestone = '개척 깃발 수립 및 에르덴 본령 인프라 기반 확보'
  if (specialization === 'agrarian' && (farmsLvl >= 2 || granaryLvl >= 2)) {
    recentMilestone = `농지(Lv.${farmsLvl}) 개간과 비축창고(Lv.${granaryLvl}) 증축으로 대규모 수확 기틀 마련`
  } else if (specialization === 'commercial' && (marketLvl >= 2 || activeTradeCount > 0)) {
    recentMilestone = `시장(Lv.${marketLvl}) 개설 및 ${activeTradeCount > 0 ? `${activeTradeCount}개국 교역로 개통` : '상권 집중 육성'}으로 국고 유입 확대`
  } else if (specialization === 'military' && (fortLvl >= 2 || totalTroops >= 300)) {
    recentMilestone = `외곽 방벽(Lv.${fortLvl}) 축조 및 군세(${totalTroops}명) 결집으로 국경 방어선 완비`
  } else if (tier >= 2) {
    recentMilestone = `영주 관저(Lv.${hallLvl})와 주거구(Lv.${resLvl}) 확충을 통한 중심 시가지 형성`
  }

  // Next Goal
  let nextGoal = '시설 증축 또는 시정 집중을 통해 2단계 성읍으로 도약하십시오.'
  if (distress !== 'normal') {
    nextGoal = '안정도를 50% 이상으로 회복하고 전선을 수습하여 훼손된 구역을 복구하십시오.'
  } else if (tier === 3) {
    nextGoal = '가문 대망(Ambition)을 달성하여 대륙 전체의 패자 또는 맹주로 거듭나십시오.'
  } else if (tier === 2) {
    if (specialization === 'agrarian') nextGoal = '농지 Lv.3 달성 또는 식량 600석 비축으로 대륙 제일의 황금 곡창을 완성하십시오.'
    else if (specialization === 'commercial') nextGoal = '시장 Lv.3 확충 및 다자간 교역 협정을 체결하여 상업 메트로폴리스를 건립하십시오.'
    else if (specialization === 'military') nextGoal = '방벽 Lv.3 완공 및 상비군 500명 이상을 소집하여 난공불락의 군사 수도를 구축하십시오.'
    else nextGoal = '특정 산업(농업/상업/군사)에 집중 투자하여 고유 특화 중심도시로 발전시키십시오.'
  }

  // Features map
  const features = {
    hasGranaryComplex: granaryLvl >= 2 || farmsLvl >= 3,
    hasGoldenFields: farmsLvl >= 2 || state.civicFocus === 'agrarian_expansion',
    hasWindmills: farmsLvl >= 3 || (farmsLvl >= 2 && tier >= 2),
    hasBustlingMarket: marketLvl >= 2 || state.civicFocus === 'market_boom',
    hasTradeCaravan: activeTradeCount >= 1 || marketLvl >= 3,
    hasMerchantGuild: marketLvl >= 3 || state.policies.includes('merchant_charter'),
    hasStoneWalls: fortLvl >= 2 || state.policies.includes('standing_guard'),
    hasWatchtowers: fortLvl >= 2 || state.civicFocus === 'fortress_drill',
    hasTrainingCamp: totalTroops >= 300 || fortLvl >= 3,
    hasKeepUpgrade: hallLvl >= 2 || tier >= 2,
    hasSmokeAndRuins: distress === 'critical' || (distress === 'distressed' && state.stability < 40),
    hasUnrestCrowd: distress === 'critical' || state.stability < 35,
  }

  return {
    tier,
    tierLabel,
    tierTitle,
    specialization,
    specLabel,
    specIcon,
    specColor,
    distress,
    distressReason,
    agriScore,
    commScore,
    milScore,
    totalInvestmentPoints,
    summaryPhrase,
    recentMilestone,
    nextGoal,
    features,
  }
}
