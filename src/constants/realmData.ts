import type {
  AnnexedTerritoryGovernance,
  CampaignOrderId,
  Doctrine,
  DominionGovernanceSummary,
  GovernanceMode,
  GovernedTerritoryEvaluation,
  IndustryId,
  NeighborRealm,
  PolicyId,
  RealmResources,
  RealmState,
  RebellionRiskTier,
  TradeContractId,
  TradeRouteEvaluation,
} from '../types/realm'

export interface IndustryDefinition {
  id: IndustryId
  name: string
  icon: string
  description: string
  terrain: string
  baseCost: number
  timberCost: number
  output: string
}
export interface PolicyDefinition {
  id: PolicyId
  branch: Exclude<Doctrine, 'unset'>
  name: string
  icon: string
  description: string
  effect: string
  cost: number
  capacity: 'administration' | 'diplomacy' | 'command'
  requires?: PolicyId
}

export const INDUSTRIES: IndustryDefinition[] = [
  {
    id: 'farms',
    name: '비옥한 하곡 농장',
    icon: '🌾',
    description: '강변의 충적토를 개간해 인구와 군대를 먹여 살립니다.',
    terrain: '강변 평야 특화',
    baseCost: 70,
    timberCost: 12,
    output: '월 식량 +18 · 세입 +6',
  },
  {
    id: 'ironworks',
    name: '회색능선 제철소',
    icon: '⚒️',
    description: '북부 구릉의 철광을 무기와 농기구로 가공합니다.',
    terrain: '구릉 광맥 특화',
    baseCost: 95,
    timberCost: 18,
    output: '월 철 +7 · 세입 +5',
  },
  {
    id: 'market',
    name: '세 갈래길 시장',
    icon: '⚖️',
    description: '왕도와 변경을 잇는 상인들에게 창고와 거래권을 제공합니다.',
    terrain: '교역로 특화',
    baseCost: 85,
    timberCost: 16,
    output: '월 세입 +18 · 교역 효율',
  },
  {
    id: 'lumberyard',
    name: '검은솔 벌목장',
    icon: '🪵',
    description: '서부 삼림을 계획적으로 벌채해 건축재를 공급합니다.',
    terrain: '침엽수림 특화',
    baseCost: 65,
    timberCost: 8,
    output: '월 목재 +10 · 세입 +4',
  },
]

export const POLICIES: PolicyDefinition[] = [
  {
    id: 'land_register',
    branch: 'stewardship',
    name: '토지대장 정비',
    icon: '📜',
    description: '장원과 자유민의 토지를 측량해 누락된 세원을 찾습니다.',
    effect: '산업 세입 +15% · 안정도 +3',
    cost: 80,
    capacity: 'administration',
  },
  {
    id: 'royal_bureau',
    branch: 'stewardship',
    name: '영주 직속 관료원',
    icon: '🏛️',
    description: '가신의 사병과 장부를 영주 직속 관리가 감독합니다.',
    effect: '월 행정력 +1 · 자치도 +3',
    cost: 125,
    capacity: 'administration',
    requires: 'land_register',
  },
  {
    id: 'merchant_charter',
    branch: 'commerce',
    name: '상인 조합 특허장',
    icon: '🪙',
    description: '상단에 제한된 자치와 분쟁 조정권을 부여합니다.',
    effect: '교역 수입 +50% · 외교력 +1',
    cost: 80,
    capacity: 'diplomacy',
  },
  {
    id: 'free_port',
    branch: 'commerce',
    name: '에르덴 자유시장',
    icon: '⛵',
    description: '관세를 낮춰 대륙 각지의 상단과 모험가를 끌어들입니다.',
    effect: '활성 교역로당 금화 +12 · 인구 성장',
    cost: 125,
    capacity: 'diplomacy',
    requires: 'merchant_charter',
  },
  {
    id: 'border_muster',
    branch: 'military',
    name: '변경 동원령',
    icon: '🛡️',
    description: '각 촌락의 동원 명부를 정리하고 봉화를 수리합니다.',
    effect: '징집병 +180 · 지휘력 +1',
    cost: 80,
    capacity: 'command',
  },
  {
    id: 'standing_guard',
    branch: 'military',
    name: '상비 변경수비대',
    icon: '⚔️',
    description: '계절에 흔들리지 않는 봉급제 정예병을 창설합니다.',
    effect: '상비군 전투력 +25% · 유지비 +8',
    cost: 125,
    capacity: 'command',
    requires: 'border_muster',
  },
]

export interface CampaignOrderDefinition {
  id: CampaignOrderId
  name: string
  icon: string
  description: string
  character: string
  costs: {
    treasury: number
    grain: number
    iron: number
    timber: number
  }
  requiresProgress?: number
}

export const CAMPAIGN_ORDERS: CampaignOrderDefinition[] = [
  {
    id: 'assault',
    name: '정면 공세',
    icon: '⚔️',
    description: '적의 외곽 방어선과 주력 부대를 향해 상비군과 징집병을 총동원해 돌격합니다.',
    character: '신속한 진군 · 적 사기 감소 · 큰 보급 소모 및 높은 사상자 발생',
    costs: { treasury: 20, grain: 25, iron: 10, timber: 0 },
  },
  {
    id: 'siege',
    name: '포위·공성',
    icon: '🏰',
    description: '거점을 완전 봉쇄하고 투석기와 공성구를 조립해 적 요새의 항복을 압박합니다.',
    character: '적 사기 대폭 감소 · 안정적 진군 · 중간 보급 소모 및 낮은 사상자',
    costs: { treasury: 15, grain: 20, iron: 0, timber: 15 },
    requiresProgress: 45,
  },
  {
    id: 'resupply',
    name: '보급선 정비',
    icon: '📦',
    description: '본령으로부터 수레와 군수물자를 호송받고 진지를 보수하며 장병을 휴식시킵니다.',
    character: '원정 보급 대폭 회복 · 진군 정체 · 최소 사상자 및 전열 정비',
    costs: { treasury: 25, grain: 15, iron: 0, timber: 0 },
  },
]

export interface TradeContractDefinition {
  id: TradeContractId
  name: string
  icon: string
  description: string
  character: string
  baseCosts: RealmResources
  baseYields: RealmResources
  partnerOverrides: Record<
    string,
    {
      partnerBonusLabel: string
      costs?: Partial<RealmResources>
      yields?: Partial<RealmResources>
    }
  >
}

export const TRADE_CONTRACTS: TradeContractDefinition[] = [
  {
    id: 'balanced_exchange',
    name: '균형 교역 협정',
    icon: '⚖️',
    description: '상호 관세를 낮추고 상인들에게 안전 통행권을 제공해 안정적인 국고 세입과 소량의 특산품을 확보합니다.',
    character: '투입 자원 없음 · 안정적 금화 세입 및 파트너 특산 자원 획득',
    baseCosts: { treasury: 0, grain: 0, iron: 0, timber: 0 },
    baseYields: { treasury: 14, grain: 0, iron: 0, timber: 0 },
    partnerOverrides: {
      crown: {
        partnerBonusLabel: '왕실 궁정의 사치품 수요로 세입 증가 (+4🪙, +2🌾)',
        yields: { treasury: 18, grain: 2 },
      },
      sylvana: {
        partnerBonusLabel: '고대 수림의 희귀 정령목과 약초 유입 (+8🌾, +6🪵)',
        yields: { treasury: 10, grain: 8, timber: 6 },
      },
      ironridge: {
        partnerBonusLabel: '북부 제련 광맥의 정제 철 공급 (+6⛓)',
        yields: { treasury: 10, iron: 6 },
      },
      auric: {
        partnerBonusLabel: '자유시 금융 어음 및 해상 관세 극대화 (+8🪙)',
        yields: { treasury: 22 },
      },
      goblin: {
        partnerBonusLabel: '황야의 노획 금속 및 사냥감 거래 (+10🌾, +3⛓)',
        yields: { treasury: 8, grain: 10, iron: 3 },
      },
    },
  },
  {
    id: 'provisions_import',
    name: '군량·식량 수입 계약',
    icon: '🌾',
    description: '국고를 지출하여 파트너 국가의 곡물과 가공 식량을 대량 매입해 영지 인구 증가와 군대 보급을 지원합니다.',
    character: '국고 소모 · 대량의 식량 획득 · 기근 및 군비 확장 대비',
    baseCosts: { treasury: 16, grain: 0, iron: 0, timber: 0 },
    baseYields: { treasury: 0, grain: 34, iron: 0, timber: 0 },
    partnerOverrides: {
      crown: {
        partnerBonusLabel: '왕실 구휼미 지원금 환급 (+4🪙, +28🌾)',
        yields: { treasury: 4, grain: 28 },
      },
      sylvana: {
        partnerBonusLabel: '원시림의 비옥한 산림 식생 대풍작 (+44🌾)',
        yields: { grain: 44 },
      },
      ironridge: {
        partnerBonusLabel: '척박한 고산 지형으로 곡물 수급 제한 (+24🌾)',
        yields: { grain: 24 },
      },
      auric: {
        partnerBonusLabel: '대형 수송선단 운임 절감 (비용 🪙12로 할인, +34🌾)',
        costs: { treasury: 12 },
        yields: { grain: 34 },
      },
      goblin: {
        partnerBonusLabel: '황야의 야생 가축과 건육 교환 (+38🌾, +2⛓)',
        yields: { grain: 38, iron: 2 },
      },
    },
  },
  {
    id: 'materials_import',
    name: '자재·철재 수입 계약',
    icon: '⚒️',
    description: '국고를 투입해 성채 방벽 보수, 산업 확장, 상비군 무장에 필요한 철과 목재 등 핵심 원자재를 수입합니다.',
    character: '국고 소모 · 철 및 목재 수급 · 산업 개발 및 상비군 편성 특화',
    baseCosts: { treasury: 18, grain: 0, iron: 0, timber: 0 },
    baseYields: { treasury: 0, grain: 0, iron: 8, timber: 12 },
    partnerOverrides: {
      crown: {
        partnerBonusLabel: '관청 건축 보조금 지원 (+4🪙, +8⛓, +12🪵)',
        yields: { treasury: 4, iron: 8, timber: 12 },
      },
      sylvana: {
        partnerBonusLabel: '실바나산 최상급 정령목 집중 공급 (+4⛓, +22🪵)',
        yields: { iron: 4, timber: 22 },
      },
      ironridge: {
        partnerBonusLabel: '철령의 풍부한 철광석 집중 공급 (+16⛓, +4🪵)',
        yields: { iron: 16, timber: 4 },
      },
      auric: {
        partnerBonusLabel: '해상 원거리 무역을 통한 균형 자재 공급 (+10⛓, +14🪵)',
        yields: { iron: 10, timber: 14 },
      },
      goblin: {
        partnerBonusLabel: '동부 황야의 거친 노획 고철과 벌목재 (+10⛓, +8🪵)',
        yields: { iron: 10, timber: 8 },
      },
    },
  },
  {
    id: 'export_charter',
    name: '영지 특산물 수출 특허',
    icon: '🪙',
    description: '에르덴의 잉여 농산물과 삼림 목재를 가공 수출하여 국고에 막대한 무역 이윤을 남깁니다.',
    character: '식량 및 목재 소모 · 막대한 금화 세입 창출 · 경제 번영 특화',
    baseCosts: { treasury: 0, grain: 16, iron: 0, timber: 8 },
    baseYields: { treasury: 38, grain: 0, iron: 0, timber: 0 },
    partnerOverrides: {
      crown: {
        partnerBonusLabel: '왕실 조달청 전매 특허로 우대 매입 (소모 🌾12·🪵6, 세입 +44🪙)',
        costs: { grain: 12, timber: 6 },
        yields: { treasury: 44 },
      },
      sylvana: {
        partnerBonusLabel: '삼림 보호국으로 목재 불필요 (소모 🌾20·🪵0, 세입 +38🪙)',
        costs: { grain: 20, timber: 0 },
        yields: { treasury: 38 },
      },
      ironridge: {
        partnerBonusLabel: '산악 광산 노동자 곡물 수요 집중 (소모 🌾18·🪵4, 세입 +36🪙)',
        costs: { grain: 18, timber: 4 },
        yields: { treasury: 36 },
      },
      auric: {
        partnerBonusLabel: '자유시 국제 무역망을 통한 최고가 매각 (세입 +48🪙)',
        yields: { treasury: 48 },
      },
      goblin: {
        partnerBonusLabel: '황야 부족의 구매력 한계로 저단가 수출 (소모 🌾14·🪵6, 세입 +32🪙)',
        costs: { grain: 14, timber: 6 },
        yields: { treasury: 32 },
      },
    },
  },
]

export function calculateNeighborEfficiency(relation: number): number {
  return Math.max(65, Math.min(135, Math.round(100 + relation * 0.35)))
}

export function evaluateTradeRoutes(
  neighbors: NeighborRealm[],
  resources: RealmResources,
  policies: PolicyId[],
  activeCampaignTargetId?: string | null,
): {
  routes: TradeRouteEvaluation[]
  activeCount: number
  suspendedCount: number
  totalNet: RealmResources
  totalYields: RealmResources
  totalCosts: RealmResources
} {
  const workingBudget: RealmResources = {
    treasury: resources.treasury,
    grain: resources.grain,
    iron: resources.iron,
    timber: resources.timber,
  }

  const routes: TradeRouteEvaluation[] = []
  let activeCount = 0
  let suspendedCount = 0
  const totalNet: RealmResources = { treasury: 0, grain: 0, iron: 0, timber: 0 }
  const totalYields: RealmResources = { treasury: 0, grain: 0, iron: 0, timber: 0 }
  const totalCosts: RealmResources = { treasury: 0, grain: 0, iron: 0, timber: 0 }

  const hasMerchantCharter = policies.includes('merchant_charter')
  const hasFreePort = policies.includes('free_port')

  for (const neighbor of neighbors) {
    if (!neighbor.tradeActive || neighbor.annexed || (activeCampaignTargetId && neighbor.id === activeCampaignTargetId)) {
      continue
    }

    const contractId: TradeContractId = neighbor.tradeContract || 'balanced_exchange'
    const contractDef = TRADE_CONTRACTS.find((c) => c.id === contractId) || TRADE_CONTRACTS[0]
    const override = contractDef.partnerOverrides[neighbor.id]

    const costs: RealmResources = {
      treasury: override?.costs?.treasury ?? contractDef.baseCosts.treasury,
      grain: override?.costs?.grain ?? contractDef.baseCosts.grain,
      iron: override?.costs?.iron ?? contractDef.baseCosts.iron,
      timber: override?.costs?.timber ?? contractDef.baseCosts.timber,
    }

    const baseYields: RealmResources = {
      treasury: override?.yields?.treasury ?? contractDef.baseYields.treasury,
      grain: override?.yields?.grain ?? contractDef.baseYields.grain,
      iron: override?.yields?.iron ?? contractDef.baseYields.iron,
      timber: override?.yields?.timber ?? contractDef.baseYields.timber,
    }

    const efficiency = calculateNeighborEfficiency(neighbor.relation)
    const effRate = efficiency / 100

    // Atomic pre-month resource budget affordability check
    const canAfford =
      workingBudget.treasury >= costs.treasury &&
      workingBudget.grain >= costs.grain &&
      workingBudget.iron >= costs.iron &&
      workingBudget.timber >= costs.timber

    if (!canAfford) {
      suspendedCount += 1
      let reason = '자원 부족'
      if (workingBudget.treasury < costs.treasury) {
        reason = `국고 부족 (필요 🪙${costs.treasury} / 가용 🪙${workingBudget.treasury})`
      } else if (workingBudget.grain < costs.grain) {
        reason = `식량 부족 (필요 🌾${costs.grain} / 가용 🌾${workingBudget.grain})`
      } else if (workingBudget.timber < costs.timber) {
        reason = `목재 부족 (필요 🪵${costs.timber} / 가용 🪵${workingBudget.timber})`
      } else if (workingBudget.iron < costs.iron) {
        reason = `철 부족 (필요 ⛓${costs.iron} / 가용 ⛓${workingBudget.iron})`
      }

      routes.push({
        neighborId: neighbor.id,
        neighborName: neighbor.name,
        contractId,
        isSuspended: true,
        suspendReason: reason,
        efficiency,
        costs: { treasury: 0, grain: 0, iron: 0, timber: 0 },
        yields: { treasury: 0, grain: 0, iron: 0, timber: 0 },
        net: { treasury: 0, grain: 0, iron: 0, timber: 0 },
      })
    } else {
      activeCount += 1
      // Deduct from shared working budget atomically
      workingBudget.treasury -= costs.treasury
      workingBudget.grain -= costs.grain
      workingBudget.iron -= costs.iron
      workingBudget.timber -= costs.timber

      let treasuryYield = Math.round(baseYields.treasury * effRate)
      if (hasMerchantCharter && treasuryYield > 0) {
        treasuryYield = Math.round(treasuryYield * 1.5)
      }
      if (hasFreePort) {
        treasuryYield += 6
      }

      const grainYield = Math.round(baseYields.grain * effRate) + (hasFreePort && baseYields.grain > 0 ? 5 : 0)
      const ironYield = Math.round(baseYields.iron * effRate)
      const timberYield = Math.round(baseYields.timber * effRate)

      const finalYields: RealmResources = {
        treasury: treasuryYield,
        grain: grainYield,
        iron: ironYield,
        timber: timberYield,
      }

      const net: RealmResources = {
        treasury: finalYields.treasury - costs.treasury,
        grain: finalYields.grain - costs.grain,
        iron: finalYields.iron - costs.iron,
        timber: finalYields.timber - costs.timber,
      }

      totalCosts.treasury += costs.treasury
      totalCosts.grain += costs.grain
      totalCosts.iron += costs.iron
      totalCosts.timber += costs.timber

      totalYields.treasury += finalYields.treasury
      totalYields.grain += finalYields.grain
      totalYields.iron += finalYields.iron
      totalYields.timber += finalYields.timber

      totalNet.treasury += net.treasury
      totalNet.grain += net.grain
      totalNet.iron += net.iron
      totalNet.timber += net.timber

      routes.push({
        neighborId: neighbor.id,
        neighborName: neighbor.name,
        contractId,
        isSuspended: false,
        efficiency,
        costs,
        yields: finalYields,
        net,
      })
    }
  }

  return {
    routes,
    activeCount,
    suspendedCount,
    totalNet,
    totalYields,
    totalCosts,
  }
}

export interface TerritoryProfile {
  id: string
  name: string
  title: string
  icon: string
  traitName: string
  traitDescription: string
  specialtySummary: string
  militaryOccupation: {
    costs: RealmResources
    yields: RealmResources
    deltaLoyalty: number
    deltaUnrest: number
    deltaIntegration: number
    characterDescription: string
  }
  localAutonomy: {
    costs: RealmResources
    yields: RealmResources
    deltaLoyalty: number
    deltaUnrest: number
    deltaIntegration: number
    characterDescription: string
  }
  culturalIntegration: {
    monthlyCost: number
    yields: RealmResources
    deltaLoyalty: number
    deltaUnrest: number
    deltaIntegration: number
    characterDescription: string
  }
  coreYields: RealmResources
}

export const TERRITORY_PROFILES: Record<string, TerritoryProfile> = {
  sylvana: {
    id: 'sylvana',
    name: '실바나 숲의회',
    title: '고대 수림의 연맹',
    icon: '🌲',
    traitName: '수림의 연대와 저항',
    traitDescription: '수림의 엘프와 부족민은 무력 억압에 거세게 저항하지만, 자치나 문화가 존중되면 풍부한 정령목과 약초를 기꺼이 바칩니다.',
    specialtySummary: '식량(약초) · 고대 목재(정령목)',
    militaryOccupation: {
      costs: { treasury: 0, grain: 0, iron: 0, timber: 0 },
      yields: { treasury: 14, grain: 14, iron: 0, timber: 16 },
      deltaLoyalty: -5,
      deltaUnrest: 7,
      deltaIntegration: 1,
      characterDescription: '수림 자원을 강제 벌채·수탈합니다. 목재와 식량 확보는 최대이나 저항 심화로 불안이 급등합니다.',
    },
    localAutonomy: {
      costs: { treasury: 0, grain: 0, iron: 0, timber: 0 },
      yields: { treasury: 4, grain: 8, iron: 0, timber: 8 },
      deltaLoyalty: 4,
      deltaUnrest: -5,
      deltaIntegration: 0,
      characterDescription: '숲의회의 자치 관습을 보장합니다. 수탈량은 대폭 감소하나 충성도가 회복되고 불안이 진정됩니다.',
    },
    culturalIntegration: {
      monthlyCost: 20,
      yields: { treasury: 8, grain: 12, iron: 0, timber: 12 },
      deltaLoyalty: 2,
      deltaUnrest: -3,
      deltaIntegration: 7,
      characterDescription: '에르덴의 삼림 법률과 관료를 파견해 수림을 영구 영지로 동화합니다. 매달 통합도가 꾸준히 상승합니다.',
    },
    coreYields: { treasury: 16, grain: 18, iron: 2, timber: 20 },
  },
  ironridge: {
    id: 'ironridge',
    name: '철령 남작령',
    title: '북부 관문의 경쟁자',
    icon: '⛰️',
    traitName: '철령 남작들의 긍지',
    traitDescription: '북부 산악의 완강한 기사 가문들은 무력 굴복에 자존심을 걸고 저항하나, 통제 하에 대규모 철광석과 중장갑 장비를 제공합니다.',
    specialtySummary: '북부 철광 · 중장갑 무구',
    militaryOccupation: {
      costs: { treasury: 0, grain: 0, iron: 0, timber: 0 },
      yields: { treasury: 14, grain: 2, iron: 14, timber: 4 },
      deltaLoyalty: -5,
      deltaUnrest: 6,
      deltaIntegration: 1,
      characterDescription: '산악 요새와 광산을 강제 징발합니다. 막대한 철을 수탈하지만 토착 남작들의 반발로 충성도가 하락합니다.',
    },
    localAutonomy: {
      costs: { treasury: 0, grain: 0, iron: 0, timber: 0 },
      yields: { treasury: 5, grain: 0, iron: 6, timber: 2 },
      deltaLoyalty: 4,
      deltaUnrest: -5,
      deltaIntegration: 0,
      characterDescription: '기존 남작 가문의 영지 재판권과 봉건적 자치를 인정해 봉기를 방지하고 소량의 철을 공납받습니다.',
    },
    culturalIntegration: {
      monthlyCost: 20,
      yields: { treasury: 8, grain: 2, iron: 10, timber: 4 },
      deltaLoyalty: 2,
      deltaUnrest: -3,
      deltaIntegration: 7,
      characterDescription: '봉건 장원 제도를 개혁하고 본령 행정망에 철령의 광산을 편입합니다. 안정적으로 완전 직할령 편입을 향해 나아갑니다.',
    },
    coreYields: { treasury: 16, grain: 4, iron: 16, timber: 6 },
  },
  auric: {
    id: 'auric',
    name: '아우릭 자유시',
    title: '상단이 다스리는 도시',
    icon: '⚓',
    traitName: '상무회의 자유 무역',
    traitDescription: '군정의 무자비한 검문과 통제는 상업 자본을 위축시키지만, 자치 특권이나 제도적 통합이 주어지면 최고의 국고 세입을 보장합니다.',
    specialtySummary: '해상무역 · 금융 조세',
    militaryOccupation: {
      costs: { treasury: 0, grain: 0, iron: 0, timber: 0 },
      yields: { treasury: 16, grain: 0, iron: 2, timber: 4 },
      deltaLoyalty: -6,
      deltaUnrest: 7,
      deltaIntegration: 1,
      characterDescription: '자유시 항만과 금고를 강제 압류합니다. 즉각적인 은화를 확보하나 상인들의 태업과 밀수로 잠재 세수가 훼손됩니다.',
    },
    localAutonomy: {
      costs: { treasury: 0, grain: 0, iron: 0, timber: 0 },
      yields: { treasury: 14, grain: 0, iron: 2, timber: 2 },
      deltaLoyalty: 5,
      deltaUnrest: -6,
      deltaIntegration: 0,
      characterDescription: '칠인 상무회의 자치 특허를 갱신합니다. 무역망이 정상화되어 군정보다 오히려 안정적인 세금을 지속적으로 바칩니다.',
    },
    culturalIntegration: {
      monthlyCost: 20,
      yields: { treasury: 20, grain: 0, iron: 4, timber: 4 },
      deltaLoyalty: 2,
      deltaUnrest: -3,
      deltaIntegration: 7,
      characterDescription: '에르덴 관세를 적용하고 본령 은행과 연계해 대규모 금융·상업 거점으로 체계적으로 통합합니다.',
    },
    coreYields: { treasury: 32, grain: 2, iron: 6, timber: 6 },
  },
  goblin: {
    id: 'goblin',
    name: '붉은이빨 부족령',
    title: '동부 황야의 군벌',
    icon: '🔥',
    traitName: '황야의 야생성과 약탈 본능',
    traitDescription: '거칠고 호전적인 부족민은 동화하기 가장 어렵고 소요 위험이 극심하지만, 길들이면 방대한 사냥 가축, 식량, 노획 철재를 제공합니다.',
    specialtySummary: '가축 식량 · 노획 고철',
    militaryOccupation: {
      costs: { treasury: 0, grain: 0, iron: 0, timber: 0 },
      yields: { treasury: 10, grain: 18, iron: 6, timber: 4 },
      deltaLoyalty: -5,
      deltaUnrest: 8,
      deltaIntegration: 1,
      characterDescription: '황야의 부락들을 철권으로 짓누릅니다. 즉각적인 식량과 무기를 징발하나 불안도가 매우 빠르게 폭증합니다.',
    },
    localAutonomy: {
      costs: { treasury: 0, grain: 0, iron: 0, timber: 0 },
      yields: { treasury: 3, grain: 10, iron: 3, timber: 2 },
      deltaLoyalty: 4,
      deltaUnrest: -5,
      deltaIntegration: 0,
      characterDescription: '부족 족장들의 영도를 인정하고 명목상 복종과 가축 공납만을 요구하여 황야의 반란 불씨를 누그러뜨립니다.',
    },
    culturalIntegration: {
      monthlyCost: 20,
      yields: { treasury: 6, grain: 14, iron: 4, timber: 3 },
      deltaLoyalty: 2,
      deltaUnrest: -3,
      deltaIntegration: 7,
      characterDescription: '정착 농경과 요새선을 구축하여 유목 부족민을 제도권 영민으로 순치시킵니다. 높은 비용이 들지만 확고한 영토가 됩니다.',
    },
    coreYields: { treasury: 12, grain: 24, iron: 8, timber: 6 },
  },
}

export const GOVERNANCE_MODES: {
  id: GovernanceMode
  name: string
  icon: string
  shortDesc: string
  character: string
}[] = [
  {
    id: 'military_occupation',
    name: '군정 점령',
    icon: '⚔️',
    shortDesc: '주둔군을 배치해 물자와 세금을 강제 수탈합니다.',
    character: '최대 자원 수탈 · 매달 불안도 상승 및 충성도 급락 · 통합 진척 미미 (+1)',
  },
  {
    id: 'local_autonomy',
    name: '자치 인정',
    icon: '📜',
    shortDesc: '현지 귀족과 원로의 자치권을 인정하고 명목상 조공만 받습니다.',
    character: '조세 대폭 감소 · 매달 충성도 회복 및 불안도 감소 · 통합 진척 정체 (0)',
  },
  {
    id: 'cultural_integration',
    name: '문화 통합',
    icon: '🏛️',
    shortDesc: '국고를 투입해 법전, 언어, 관료제를 이식해 에르덴의 영구 영지로 동화시킵니다.',
    character: '매달 국고 🪙20 소모 · 충성/불안 완만히 개선 · 매달 통합도 대폭 상승 (+7)',
  },
]

export function calculateRebellionRiskTier(loyalty: number, unrest: number): RebellionRiskTier {
  if (unrest >= 90 || loyalty <= 10) return '반란 임박'
  if (unrest >= 70 || loyalty <= 25) return '경고'
  if (unrest >= 50 || loyalty <= 40) return '주의'
  return '안정'
}

export function evaluateGovernedTerritories(
  neighbors: NeighborRealm[],
  governance: Record<string, AnnexedTerritoryGovernance>,
  resources: RealmResources,
  _policies?: PolicyId[],
): DominionGovernanceSummary {
  let workingTreasury = resources.treasury
  const evaluations: GovernedTerritoryEvaluation[] = []
  const totalCosts: RealmResources = { treasury: 0, grain: 0, iron: 0, timber: 0 }
  const totalYields: RealmResources = { treasury: 0, grain: 0, iron: 0, timber: 0 }
  const totalNet: RealmResources = { treasury: 0, grain: 0, iron: 0, timber: 0 }
  let coreCount = 0
  let highRiskCount = 0
  let stalledCount = 0

  for (const neighbor of neighbors) {
    if (!neighbor.annexed || neighbor.id === 'crown') continue
    const gov = governance[neighbor.id]
    if (!gov) continue

    const profile = TERRITORY_PROFILES[neighbor.id]
    if (!profile) continue

    const isCore = gov.isCore || gov.integration >= 100
    if (isCore) coreCount += 1

    let costs: RealmResources = { treasury: 0, grain: 0, iron: 0, timber: 0 }
    let yields: RealmResources = { treasury: 0, grain: 0, iron: 0, timber: 0 }
    let deltaLoyalty = 0
    let deltaUnrest = 0
    let deltaIntegration = 0
    let isFunded = true
    let isStalled = false
    let stalledReason: string | undefined

    if (isCore) {
      costs = { treasury: 0, grain: 0, iron: 0, timber: 0 }
      yields = { ...profile.coreYields }
      deltaLoyalty = gov.loyalty < 90 ? 1 : 0
      deltaUnrest = gov.unrest > 10 ? -2 : 0
      deltaIntegration = 0
    } else if (gov.governanceMode === 'cultural_integration') {
      const programCost = profile.culturalIntegration.monthlyCost
      if (workingTreasury >= programCost) {
        workingTreasury -= programCost
        costs = { treasury: programCost, grain: 0, iron: 0, timber: 0 }
        yields = { ...profile.culturalIntegration.yields }
        deltaLoyalty = profile.culturalIntegration.deltaLoyalty
        deltaUnrest = profile.culturalIntegration.deltaUnrest
        deltaIntegration = profile.culturalIntegration.deltaIntegration
      } else {
        isFunded = false
        isStalled = true
        stalledCount += 1
        stalledReason = `국고 부족으로 통합 사업 중단 (필요 🪙${programCost} / 가용 🪙${workingTreasury})`
        costs = { treasury: 0, grain: 0, iron: 0, timber: 0 }
        yields = { treasury: 0, grain: 0, iron: 0, timber: 0 }
        deltaLoyalty = -2
        deltaUnrest = 4
        deltaIntegration = 0
      }
    } else if (gov.governanceMode === 'military_occupation') {
      costs = { ...profile.militaryOccupation.costs }
      yields = { ...profile.militaryOccupation.yields }
      deltaLoyalty = profile.militaryOccupation.deltaLoyalty
      deltaUnrest = profile.militaryOccupation.deltaUnrest
      deltaIntegration = profile.militaryOccupation.deltaIntegration
    } else {
      // local_autonomy
      costs = { ...profile.localAutonomy.costs }
      yields = { ...profile.localAutonomy.yields }
      deltaLoyalty = profile.localAutonomy.deltaLoyalty
      deltaUnrest = profile.localAutonomy.deltaUnrest
      deltaIntegration = profile.localAutonomy.deltaIntegration
    }

    const net: RealmResources = {
      treasury: yields.treasury - costs.treasury,
      grain: yields.grain - costs.grain,
      iron: yields.iron - costs.iron,
      timber: yields.timber - costs.timber,
    }

    totalCosts.treasury += costs.treasury
    totalCosts.grain += costs.grain
    totalCosts.iron += costs.iron
    totalCosts.timber += costs.timber

    totalYields.treasury += yields.treasury
    totalYields.grain += yields.grain
    totalYields.iron += yields.iron
    totalYields.timber += yields.timber

    totalNet.treasury += net.treasury
    totalNet.grain += net.grain
    totalNet.iron += net.iron
    totalNet.timber += net.timber

    const projectedLoyalty = Math.max(0, Math.min(100, gov.loyalty + deltaLoyalty))
    const projectedUnrest = Math.max(0, Math.min(100, gov.unrest + deltaUnrest))
    const riskTier = calculateRebellionRiskTier(projectedLoyalty, projectedUnrest)

    if (riskTier === '경고' || riskTier === '반란 임박') {
      highRiskCount += 1
    }

    evaluations.push({
      neighborId: neighbor.id,
      neighborName: neighbor.name,
      specialty: neighbor.specialty,
      mode: gov.governanceMode,
      loyalty: gov.loyalty,
      unrest: gov.unrest,
      integration: gov.integration,
      isCore,
      isFunded,
      isStalled,
      stalledReason,
      costs,
      yields,
      net,
      deltaLoyalty,
      deltaUnrest,
      deltaIntegration,
      rebellionRiskTier: riskTier,
    })
  }

  return {
    evaluations,
    totalCosts,
    totalYields,
    totalNet,
    coreCount,
    highRiskCount,
    stalledCount,
  }
}

export const DOCTRINE_LABELS: Record<Doctrine, string> = {
  unset: '노선 미결정',
  stewardship: '질서의 길',
  commerce: '번영의 길',
  military: '철혈의 길',
}

export function calculateArmyPower(soldiers: number, levies: number, hasStandingGuard: boolean): number {
  return Math.round(soldiers * (hasStandingGuard ? 2.75 : 2.2) + levies * 0.65)
}

export const INITIAL_REALM_STATE: RealmState = {
  year: 731,
  month: 3,
  name: '에르덴 변경백령',
  ruler: '변경백 아르덴',
  rank: '루미나스 왕령의 봉신',
  doctrine: 'unset',
  resources: { treasury: 320, grain: 230, iron: 62, timber: 95 },
  capacities: { administration: 3, diplomacy: 3, command: 3 },
  industries: {
    farms: { id: 'farms', level: 1 },
    ironworks: { id: 'ironworks', level: 1 },
    market: { id: 'market', level: 1 },
    lumberyard: { id: 'lumberyard', level: 1 },
  },
  policies: [],
  population: 12400,
  manpower: 940,
  soldiers: 180,
  levies: 420,
  stability: 63,
  legitimacy: 58,
  autonomy: 24,
  royalFavor: 51,
  neighbors: [
    { id: 'crown', name: '루미나스 왕령', title: '황금 왕관의 종주국', ruler: '여왕 아우렐리아 3세', icon: '👑', relation: 36, strength: 84, attitude: '종주국', specialty: '사치품 · 왕실 관료', tradeActive: false, tradeContract: null, claim: false, annexed: false },
    { id: 'sylvana', name: '실바나 숲의회', title: '고대 수림의 연맹', ruler: '수호자 이실렌', icon: '🌲', relation: 18, strength: 39, attitude: '우호', specialty: '약초 · 정령목', tradeActive: false, tradeContract: null, claim: false, annexed: false },
    { id: 'ironridge', name: '철령 남작령', title: '북부 관문의 경쟁자', ruler: '남작 볼프람', icon: '⛰️', relation: -14, strength: 48, attitude: '경계', specialty: '철광 · 중장갑', tradeActive: false, tradeContract: null, claim: false, annexed: false },
    { id: 'auric', name: '아우릭 자유시', title: '상단이 다스리는 도시', ruler: '칠인 상무회', icon: '⚓', relation: 4, strength: 32, attitude: '중립', specialty: '해상무역 · 금융', tradeActive: false, tradeContract: null, claim: false, annexed: false },
    { id: 'goblin', name: '붉은이빨 부족령', title: '동부 황야의 군벌', ruler: '대족장 우르가쉬', icon: '🔥', relation: -38, strength: 35, attitude: '적대', specialty: '약탈품 · 전투짐승', tradeActive: false, tradeContract: null, claim: false, annexed: false },
  ],
  governance: {},
  logs: [
    {
      id: 'realm-start',
      date: '731년 3월',
      title: '왕실의 봉인이 도착하다',
      detail: '여왕은 2년 안에 국경을 안정시키라는 명을 내렸습니다. 충성으로 보답할지, 독자적인 세력을 일굴지는 당신의 선택입니다.',
      tone: 'royal',
    },
  ],
  pendingWorldEvent: null,
  activeCampaign: null,
}
