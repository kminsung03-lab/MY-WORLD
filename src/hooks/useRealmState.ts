import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAMPAIGN_ORDERS,
  INDUSTRIES,
  INITIAL_REALM_STATE,
  POLICIES,
  TRADE_CONTRACTS,
  calculateArmyPower,
  checkDiplomaticRequirements,
  evaluateDiplomacy,
  evaluateGovernedTerritories,
  evaluateTradeRoutes,
} from '../constants/realmData'
import {
  CIVIC_FOCUS_DEFINITIONS,
  INITIAL_CIVIC_BUILDINGS,
  createFieldQuestTemplate,
  getDeterministicQuestRoll,
  pickNextFieldQuestId,
  shouldSpawnFieldQuest,
} from '../constants/fieldQuestData'
import {
  INITIAL_DIRECTIVES,
  RIVAL_INTENT_TEMPLATES,
  evaluateAmbitionGoals,
} from '../constants/rivalAiData'
import { generateWorldEvent, getDeterministicSeed } from '../constants/worldEvents'
import type {
  CivicBuildingId,
  CivicFocusId,
  RealmTrait,
} from '../types/fieldQuest'
import type {
  AmbitionVictoryId,
  AnnexedTerritoryGovernance,
  CampaignOrderId,
  DiplomaticStage,
  Doctrine,
  DynastyAmbitionState,
  GovernanceMode,
  IndustryId,
  PolicyId,
  RealmLog,
  RealmResources,
  RealmState,
  RivalIntent,
  RivalIntentType,
  StrategicDirective,
  TradeContractId,
} from '../types/realm'

const SAVE_KEY = 'my_world_realm_save_v1'

const cloneInitialState = (): RealmState => JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const policyDoctrine: Record<Exclude<Doctrine, 'unset'>, string> = {
  stewardship: '질서의 길',
  commerce: '번영의 길',
  military: '철혈의 길',
}

let logCounter = 0

export function checkAndMigrateLegacySave(current: RealmState): RealmState {
  if (typeof window === 'undefined') return current
  try {
    const isAlreadyMigrated = localStorage.getItem('my_world_legacy_migrated_v3')
    if (isAlreadyMigrated) return current

    const legacyRaw = localStorage.getItem('my_world_game_save_v2') || localStorage.getItem('my_world_game_save_v1')
    if (!legacyRaw) {
      localStorage.setItem('my_world_legacy_migrated_v3', 'true')
      return current
    }

    const legacy = JSON.parse(legacyRaw)
    const next = structuredClone(current)
    const legRes = legacy.resources || {}
    const legBld = legacy.buildings || {}

    // Convert resources: gold -> treasury, food -> grain, wood -> timber, (stone + iron) -> iron
    const goldToAdd = Math.max(0, Math.round(legRes.gold || 0))
    const foodToAdd = Math.max(0, Math.round(legRes.food || 0))
    const woodToAdd = Math.max(0, Math.round(legRes.wood || 0))
    const ironToAdd = Math.max(0, Math.round((legRes.iron || 0) + (legRes.stone ? legRes.stone * 0.5 : 0)))

    next.resources.treasury += goldToAdd
    next.resources.grain += foodToAdd
    next.resources.timber += woodToAdd
    next.resources.iron += ironToAdd

    // Convert buildings:
    if (!next.civicBuildings) {
      next.civicBuildings = structuredClone(INITIAL_CIVIC_BUILDINGS)
    }
    if (legBld.townHall?.level) {
      next.civicBuildings.townHall.level = Math.min(5, Math.max(next.civicBuildings.townHall.level, legBld.townHall.level))
    }
    if (legBld.shelter?.level) {
      next.civicBuildings.residences.level = Math.min(5, Math.max(next.civicBuildings.residences.level, Math.ceil(legBld.shelter.level / 2)))
    }
    if (legBld.storage?.level) {
      next.civicBuildings.granary.level = Math.min(5, Math.max(next.civicBuildings.granary.level, legBld.storage.level))
    }
    if (legBld.wall?.level) {
      next.civicBuildings.fortifications.level = Math.min(5, Math.max(next.civicBuildings.fortifications.level, legBld.wall.level))
    }
    if (legBld.blacksmith?.level && legBld.blacksmith.level > 1) {
      next.industries.ironworks.level = Math.min(5, Math.max(next.industries.ironworks.level, Math.ceil(legBld.blacksmith.level / 2)))
    }

    logCounter += 1
    next.logs = [
      {
        id: `migrated_legacy_${Date.now()}`,
        date: `${next.year}년 ${next.month}월`,
        title: '📜 [레거시 영지 통합 완료] 중앙 경제 원장 이관',
        detail: `과거 마을 개척지의 물자(금화 +${goldToAdd}, 식량 +${foodToAdd}, 목재 +${woodToAdd}, 철재 +${ironToAdd})와 관저/방벽 시설이 변경백령 시정 체계로 완전히 통합 이관되었습니다.`,
        tone: 'royal',
      },
      ...next.logs.slice(0, 11),
    ]

    localStorage.setItem('my_world_legacy_migrated_v3', 'true')
    return next
  } catch (err) {
    console.error('Failed to migrate legacy save', err)
    return current
  }
}


export function useRealmState() {
  const [state, setState] = useState<RealmState>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const initial = cloneInitialState()
        const migratedNeighbors = (parsed.neighbors || initial.neighbors).map((savedN: any, idx: number) => {
          const fallback = initial.neighbors.find((n) => n.id === savedN.id) || initial.neighbors[idx] || initial.neighbors[0]
          const tradeActive = !!savedN.tradeActive
          const tradeContract: TradeContractId | null =
            savedN.tradeContract ?? (tradeActive ? 'balanced_exchange' : null)
          const diplomaticStage: DiplomaticStage = savedN.diplomaticStage ?? 'none'
          const treatyMonths = typeof savedN.treatyMonths === 'number' ? savedN.treatyMonths : 0
          const subjectLoyalty = typeof savedN.subjectLoyalty === 'number'
            ? savedN.subjectLoyalty
            : (diplomaticStage === 'vassal' ? 60 : 0)
          const treatySuspended = !!savedN.treatySuspended
          const treatySuspendReason = savedN.treatySuspendReason || undefined

          return {
            ...fallback,
            ...savedN,
            tradeActive,
            tradeContract,
            diplomaticStage,
            treatyMonths,
            subjectLoyalty,
            treatySuspended,
            treatySuspendReason,
            lastAction: savedN.lastAction || undefined,
            lastActionDate: savedN.lastActionDate || undefined,
          }
        })

        const savedGovernance = parsed.governance || {}
        const migratedGovernance: Record<string, AnnexedTerritoryGovernance> = {}
        for (const n of migratedNeighbors) {
          if (n.annexed && n.id !== 'crown') {
            const existingGov = savedGovernance[n.id]
            if (existingGov) {
              migratedGovernance[n.id] = {
                neighborId: n.id,
                governanceMode: existingGov.governanceMode || 'military_occupation',
                loyalty: clamp(existingGov.loyalty ?? 45, 0, 100),
                unrest: clamp(existingGov.unrest ?? 40, 0, 100),
                integration: clamp(existingGov.integration ?? 20, 0, 100),
                isCore: existingGov.isCore ?? (existingGov.integration >= 100),
                lastReport: existingGov.lastReport || '기존 통치 기록을 계승했습니다.',
              }
            } else {
              migratedGovernance[n.id] = {
                neighborId: n.id,
                governanceMode: 'military_occupation',
                loyalty: 45,
                unrest: 40,
                integration: 20,
                isCore: false,
                lastReport: '기존 병합 영지에 대한 통치령 행정 체계를 신설했습니다.',
              }
            }
          }
        }

        const migratedRivalIntents: RivalIntent[] = Array.isArray(parsed.rivalIntents) ? parsed.rivalIntents : []
        const migratedAmbitionState: DynastyAmbitionState = parsed.ambitionState || {
          chosenAmbitionId: null,
          triumphAchieved: null,
          defeatTriggered: null,
          acknowledgedOutcome: false,
        }
        const migratedDirectives: StrategicDirective[] = Array.isArray(parsed.directives) && parsed.directives.length > 0
          ? parsed.directives
          : JSON.parse(JSON.stringify(INITIAL_DIRECTIVES))

        const migratedCivicFocus = parsed.civicFocus || 'balanced'
        const migratedCivicBuildings = parsed.civicBuildings || structuredClone(INITIAL_CIVIC_BUILDINGS)
        const migratedRealmTraits = Array.isArray(parsed.realmTraits) ? parsed.realmTraits : []
        const migratedFieldQuest = parsed.pendingFieldQuest || null
        const migratedCompletedFieldQuestsCount = typeof parsed.completedFieldQuestsCount === 'number' ? parsed.completedFieldQuestsCount : 0

        const loaded: RealmState = {
          ...initial,
          ...parsed,
          neighbors: migratedNeighbors,
          governance: migratedGovernance,
          pendingWorldEvent: parsed.pendingWorldEvent || null,
          activeCampaign: parsed.activeCampaign || null,
          rivalIntents: migratedRivalIntents,
          ambitionState: migratedAmbitionState,
          directives: migratedDirectives,
          civicFocus: migratedCivicFocus,
          civicBuildings: migratedCivicBuildings,
          realmTraits: migratedRealmTraits,
          pendingFieldQuest: migratedFieldQuest,
          completedFieldQuestsCount: migratedCompletedFieldQuestsCount,
        }
        return checkAndMigrateLegacySave(loaded)
      }
    } catch (error) {
      console.error('Failed to load realm save', error)
    }
    return checkAndMigrateLegacySave(cloneInitialState())
  })



  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  }, [state])

  const addLog = useCallback((draft: RealmState, title: string, detail: string, tone: RealmLog['tone'] = 'neutral') => {
    logCounter += 1
    draft.logs = [
      {
        id: `log_${draft.year}_${draft.month}_${Date.now()}_${logCounter}`,
        date: `${draft.year}년 ${draft.month}월`,
        title,
        detail,
        tone,
      },
      ...draft.logs.slice(0, 11),
    ]
  }, [])


  const monthlyProjection = useMemo(() => {
    const farm = state.industries.farms.level
    const ironworks = state.industries.ironworks.level
    const market = state.industries.market.level
    const lumber = state.industries.lumberyard.level
    const taxBonus = state.policies.includes('land_register') ? 1.15 : 1
    const baseGrossIncome = Math.round((34 + farm * 6 + ironworks * 5 + market * 18 + lumber * 4) * taxBonus)
    const militaryUpkeep = Math.ceil(state.soldiers / 30) + Math.ceil(state.levies / 180) + (state.policies.includes('standing_guard') ? 8 : 0)

    // Deterministic pre-month commitment reservation order:
    // 1) Selected campaign order costs reserve first
    const selectedOrderDef = state.activeCampaign?.selectedOrder
      ? CAMPAIGN_ORDERS.find((o) => o.id === state.activeCampaign?.selectedOrder)
      : null

    const campaignCost: RealmResources = selectedOrderDef
      ? {
          treasury: selectedOrderDef.costs.treasury,
          grain: selectedOrderDef.costs.grain,
          iron: selectedOrderDef.costs.iron,
          timber: selectedOrderDef.costs.timber,
        }
      : { treasury: 0, grain: 0, iron: 0, timber: 0 }

    const resourcesForTrade: RealmResources = {
      treasury: Math.max(0, state.resources.treasury - campaignCost.treasury),
      grain: Math.max(0, state.resources.grain - campaignCost.grain),
      iron: Math.max(0, state.resources.iron - campaignCost.iron),
      timber: Math.max(0, state.resources.timber - campaignCost.timber),
    }

    // 2) Trade route costs evaluate against remaining pre-month resources
    const tradeEval = evaluateTradeRoutes(
      state.neighbors,
      resourcesForTrade,
      state.policies,
      state.activeCampaign?.targetId,
    )

    // 3) Diplomatic agreements / subject obligations evaluate against remaining resources
    // after campaign and active trade costs
    const resourcesForDiplomacy: RealmResources = {
      treasury: Math.max(0, resourcesForTrade.treasury - tradeEval.totalCosts.treasury),
      grain: Math.max(0, resourcesForTrade.grain - tradeEval.totalCosts.grain),
      iron: Math.max(0, resourcesForTrade.iron - tradeEval.totalCosts.iron),
      timber: Math.max(0, resourcesForTrade.timber - tradeEval.totalCosts.timber),
    }

    const diplomacyEval = evaluateDiplomacy(
      state.neighbors,
      resourcesForDiplomacy,
      state.activeCampaign?.targetId,
    )

    // 4) Governance / cultural-integration costs evaluate against remaining resources
    // after campaign, trade, and diplomatic obligations
    const resourcesForDominion: RealmResources = {
      treasury: Math.max(0, resourcesForDiplomacy.treasury - diplomacyEval.totalCosts.treasury),
      grain: Math.max(0, resourcesForDiplomacy.grain - diplomacyEval.totalCosts.grain),
      iron: Math.max(0, resourcesForDiplomacy.iron - diplomacyEval.totalCosts.iron),
      timber: Math.max(0, resourcesForDiplomacy.timber - diplomacyEval.totalCosts.timber),
    }

    const dominionEval = evaluateGovernedTerritories(
      state.neighbors,
      state.governance,
      resourcesForDominion,
      state.policies,
    )

    const baseGrain = farm * 18 - Math.ceil((state.population + state.soldiers) / 850)
    const baseIron = ironworks * 7
    const baseTimber = lumber * 10

    const civicFocusDef = CIVIC_FOCUS_DEFINITIONS[state.civicFocus || 'balanced']
    const civicImpact = civicFocusDef?.monthlyImpact || {}

    const cBuildings = state.civicBuildings || INITIAL_CIVIC_BUILDINGS
    const civicTreasury = (cBuildings.townHall?.level || 0) * 6
    const civicGrain = (cBuildings.granary?.level || 0) * 8
    const civicManpowerBonus = (cBuildings.residences?.level || 0) * 20

    let traitTreasury = 0
    let traitGrain = 0
    let traitIron = 0
    let traitTimber = 0
    let traitAdminBonus = 0
    let constructionDiscount = 0

    if (state.realmTraits) {
      for (const t of state.realmTraits) {
        if (t.effects.monthlyTreasury) traitTreasury += t.effects.monthlyTreasury
        if (t.effects.monthlyGrain) traitGrain += t.effects.monthlyGrain
        if (t.effects.monthlyIron) traitIron += t.effects.monthlyIron
        if (t.effects.monthlyTimber) traitTimber += t.effects.monthlyTimber
        if (t.effects.adminBonus) traitAdminBonus += t.effects.adminBonus
        if (t.effects.constructionDiscountRate) constructionDiscount = Math.max(constructionDiscount, t.effects.constructionDiscountRate)
      }
    }

    const adjustedBaseGrossIncome = baseGrossIncome + civicTreasury + traitTreasury + (civicImpact.treasuryDelta || 0)
    const adjustedBaseGrain = baseGrain + civicGrain + traitGrain + (civicImpact.grainDelta || 0)
    const adjustedBaseIron = baseIron + traitIron + (civicImpact.ironDelta || 0)
    const adjustedBaseTimber = baseTimber + traitTimber + (civicImpact.timberDelta || 0)

    const activeAllies = state.neighbors.filter(
      (n) => n.diplomaticStage === 'alliance' && !n.annexed && n.id !== state.activeCampaign?.targetId &&
        diplomacyEval.evaluations.some((evaluation) => evaluation.neighborId === n.id && !evaluation.isSuspended),
    )
    const alliedAuxiliaryPower = activeAllies.reduce((sum, a) => sum + a.strength * 5, 0)

    return {
      treasury: adjustedBaseGrossIncome + tradeEval.totalNet.treasury + diplomacyEval.totalNet.treasury + dominionEval.totalNet.treasury - militaryUpkeep,
      grossIncome: adjustedBaseGrossIncome,
      militaryUpkeep,
      grain: adjustedBaseGrain + tradeEval.totalNet.grain + diplomacyEval.totalNet.grain + dominionEval.totalNet.grain,
      iron: adjustedBaseIron + tradeEval.totalNet.iron + diplomacyEval.totalNet.iron + dominionEval.totalNet.iron,
      timber: adjustedBaseTimber + tradeEval.totalNet.timber + diplomacyEval.totalNet.timber + dominionEval.totalNet.timber,
      baseIndustryIncome: adjustedBaseGrossIncome,
      baseGrain: adjustedBaseGrain,
      baseIron: adjustedBaseIron,
      baseTimber: adjustedBaseTimber,
      activeTrades: tradeEval.activeCount,
      suspendedTrades: tradeEval.suspendedCount,
      tradeEvaluation: tradeEval,
      diplomacyEvaluation: diplomacyEval,
      diplomacyNet: diplomacyEval.totalNet,
      diplomacyCosts: diplomacyEval.totalCosts,
      diplomacyYields: diplomacyEval.totalYields,
      diplomaticManpowerYield: diplomacyEval.totalManpowerYield + civicManpowerBonus + (civicImpact.manpowerDelta || 0),
      activeAlliances: diplomacyEval.activeAllianceCount,
      activeVassals: diplomacyEval.activeVassalCount,
      suspendedDiplomacyCount: diplomacyEval.suspendedCount,
      activeAllies,
      alliedAuxiliaryPower,
      dominionEvaluation: dominionEval,
      dominionNet: dominionEval.totalNet,
      dominionCosts: dominionEval.totalCosts,
      dominionYields: dominionEval.totalYields,
      coreDominionCount: dominionEval.coreCount,
      highRiskDominionCount: dominionEval.highRiskCount,
      stalledDominionCount: dominionEval.stalledCount,
      campaignCost,
      resourcesForTrade,
      resourcesForDiplomacy,
      civicFocusDef,
      civicImpact,
      civicTreasury,
      civicGrain,
      civicManpowerBonus,
      traitTreasury,
      traitGrain,
      traitIron,
      traitTimber,
      traitAdminBonus,
      constructionDiscount,
      resourcesForDominion,
    }
  }, [state])

  const upgradeIndustry = (industryId: IndustryId) => {
    const definition = INDUSTRIES.find((item) => item.id === industryId)
    if (!definition) return
    setState((previous) => {
      const current = previous.industries[industryId]
      const goldCost = definition.baseCost + current.level * 45
      const timberCost = definition.timberCost + current.level * 6
      if (current.level >= 5 || previous.capacities.administration < 1 || previous.resources.treasury < goldCost || previous.resources.timber < timberCost) return previous
      const next = structuredClone(previous)
      next.resources.treasury -= goldCost
      next.resources.timber -= timberCost
      next.capacities.administration -= 1
      next.industries[industryId].level += 1
      addLog(next, `${definition.name} 확장`, `금화 ${goldCost}와 목재 ${timberCost}를 투입했습니다. 다음 달부터 생산량이 증가합니다.`, 'good')
      return next
    })
  }

  const enactPolicy = (policyId: PolicyId) => {
    const policy = POLICIES.find((item) => item.id === policyId)
    if (!policy) return
    setState((previous) => {
      const isRoot = !policy.requires
      const wrongDoctrine = previous.doctrine !== 'unset' && previous.doctrine !== policy.branch
      if (previous.policies.includes(policyId) || wrongDoctrine || (policy.requires && !previous.policies.includes(policy.requires))) return previous
      if (previous.resources.treasury < policy.cost || previous.capacities[policy.capacity] < 1) return previous
      const next = structuredClone(previous)
      next.resources.treasury -= policy.cost
      next.capacities[policy.capacity] -= 1
      next.policies.push(policyId)
      if (isRoot) next.doctrine = policy.branch
      if (policyId === 'land_register') next.stability = clamp(next.stability + 3, 0, 100)
      if (policyId === 'royal_bureau') next.autonomy = clamp(next.autonomy + 3, 0, 100)
      if (policyId === 'merchant_charter') next.legitimacy = clamp(next.legitimacy - 2, 0, 100)
      if (policyId === 'free_port') next.population += 250
      if (policyId === 'border_muster') next.levies += 180
      if (policyId === 'standing_guard') next.soldiers += 40
      addLog(next, policy.name, `${policy.effect}. ${isRoot ? `${policyDoctrine[policy.branch]}을 영지의 노선으로 선포했습니다.` : '새 제도가 영지 전역에 시행됩니다.'}`, 'royal')
      return next
    })
  }

  const recruitSoldiers = () => {
    setState((previous) => {
      if (previous.capacities.command < 1 || previous.resources.treasury < 55 || previous.resources.iron < 14 || previous.manpower < 90) return previous
      const next = structuredClone(previous)
      next.capacities.command -= 1
      next.resources.treasury -= 55
      next.resources.iron -= 14
      next.manpower -= 90
      next.soldiers += 75
      addLog(next, '상비군 1개 중대 편성', '90명의 인력을 소집해 75명의 훈련된 병사를 배치했습니다.', 'good')
      return next
    })
  }

  const callLevies = () => {
    setState((previous) => {
      if (previous.capacities.command < 1 || previous.resources.grain < 35 || previous.manpower < 130) return previous
      const next = structuredClone(previous)
      next.capacities.command -= 1
      next.resources.grain -= 35
      next.manpower -= 130
      next.levies += 130
      next.stability = clamp(next.stability - 2, 0, 100)
      addLog(next, '향촌 징집령', '농번기의 일손을 군대로 돌렸습니다. 징집병은 늘었지만 민심이 다소 흔들립니다.', 'neutral')
      return next
    })
  }

  const diplomaticAction = (neighborId: string, action: 'improve' | 'trade' | 'pressure' | 'renounce') => {
    setState((previous) => {
      const index = previous.neighbors.findIndex((neighbor) => neighbor.id === neighborId)
      if (index < 0) return previous
      const target = previous.neighbors[index]
      if (target.annexed) return previous
      if (previous.activeCampaign?.targetId === neighborId) return previous
      const next = structuredClone(previous)
      const neighbor = next.neighbors[index]
      if (action === 'improve') {
        if (previous.capacities.diplomacy < 1 || previous.resources.treasury < 24) return previous
        next.capacities.diplomacy -= 1
        next.resources.treasury -= 24
        neighbor.relation = clamp(neighbor.relation + 14, -100, 100)
        addLog(next, `${target.name}에 사절단 파견`, '선물과 친서를 전달해 관계가 14 개선되었습니다.', 'good')
      } else if (action === 'trade') {
        if (target.tradeActive || target.relation < 10 || previous.capacities.diplomacy < 1 || previous.resources.treasury < 35) return previous
        next.capacities.diplomacy -= 1
        next.resources.treasury -= 35
        neighbor.tradeActive = true
        neighbor.tradeContract = 'balanced_exchange'
        neighbor.relation = clamp(neighbor.relation + 6, -100, 100)
        addLog(next, `${target.name} 교역로 개설`, `${target.specialty} 상단이 국경을 오가기 시작했습니다. [균형 교역 협정]이 기본 체결되었습니다.`, 'good')
      } else if (action === 'pressure') {
        if (
          target.id === 'crown' ||
          target.claim ||
          (target.diplomaticStage && target.diplomaticStage !== 'none') ||
          previous.capacities.command < 1 ||
          previous.legitimacy < 45
        )
          return previous
        next.capacities.command -= 1
        neighbor.claim = true
        neighbor.relation = clamp(neighbor.relation - 22, -100, 100)
        next.royalFavor = clamp(next.royalFavor - 4, 0, 100)
        addLog(next, `${target.name}에 대한 명분 조작`, '옛 문서와 국경 분쟁을 근거로 영유권을 공표했습니다. 상대가 강하게 반발합니다.', 'danger')
      } else {
        if (target.id === 'crown' || !target.claim || previous.capacities.diplomacy < 1 || previous.resources.treasury < 15) return previous
        next.capacities.diplomacy -= 1
        next.resources.treasury -= 15
        neighbor.claim = false
        neighbor.relation = clamp(neighbor.relation + 8, -100, 100)
        addLog(next, `${target.name} 영유권 주장 철회`, '국경 분쟁의 명분을 공식 철회하고 화해 사절단을 파견했습니다. (외교력 1, 금화 15 소모 · 관계도 +8)', 'good')
      }
      return next
    })
  }

  const changeTradeContract = (neighborId: string, contractId: TradeContractId) => {
    setState((previous) => {
      const index = previous.neighbors.findIndex((n) => n.id === neighborId)
      if (index < 0) return previous
      const target = previous.neighbors[index]
      if (!target.tradeActive || target.annexed || previous.activeCampaign?.targetId === neighborId) return previous
      if (target.tradeContract === contractId) return previous
      if (previous.capacities.diplomacy < 1 || previous.resources.treasury < 10) return previous

      const next = structuredClone(previous)
      next.capacities.diplomacy -= 1
      next.resources.treasury -= 10
      next.neighbors[index].tradeContract = contractId

      const contractDef = TRADE_CONTRACTS.find((c) => c.id === contractId) || TRADE_CONTRACTS[0]
      addLog(
        next,
        `${target.name} 교역 계약 갱신`,
        `교역 계약을 [${contractDef.name}]으로 변경했습니다. 다음 달부터 변경된 수급 조건이 적용됩니다. (외교력 1, 금화 10 소모)`,
        'neutral',
      )
      return next
    })
  }

  const changeGovernanceMode = (neighborId: string, mode: GovernanceMode) => {
    setState((previous) => {
      const target = previous.neighbors.find((n) => n.id === neighborId)
      if (!target || !target.annexed || target.id === 'crown') return previous
      const currentGov = previous.governance[neighborId]
      if (!currentGov || currentGov.governanceMode === mode) return previous
      if (previous.capacities.administration < 1 || previous.resources.treasury < 20) return previous

      const next = structuredClone(previous)
      next.capacities.administration -= 1
      next.resources.treasury -= 20
      next.governance[neighborId].governanceMode = mode

      const modeNames: Record<GovernanceMode, string> = {
        military_occupation: '군정 점령',
        local_autonomy: '자치 인정',
        cultural_integration: '문화 통합',
      }
      addLog(
        next,
        `[통치령 칙령] ${target.name} 통치 방침 변경`,
        `통치 방침을 [${modeNames[mode]}](으)로 전환했습니다. 현지 관료와 주둔군에 새로운 칙령이 하달되었습니다. (행정력 1, 금화 20 소모)`,
        'royal',
      )
      return next
    })
  }

  const signTreaty = (neighborId: string, stage: 'non_aggression' | 'alliance' | 'vassal') => {
    setState((previous) => {
      const index = previous.neighbors.findIndex((n) => n.id === neighborId)
      if (index < 0) return previous
      const target = previous.neighbors[index]
      if (target.annexed || target.id === 'crown' || previous.activeCampaign?.targetId === neighborId) return previous

      const armyPower = calculateArmyPower(previous.soldiers, previous.levies, previous.policies.includes('standing_guard'))
      const reqs = checkDiplomaticRequirements(stage, target, previous, monthlyProjection.grossIncome, armyPower)
      if (!reqs.canEnact) return previous

      const next = structuredClone(previous)
      const neighbor = next.neighbors[index]

      if (stage === 'non_aggression') {
        next.capacities.diplomacy -= 1
        next.resources.treasury -= 25
        neighbor.diplomaticStage = 'non_aggression'
        neighbor.treatyMonths = 0
        neighbor.treatySuspended = false
        neighbor.treatySuspendReason = undefined
        neighbor.claim = false
        neighbor.relation = clamp(neighbor.relation + 12, -100, 100)
        addLog(
          next,
          `[불가침 조약 체결] ${target.name}`,
          `${target.name}과(와) 상호 국경 침범을 금지하고 영구적 평화를 지향하는 불가침 조약을 정식 조인했습니다. (외교력 1, 🪙25 소모 · 관계도 +12)`,
          'good',
        )
      } else if (stage === 'alliance') {
        next.capacities.diplomacy -= 2
        next.resources.treasury -= 50
        neighbor.diplomaticStage = 'alliance'
        neighbor.treatyMonths = 0
        neighbor.treatySuspended = false
        neighbor.treatySuspendReason = undefined
        neighbor.claim = false
        neighbor.relation = clamp(neighbor.relation + 18, -100, 100)
        next.legitimacy = clamp(next.legitimacy + 2, 0, 100)
        addLog(
          next,
          `[군사 동맹 체결] ${target.name}`,
          `${target.name}과(와) 피의 맹약을 맺고 상호 군사 동맹을 선포했습니다. 향후 군사 원정 시 동맹군이 전선에 참전하며 매달 🪙12의 동맹 유지비가 지출됩니다. (외교력 2, 🪙50 소모 · 정통성 +2)`,
          'royal',
        )
      } else if (stage === 'vassal') {
        next.capacities.diplomacy -= 2
        next.capacities.administration -= 1
        next.resources.treasury -= 90
        neighbor.diplomaticStage = 'vassal'
        neighbor.treatyMonths = 0
        neighbor.subjectLoyalty = 60
        neighbor.treatySuspended = false
        neighbor.treatySuspendReason = undefined
        neighbor.claim = false
        neighbor.relation = clamp(neighbor.relation + 20, -100, 100)
        next.legitimacy = clamp(next.legitimacy + 4, 0, 100)
        next.autonomy = clamp(next.autonomy + 4, 0, 100)
        addLog(
          next,
          `[속국 봉신화] ${target.name}`,
          `${target.name}의 통치자가 에르덴 변경백에게 무릎을 꿇고 종주권을 인정했습니다! 매달 고유 특화 조공과 인력을 공납하며, 지속적인 신뢰 구축 시 평화적 완전 병합이 가능합니다. (외교 2, 행정 1, 🪙90 소모 · 초기 충성 60%)`,
          'royal',
        )
      }

      return next
    })
  }

  const breakTreaty = (neighborId: string) => {
    setState((previous) => {
      const index = previous.neighbors.findIndex((n) => n.id === neighborId)
      if (index < 0) return previous
      const target = previous.neighbors[index]
      const currentStage = target.diplomaticStage || 'none'
      if (currentStage === 'none' || target.annexed || target.id === 'crown') return previous

      const next = structuredClone(previous)
      const neighbor = next.neighbors[index]

      neighbor.diplomaticStage = 'none'
      neighbor.treatyMonths = 0
      neighbor.subjectLoyalty = 0
      neighbor.treatySuspended = false
      neighbor.treatySuspendReason = undefined

      if (currentStage === 'non_aggression') {
        next.legitimacy = clamp(next.legitimacy - 8, 0, 100)
        next.stability = clamp(next.stability - 3, 0, 100)
        next.royalFavor = clamp(next.royalFavor - 2, 0, 100)
        neighbor.relation = clamp(neighbor.relation - 30, -100, 100)
        addLog(
          next,
          `[조약 일방 파기] ${target.name} 불가침 조약 파기`,
          `외교적 신의를 깨고 ${target.name}과의 불가침 조약을 일방적으로 파기했습니다. 국제적 불신을 초래하여 정통성과 안정도가 실추되었습니다. (정통성 -8, 안정도 -3, 관계도 -30)`,
          'danger',
        )
      } else if (currentStage === 'alliance') {
        next.legitimacy = clamp(next.legitimacy - 14, 0, 100)
        next.stability = clamp(next.stability - 5, 0, 100)
        next.royalFavor = clamp(next.royalFavor - 4, 0, 100)
        neighbor.relation = clamp(neighbor.relation - 45, -100, 100)
        addLog(
          next,
          `[동맹 일방 파기] ${target.name} 군사 동맹 파기`,
          `${target.name}과의 군사 동맹을 파기하고 국경을 봉쇄했습니다. 맹약을 저버린 대가로 정통성에 치명적인 손실을 입었습니다. (정통성 -14, 안정도 -5, 관계도 -45)`,
          'danger',
        )
      } else if (currentStage === 'vassal') {
        next.legitimacy = clamp(next.legitimacy - 12, 0, 100)
        next.stability = clamp(next.stability - 4, 0, 100)
        next.royalFavor = clamp(next.royalFavor - 3, 0, 100)
        neighbor.relation = clamp(neighbor.relation - 40, -100, 100)
        addLog(
          next,
          `[종주권 파기] ${target.name} 봉신 관계 단절`,
          `${target.name}에 대한 종주권을 포기하고 봉신 조약을 해제했습니다. 토착 세력의 배신감으로 관계가 파탄 났습니다. (정통성 -12, 안정도 -4, 관계도 -40)`,
          'danger',
        )
      }

      return next
    })
  }

  const annexSubjectPeacefully = (neighborId: string) => {
    setState((previous) => {
      const index = previous.neighbors.findIndex((n) => n.id === neighborId)
      if (index < 0) return previous
      const target = previous.neighbors[index]
      if (
        target.diplomaticStage !== 'vassal' ||
        target.treatySuspended ||
        target.annexed ||
        target.id === 'crown' ||
        previous.activeCampaign?.targetId === neighborId
      )
        return previous

      const dur = target.treatyMonths ?? 0
      const loy = target.subjectLoyalty ?? 0
      if (
        dur < 6 ||
        loy < 80 ||
        target.relation < 80 ||
        previous.capacities.administration < 2 ||
        previous.capacities.diplomacy < 2 ||
        previous.resources.treasury < 120
      )
        return previous

      const next = structuredClone(previous)
      next.capacities.administration -= 2
      next.capacities.diplomacy -= 2
      next.resources.treasury -= 120

      const neighbor = next.neighbors[index]
      neighbor.annexed = true
      neighbor.claim = false
      neighbor.tradeActive = false
      neighbor.tradeContract = null
      neighbor.diplomaticStage = 'none'
      neighbor.treatyMonths = 0
      neighbor.subjectLoyalty = 0
      neighbor.treatySuspended = false
      neighbor.treatySuspendReason = undefined

      next.population += target.strength * 95
      next.manpower += target.strength * 8
      next.autonomy = clamp(next.autonomy + 8, 0, 100)
      next.stability = clamp(next.stability + 4, 0, 100)
      next.legitimacy = clamp(next.legitimacy + 5, 0, 100)
      next.royalFavor = clamp(next.royalFavor + 3, 0, 100)

      next.governance[target.id] = {
        neighborId: target.id,
        governanceMode: 'local_autonomy',
        loyalty: 80,
        unrest: 10,
        integration: 35,
        isCore: false,
        lastReport: `평화적 병합 협정에 따라 자치령으로 편입되었습니다. 현지 원로와 주민들의 높은 신뢰(초기 충성 80% · 불안 10%) 속에서 안정적으로 통치가 개시되었습니다.`,
      }

      addLog(
        next,
        `[평화적 병합] ${target.name} 자치 편입`,
        `오랜 동맹과 봉신 관계를 통해 쌓은 두터운 신뢰를 바탕으로, ${target.name}이(가) 피 한 방울 흘리지 않고 에르덴 변경백령의 자치령으로 평화롭게 완전 합병되었습니다. 인구 ${target.strength * 95}명과 인력 ${target.strength * 8}명이 합류했습니다. (안정도 +4, 정통성 +5, 왕실 총애 +3 · 초기 충성 80% / 불안 10% / 통합 35%)`,
        'royal',
      )

      return next
    })
  }

  const launchCampaign = (neighborId: string) => {
    setState((previous) => {
      if (previous.activeCampaign || previous.pendingWorldEvent) return previous
      const index = previous.neighbors.findIndex((neighbor) => neighbor.id === neighborId)
      if (index < 0) return previous
      const target = previous.neighbors[index]
      const armyPower = calculateArmyPower(previous.soldiers, previous.levies, previous.policies.includes('standing_guard'))
      const requiredPower = target.strength * 15
      if (
        target.id === 'crown' ||
        target.annexed ||
        !target.claim ||
        (target.diplomaticStage && target.diplomaticStage !== 'none') ||
        armyPower < requiredPower ||
        previous.capacities.command < 2 ||
        previous.resources.treasury < 80 ||
        previous.resources.grain < 60
      )
        return previous

      const next = structuredClone(previous)
      next.capacities.command -= 2
      next.resources.treasury -= 80
      next.resources.grain -= 60
      next.neighbors[index].tradeActive = false
      next.neighbors[index].tradeContract = null
      next.neighbors[index].relation = clamp(next.neighbors[index].relation - 25, -100, 100)

      next.activeCampaign = {
        targetId: target.id,
        targetName: target.name,
        startYear: next.year,
        startMonth: next.month,
        campaignTurn: 1,
        phase: '동원 및 진격',
        progress: 15,
        enemyMorale: 100,
        supply: 100,
        selectedOrder: null,
        lostSoldiers: 0,
        lostLevies: 0,
        lastReport: `${target.name}에 대한 원정군이 국경을 넘어 전초 진지를 구축했습니다. 작전 명령을 하달하십시오.`,
      }

      addLog(
        next,
        `[선전포고] ${target.name} 정벌 원정 개시`,
        `변경백의 군세가 국경을 넘어 ${target.name}에 대한 전면 원정에 돌입했습니다. 전비를 투입하고 교역을 단절했습니다. 다음 달 결산 전까지 작전 명령을 결정하십시오.`,
        'danger',
      )
      return next
    })
  }

  const selectCampaignOrder = (orderId: CampaignOrderId) => {
    setState((previous) => {
      if (!previous.activeCampaign) return previous
      const orderDef = CAMPAIGN_ORDERS.find((o) => o.id === orderId)
      if (!orderDef) return previous
      if (orderDef.requiresProgress && previous.activeCampaign.progress < orderDef.requiresProgress) return previous
      if (
        previous.resources.treasury < orderDef.costs.treasury ||
        previous.resources.grain < orderDef.costs.grain ||
        previous.resources.iron < orderDef.costs.iron ||
        previous.resources.timber < orderDef.costs.timber
      )
        return previous

      const next = structuredClone(previous)
      if (next.activeCampaign) {
        next.activeCampaign.selectedOrder = orderId
      }
      return next
    })
  }

  const withdrawCampaign = () => {
    setState((previous) => {
      if (!previous.activeCampaign) return previous
      const next = structuredClone(previous)
      const campaign = previous.activeCampaign
      const target = next.neighbors.find((n) => n.id === campaign.targetId)

      next.stability = clamp(next.stability - 2, 0, 100)
      if (target) {
        target.relation = clamp(target.relation - 4, -100, 100)
      }

      addLog(
        next,
        `[원정 철수] ${campaign.targetName} 전선 철수`,
        `전선 사령부가 안전한 철수를 단행했습니다. 영지 안정도가 소폭 하락했으나 영유권 명분은 유지되므로 군세를 수습한 후 재도전할 수 있습니다. (누적 전사자: 상비군 ${campaign.lostSoldiers}명, 징집병 ${campaign.lostLevies}명)`,
        'neutral',
      )

      next.activeCampaign = null
      return next
    })
  }

  const advanceMonth = () => {
    setState((previous) => {
      if (previous.pendingWorldEvent) return previous
      if (previous.activeCampaign) {
        const activeCampaign = previous.activeCampaign
        if (!activeCampaign.selectedOrder) return previous
        const orderDef = CAMPAIGN_ORDERS.find((o) => o.id === activeCampaign.selectedOrder)
        if (!orderDef) return previous
        if (
          previous.resources.treasury < orderDef.costs.treasury ||
          previous.resources.grain < orderDef.costs.grain ||
          previous.resources.iron < orderDef.costs.iron ||
          previous.resources.timber < orderDef.costs.timber
        ) {
          return previous
        }
      }

      const next = structuredClone(previous)
      const hasBureau = previous.policies.includes('royal_bureau')
      const hasCharter = previous.policies.includes('merchant_charter')
      const hasMuster = previous.policies.includes('border_muster')
      const hasTownHallAdmin = (previous.civicBuildings?.townHall?.level || 0) >= 3
      const traitAdminBonus = (previous.realmTraits || []).reduce((acc, t) => acc + (t.effects.adminBonus || 0), 0)

      next.resources.treasury = Math.max(0, previous.resources.treasury + monthlyProjection.treasury)
      next.resources.grain = Math.max(0, previous.resources.grain + monthlyProjection.grain)
      next.resources.iron += monthlyProjection.iron
      next.resources.timber += monthlyProjection.timber
      next.month += 1
      if (next.month > 12) {
        next.month = 1
        next.year += 1
      }
      next.capacities = {
        administration: 3 + (hasBureau ? 1 : 0) + (hasTownHallAdmin ? 1 : 0) + traitAdminBonus,
        diplomacy: 3 + (hasCharter ? 1 : 0),
        command: 3 + (hasMuster ? 1 : 0),
      }
      const civicPopGrowth = (previous.civicBuildings?.residences?.level || 0) * 30
      const growth = previous.resources.grain > 40 ? 85 + previous.industries.farms.level * 8 + civicPopGrowth : -45
      next.population = Math.max(1000, previous.population + growth)
      next.manpower = Math.max(0, previous.manpower + Math.max(25, Math.round(growth * 0.4)) + monthlyProjection.diplomaticManpowerYield)
      if (previous.resources.grain <= 0) next.stability = clamp(next.stability - 5, 0, 100)
      if (next.month === 1) next.royalFavor = clamp(next.royalFavor + (previous.resources.treasury >= 100 ? 2 : -3), 0, 100)

      const eventSeed = (next.year + next.month) % 4
      const events = [
        ['왕도에서 온 소식', '왕실 사절이 변경의 군비와 세입 장부를 살폈습니다. 아직은 별다른 의심을 사지 않았습니다.'],
        ['길 위의 상인들', `이번 달 ${monthlyProjection.activeTrades}개의 교역로가 영지의 시장을 풍성하게 만들었습니다.`],
        ['국경 봉화', '동부 초소에서 정체불명의 기병을 발견했습니다. 수비대가 경계를 강화합니다.'],
        ['풍년의 조짐', '하곡의 수차가 쉼 없이 돌고 있습니다. 농민들은 올해 수확을 낙관합니다.'],
      ]
      addLog(next, events[eventSeed][0], `${events[eventSeed][1]} 이번 달 결산: 금화 ${monthlyProjection.treasury >= 0 ? '+' : ''}${monthlyProjection.treasury}, 식량 ${monthlyProjection.grain >= 0 ? '+' : ''}${monthlyProjection.grain}.`, eventSeed === 2 ? 'danger' : 'neutral')

      if (monthlyProjection.suspendedTrades > 0) {
        const suspendedDetails = monthlyProjection.tradeEvaluation.routes
          .filter((r) => r.isSuspended)
          .map((r) => `${r.neighborName} (${r.suspendReason})`)
          .join(', ')
        addLog(
          next,
          '교역로 일시 중단',
          `군수 및 자원 부족으로 다음 교역로가 이번 달 일시 중단되었습니다: ${suspendedDetails}.`,
          'danger',
        )
      }

      if (monthlyProjection.suspendedDiplomacyCount > 0) {
        const suspendedDiplomacy = monthlyProjection.diplomacyEvaluation.evaluations
          .filter((e) => e.isSuspended)
          .map((e) => `${e.neighborName} (${e.suspendReason})`)
          .join(', ')
        addLog(
          next,
          '외교 협약 일시 중단',
          `국고 부족으로 다음 세력에 대한 협약 의무가 이번 달 중단되었습니다: ${suspendedDiplomacy}. (동맹 지원 중단 및 관계 악화)`,
          'danger',
        )
      }

      // Update per-neighbor diplomacy monthly progression
      const vassalRevoltIds: string[] = []
      for (const neighbor of next.neighbors) {
        if (neighbor.annexed || neighbor.id === 'crown') continue
        const stage = neighbor.diplomaticStage || 'none'
        if (stage === 'none') continue

        if (stage === 'non_aggression') {
          neighbor.treatyMonths = (neighbor.treatyMonths || 0) + 1
          if (neighbor.relation < 30) {
            neighbor.relation = clamp(neighbor.relation + 2, -100, 100)
          } else if (neighbor.relation < 50) {
            neighbor.relation = clamp(neighbor.relation + 1, -100, 100)
          }
        } else if (stage === 'alliance') {
          const evalItem = monthlyProjection.diplomacyEvaluation.evaluations.find((e) => e.neighborId === neighbor.id)
          if (evalItem?.isSuspended) {
            neighbor.treatySuspended = true
            neighbor.treatySuspendReason = evalItem.suspendReason
            neighbor.relation = clamp(neighbor.relation - 3, -100, 100)
          } else {
            neighbor.treatySuspended = false
            neighbor.treatySuspendReason = undefined
            neighbor.treatyMonths = (neighbor.treatyMonths || 0) + 1
            neighbor.relation = clamp(neighbor.relation + 1, -100, 100)
          }
        } else if (stage === 'vassal') {
          const evalItem = monthlyProjection.diplomacyEvaluation.evaluations.find((e) => e.neighborId === neighbor.id)
          if (evalItem?.isSuspended) {
            neighbor.treatySuspended = true
            neighbor.treatySuspendReason = evalItem.suspendReason
            neighbor.subjectLoyalty = clamp((neighbor.subjectLoyalty ?? 60) + (evalItem.deltaLoyalty ?? -5), 0, 100)
            neighbor.relation = clamp(neighbor.relation + (evalItem.deltaRelation ?? -4), -100, 100)
          } else {
            neighbor.treatySuspended = false
            neighbor.treatySuspendReason = undefined
            const priorLoyalty = neighbor.subjectLoyalty ?? 60
            neighbor.treatyMonths = (neighbor.treatyMonths || 0) + 1
            neighbor.subjectLoyalty = clamp(priorLoyalty + (evalItem?.deltaLoyalty ?? 3), 0, 100)
            neighbor.relation = clamp(neighbor.relation + (evalItem?.deltaRelation ?? 1), -100, 100)
            if (neighbor.treatyMonths === 3 || neighbor.treatyMonths === 6 || (priorLoyalty < 80 && neighbor.subjectLoyalty >= 80)) {
              addLog(
                next,
                `[봉신 관계 진전] ${neighbor.name}`,
                `${neighbor.name}의 봉신 관계가 ${neighbor.treatyMonths}개월 유지되었습니다. 현재 충성도 ${neighbor.subjectLoyalty}%이며, 안정적인 보호와 교역으로 평화적 편입의 기반이 다져지고 있습니다.`,
                'good',
              )
            }
          }

          if ((neighbor.subjectLoyalty ?? 0) <= 0) {
            vassalRevoltIds.push(neighbor.id)
          }
        }
      }

      // Handle vassal revolts
      for (const revoltId of vassalRevoltIds) {
        const target = next.neighbors.find((n) => n.id === revoltId)
        if (!target) continue
        target.diplomaticStage = 'none'
        target.subjectLoyalty = 0
        target.treatyMonths = 0
        target.treatySuspended = false
        target.treatySuspendReason = undefined
        target.tradeActive = false
        target.tradeContract = null
        target.claim = true
        target.relation = clamp(target.relation - 40, -100, -20)
        target.strength = Math.max(30, target.strength + 4)
        next.stability = clamp(next.stability - 8, 0, 100)
        next.legitimacy = clamp(next.legitimacy - 8, 0, 100)

        addLog(
          next,
          `[봉신 이탈] ${target.name} 종주권 거부`,
          `극심한 충성도 고갈로 인해 ${target.name}이(가) 에르덴에 대한 봉신 조약을 파기하고 독립을 선언했습니다! (안정도 -8, 정통성 -8, 영유권 명분 생성)`,
          'danger',
        )
      }

      // CAMPAIGN RESOLUTION
      if (next.activeCampaign && next.activeCampaign.selectedOrder) {
        const campaign = next.activeCampaign
        const targetIndex = next.neighbors.findIndex((n) => n.id === campaign.targetId)
        const target = targetIndex >= 0 ? next.neighbors[targetIndex] : null
        const orderDef = CAMPAIGN_ORDERS.find((o) => o.id === campaign.selectedOrder)

        if (target && orderDef) {
          next.resources.treasury = Math.max(0, next.resources.treasury - orderDef.costs.treasury)
          next.resources.grain = Math.max(0, next.resources.grain - orderDef.costs.grain)
          next.resources.iron = Math.max(0, next.resources.iron - orderDef.costs.iron)
          next.resources.timber = Math.max(0, next.resources.timber - orderDef.costs.timber)

          const activeAllies = next.neighbors.filter(
            (n) => n.diplomaticStage === 'alliance' && !n.annexed && n.id !== campaign.targetId && !n.treatySuspended,
          )
          const alliedPower = activeAllies.reduce((sum, a) => sum + a.strength * 5, 0)
          const armyPower = calculateArmyPower(next.soldiers, next.levies, next.policies.includes('standing_guard'))
          const effectivePower = armyPower + alliedPower
          const powerRatio = Math.max(0.6, effectivePower / Math.max(1, target.strength * 15))
          const seed = getDeterministicSeed(next.year, next.month, `${campaign.targetId}_${orderDef.id}`, next.soldiers)
          const variance = (seed % 7) - 3 // -3 ~ +3

          let deltaProgress = 0
          let deltaMorale = 0
          let deltaSupply = 0
          let lossS = 0
          let lossL = 0

          const allyCount = activeAllies.length
          const allyDamping = Math.max(0.7, 1 - allyCount * 0.15)

          if (orderDef.id === 'assault') {
            deltaProgress = Math.min(45, Math.max(18, Math.round(27 + Math.min(10, (powerRatio - 1) * 8) + variance + allyCount * 2)))
            deltaMorale = Math.max(12, Math.round(18 + Math.min(10, (powerRatio - 1) * 8) + variance + allyCount * 3))
            deltaSupply = Math.max(15, Math.round(22 - variance))
            lossS = Math.max(4, Math.round((16 / powerRatio + Math.abs(variance)) * allyDamping))
            lossL = Math.max(10, Math.round((34 / powerRatio + Math.abs(variance) * 2) * allyDamping))
          } else if (orderDef.id === 'siege') {
            deltaProgress = Math.min(45, Math.max(8, Math.round(15 + Math.min(8, (powerRatio - 1) * 6) + variance + allyCount * 2)))
            deltaMorale = Math.max(20, Math.round(30 + Math.min(12, (powerRatio - 1) * 10) + variance + allyCount * 3))
            deltaSupply = Math.max(10, Math.round(16 - variance))
            lossS = Math.max(2, Math.round((7 / powerRatio + Math.abs(variance)) * allyDamping))
            lossL = Math.max(4, Math.round((15 / powerRatio + Math.abs(variance)) * allyDamping))
          } else {
            deltaProgress = Math.max(0, Math.min(6, Math.round(2 + variance)))
            deltaMorale = Math.max(0, Math.round(4 + variance))
            const supplyGain = Math.max(25, Math.round(32 + Math.min(8, (powerRatio - 1) * 4) + Math.abs(variance)))
            deltaSupply = -supplyGain
            lossS = Math.max(0, Math.round(2 + (variance > 0 ? 1 : 0)))
            lossL = Math.max(1, Math.round(5 + Math.abs(variance)))
          }

          campaign.progress = Math.min(100, Math.max(0, campaign.progress + deltaProgress))
          campaign.enemyMorale = Math.max(0, campaign.enemyMorale - deltaMorale)
          if (deltaSupply < 0) {
            campaign.supply = Math.min(100, campaign.supply - deltaSupply)
          } else {
            campaign.supply = Math.max(0, campaign.supply - deltaSupply)
          }

          const actualLossS = Math.min(next.soldiers, lossS)
          const actualLossL = Math.min(next.levies, lossL)
          next.soldiers -= actualLossS
          next.levies -= actualLossL
          campaign.lostSoldiers += actualLossS
          campaign.lostLevies += actualLossL

          campaign.campaignTurn += 1
          campaign.selectedOrder = null

          if (campaign.progress >= 80 || campaign.enemyMorale <= 25) {
            campaign.phase = '적 거점 총공세'
          } else if (campaign.progress >= 45) {
            campaign.phase = '거점 포위·공성'
          } else {
            campaign.phase = '동원 및 진격'
          }

          const allyNote = allyCount > 0 ? ` [동맹군 ${activeAllies.map((a) => a.name).join(', ')} 참전 지원]` : ''
          const report = `${campaign.campaignTurn - 1}개월차 ${orderDef.name} 수행: 진군도 +${deltaProgress}% (누적 ${campaign.progress}%), 적 사기 -${deltaMorale}% (잔여 ${campaign.enemyMorale}%), 보급 ${deltaSupply < 0 ? `+${-deltaSupply}%` : `-${deltaSupply}%`} (잔여 ${campaign.supply}%), 전사 상비군 ${actualLossS}명·징집병 ${actualLossL}명.${allyNote}`
          campaign.lastReport = report
          addLog(next, `[전황 보고] ${target.name} 전선`, report, orderDef.id === 'resupply' ? 'neutral' : 'danger')

          if (campaign.progress >= 100 || campaign.enemyMorale <= 0) {
            target.annexed = true
            target.claim = false
            target.tradeActive = false
            target.tradeContract = null
            target.diplomaticStage = 'none'
            target.treatyMonths = 0
            target.subjectLoyalty = 0
            target.treatySuspended = false
            target.treatySuspendReason = undefined
            next.population += target.strength * 95
            next.manpower += target.strength * 8
            next.autonomy = clamp(next.autonomy + 5, 0, 100)
            next.stability = clamp(next.stability - 4, 0, 100)
            next.royalFavor = clamp(next.royalFavor - 8, 0, 100)

            const initialLoyalty = clamp(45 - Math.min(15, (campaign.campaignTurn - 1) * 2), 15, 60)
            const initialUnrest = clamp(45 + Math.min(25, Math.floor((campaign.lostSoldiers + campaign.lostLevies) / 10)), 30, 75)
            next.governance[target.id] = {
              neighborId: target.id,
              governanceMode: 'military_occupation',
              loyalty: initialLoyalty,
              unrest: initialUnrest,
              integration: 12,
              isCore: false,
              lastReport: `${target.name} 함락 직후 군정 점령이 개시되었습니다. 주둔군이 치안을 확보 중이나 주민들의 반발과 소요 위험이 높습니다.`,
            }

            addLog(
              next,
              `[원정 승리] ${target.name} 완전 병합`,
              `총 ${campaign.campaignTurn - 1}개월에 걸친 혈전 끝에 ${target.name}의 거점을 완전히 함락시켰습니다. 영토가 에르덴 직속령으로 병합되었으며 인구와 인력이 에르덴으로 편입되었습니다. (총 누적 전사자: 상비군 ${campaign.lostSoldiers}명, 징집병 ${campaign.lostLevies}명)`,
              'good',
            )
            next.activeCampaign = null
          } else if (campaign.supply <= 0 || next.soldiers + next.levies < 80) {
            next.stability = clamp(next.stability - 8, 0, 100)
            next.legitimacy = clamp(next.legitimacy - 6, 0, 100)
            target.relation = clamp(target.relation - 15, -100, 100)

            addLog(
              next,
              `[원정 패퇴] ${target.name} 전선 붕괴`,
              `${campaign.supply <= 0 ? '원정군의 보급선이 고갈되어' : '극심한 병력 손실로 전선을 지탱하지 못하고'} 참패하여 철수했습니다. 영지의 안정도와 정통성에 타격을 입었습니다. (총 누적 전사자: 상비군 ${campaign.lostSoldiers}명, 징집병 ${campaign.lostLevies}명)`,
              'danger',
            )
            next.activeCampaign = null
          }
        }
      } else {
        // Trigger deterministic world event from an unannexed neighbor only when no active campaign
        const worldEventResult = generateWorldEvent(next)
        if (worldEventResult) {
          next.pendingWorldEvent = worldEventResult.event
          const targetNeighbor = next.neighbors.find((n) => n.id === worldEventResult.neighborId)
          if (targetNeighbor) {
            targetNeighbor.lastAction = worldEventResult.actionName
            targetNeighbor.lastActionDate = `${next.year}년 ${next.month}월`
          }
        }
      }

      // MONTHLY GOVERNANCE RESOLUTION
      const dominionEval = monthlyProjection.dominionEvaluation
      const rebelTerritoryIds: string[] = []

      for (const neighbor of next.neighbors) {
        if (!neighbor.annexed || neighbor.id === 'crown') continue
        const gov = next.governance[neighbor.id]
        if (!gov) continue

        const evalItem = dominionEval.evaluations.find((e) => e.neighborId === neighbor.id)
        if (!evalItem) continue

        gov.loyalty = clamp(gov.loyalty + evalItem.deltaLoyalty, 0, 100)
        gov.unrest = clamp(gov.unrest + evalItem.deltaUnrest, 0, 100)
        gov.integration = clamp(gov.integration + evalItem.deltaIntegration, 0, 100)

        if (gov.isCore) {
          gov.lastReport = '완전 통합된 핵심 직할령으로서 에르덴의 안정적인 영토가 되었습니다.'
        } else if (evalItem.isStalled) {
          gov.lastReport = evalItem.stalledReason || '국고 부족으로 문화 통합 사업이 중단되어 불안이 가중되었습니다.'
          addLog(
            next,
            `통합 사업 중단: ${neighbor.name}`,
            `국고 부족으로 ${neighbor.name}의 문화 통합 사업이 이번 달 중단되었으며, 현지 주민들의 불만이 고조되었습니다. (불안 +${evalItem.deltaUnrest})`,
            'danger',
          )
        } else if (gov.governanceMode === 'military_occupation') {
          gov.lastReport = `군정 주둔군이 강제 징발을 집행했습니다. (충성 ${evalItem.deltaLoyalty}, 불안 +${evalItem.deltaUnrest})`
        } else if (gov.governanceMode === 'local_autonomy') {
          gov.lastReport = `현지 자치 의회의 안정이 유지되고 있습니다. (충성 +${evalItem.deltaLoyalty}, 불안 ${evalItem.deltaUnrest})`
        } else {
          gov.lastReport = `문화 통합 사업이 순조롭게 진행되었습니다. (통합도 +${evalItem.deltaIntegration}, 충성 +${evalItem.deltaLoyalty})`
        }

        if (gov.integration >= 100 && !gov.isCore) {
          gov.isCore = true
          addLog(
            next,
            `[완전 통합] ${neighbor.name} 본령 편입`,
            `행정·문화 통합이 100% 완료되어 ${neighbor.name}이(가) 영지의 영구적인 핵심 직할령(Core)으로 편입되었습니다. 안정된 생산과 세수를 보장합니다.`,
            'royal',
          )
        }

        // Check rebellion trigger
        if (gov.loyalty <= 0 || gov.unrest >= 100) {
          rebelTerritoryIds.push(neighbor.id)
        }
      }

      // Process rebellions
      for (const rebelId of rebelTerritoryIds) {
        const rebelNeighbor = next.neighbors.find((n) => n.id === rebelId)
        if (!rebelNeighbor) continue

        rebelNeighbor.annexed = false
        delete next.governance[rebelId]
        rebelNeighbor.tradeActive = false
        rebelNeighbor.tradeContract = null
        rebelNeighbor.diplomaticStage = 'none'
        rebelNeighbor.treatyMonths = 0
        rebelNeighbor.subjectLoyalty = 0
        rebelNeighbor.treatySuspended = false
        rebelNeighbor.treatySuspendReason = undefined
        rebelNeighbor.claim = true
        rebelNeighbor.relation = clamp(rebelNeighbor.relation - 50, -100, -30)
        rebelNeighbor.strength = Math.max(35, rebelNeighbor.strength + 8)

        next.stability = clamp(next.stability - 12, 0, 100)
        next.legitimacy = clamp(next.legitimacy - 10, 0, 100)

        addLog(
          next,
          `[반란 독립] ${rebelNeighbor.name} 무장 봉기`,
          `충성도 고갈과 주민들의 폭동으로 ${rebelNeighbor.name}이(가) 에르덴의 통치를 거부하고 무장 봉기를 일으켜 독립했습니다! 군세를 재건하고 적대 관계로 돌아섰습니다. (안정도 -12, 정통성 -10, 영유권 명분 유지)`,
          'danger',
        )

        if (next.activeCampaign?.targetId === rebelId) {
          next.activeCampaign = null
        }
      }

      // RIVAL AI INTENTS RESOLUTION & SPAWN
      if (!next.rivalIntents) next.rivalIntents = []
      const remainingIntents: RivalIntent[] = []

      for (const intent of next.rivalIntents) {
        intent.monthsRemaining -= 1
        const neighbor = next.neighbors.find((n) => n.id === intent.neighborId)
        const template = RIVAL_INTENT_TEMPLATES[intent.type]

        if (!neighbor || neighbor.annexed || !template) {
          continue
        }

        if (intent.monthsRemaining <= 0) {
          if (intent.counterStatus === 'countered' && intent.chosenCounterActionId) {
            const report = template.onExecuteCountered(neighbor, next, intent.chosenCounterActionId)
            addLog(next, report.title, report.detail, 'good')
            const dir5 = next.directives?.find((d) => d.id === 'dir_5_counter')
            if (dir5) dir5.isCompleted = true
          } else {
            const report = template.onExecuteUnprepared(neighbor, next)
            addLog(next, report.title, report.detail, 'danger')
          }
        } else {
          remainingIntents.push(intent)
        }
      }

      // Spawn new rival intent if under capacity (< 2 active intents)
      if (remainingIntents.length < 2) {
        const activeNeighborIds = new Set(remainingIntents.map((i) => i.neighborId))
        const candidates = next.neighbors.filter(
          (n) => !n.annexed && !activeNeighborIds.has(n.id),
        )

        const allTypes = Object.keys(RIVAL_INTENT_TEMPLATES) as RivalIntentType[]
        const seed = getDeterministicSeed(next.year, next.month, 'rival_spawn', next.resources.treasury)
        const possibleTemplates: RivalIntentType[] = []

        for (const type of allTypes) {
          const t = RIVAL_INTENT_TEMPLATES[type]
          const neighbor = candidates.find((n) => n.id === t.neighborId)
          if (neighbor && t.triggerCheck(neighbor, next)) {
            possibleTemplates.push(type)
          }
        }

        if (possibleTemplates.length > 0) {
          const chosenType = possibleTemplates[seed % possibleTemplates.length]
          const t = RIVAL_INTENT_TEMPLATES[chosenType]
          const newIntent: RivalIntent = {
            id: `intent_${next.year}_${next.month}_${t.neighborId}_${chosenType}`,
            neighborId: t.neighborId,
            type: chosenType,
            title: t.title,
            summary: t.summary,
            threatLevel: t.threatLevel,
            monthsRemaining: t.defaultMonthsRemaining,
            chosenCounterActionId: null,
            counterStatus: 'unprepared',
          }
          remainingIntents.push(newIntent)

          const neighbor = next.neighbors.find((n) => n.id === t.neighborId)
          if (neighbor) {
            neighbor.lastAction = t.title
            neighbor.lastActionDate = `${next.year}년 ${next.month}월`
          }

          addLog(
            next,
            `[정세 첩보] ${newIntent.title}`,
            `${newIntent.summary} (실행까지 ${newIntent.monthsRemaining}개월 잔여 · 영지 화면 '정세 및 대응' 탭에서 사전 대응책을 수립할 수 있습니다.)`,
            newIntent.threatLevel === '기회' ? 'royal' : 'danger',
          )
        }
      }

      next.rivalIntents = remainingIntents

      // AMBITION & VICTORY / DEFEAT CHECKS
      if (!next.ambitionState) {
        next.ambitionState = {
          chosenAmbitionId: null,
          triumphAchieved: null,
          defeatTriggered: null,
          acknowledgedOutcome: false,
        }
      }

      if (!next.ambitionState.triumphAchieved && !next.ambitionState.defeatTriggered) {
        const ambitionGoals = evaluateAmbitionGoals(next)
        const completedGoal = ambitionGoals.find((g) => g.isCompleted)
        if (completedGoal) {
          next.ambitionState.triumphAchieved = completedGoal.id
          addLog(
            next,
            `🏆 [대업 완수] ${completedGoal.name}`,
            `에르덴 변경백령이 위대한 역사의 한 획을 그었습니다! 목표 '${completedGoal.title}'을(를) 달성하여 대륙의 전설이 되었습니다.`,
            'royal',
          )
        } else {
          if (next.royalFavor <= 0) {
            next.ambitionState.defeatTriggered = 'crown_deposition'
            addLog(
              next,
              `☠️ [군주 폐위] 왕실 근위대의 강제 접수`,
              `왕실 총애가 완전히 바닥나 여왕의 칙령으로 변경백 직위가 박탈되고 왕실 직할령으로 강제 환수되었습니다.`,
              'danger',
            )
          } else if (next.resources.treasury <= 0 && next.resources.grain <= 0 && next.stability <= 0) {
            next.ambitionState.defeatTriggered = 'bankrupt_anarchy'
            addLog(
              next,
              `☠️ [영지 파산] 기근과 민중 봉기`,
              `재정과 곡물이 고갈되고 민심이 붕괴하여 영지 전역에서 무장 봉기가 발생, 변경백령 행정이 완전히 마비되었습니다.`,
              'danger',
            )
          }
        }
      }

      // DIRECTIVES UPDATE
      if (next.directives) {
        for (const d of next.directives) {
          if (d.isCompleted) continue
          if (d.id === 'dir_1_farm' && next.industries.farms.level >= 2) {
            d.isCompleted = true
          } else if (d.id === 'dir_2_trade' && next.neighbors.some((n) => n.tradeActive && !n.annexed)) {
            d.isCompleted = true
          } else if (d.id === 'dir_3_muster' && next.soldiers >= 220) {
            d.isCompleted = true
          } else if (
            d.id === 'dir_4_treaty' &&
            next.neighbors.some((n) => !n.annexed && n.diplomaticStage && n.diplomaticStage !== 'none')
          ) {
            d.isCompleted = true
          }
        }
      }

      // TRAITS DURATION TICK
      if (next.realmTraits && next.realmTraits.length > 0) {
        const remainingTraits: RealmTrait[] = []
        for (const trait of next.realmTraits) {
          if (typeof trait.durationMonths === 'number') {
            const nextDur = trait.durationMonths - 1
            if (nextDur <= 0) {
              addLog(next, `[특성 효과 종료] ${trait.name}`, `${trait.name} 효과 기간이 만료되었습니다.`, 'neutral')
            } else {
              remainingTraits.push({ ...trait, durationMonths: nextDur })
            }
          } else {
            remainingTraits.push(trait)
          }
        }
        next.realmTraits = remainingTraits
      }

      // CIVIC FOCUS MONTHLY EFFECTS
      const civicDef = CIVIC_FOCUS_DEFINITIONS[next.civicFocus || 'balanced']
      if (civicDef?.monthlyImpact.stabilityDelta) {
        next.stability = clamp(next.stability + civicDef.monthlyImpact.stabilityDelta, 0, 100)
      }
      if (civicDef?.monthlyImpact.autonomyDelta) {
        next.autonomy = clamp(next.autonomy + civicDef.monthlyImpact.autonomyDelta, 0, 100)
      }

      // FIELD QUEST OPPORTUNITY SPAWN
      if (!next.pendingFieldQuest && shouldSpawnFieldQuest(next.year, next.month)) {
        const nextQId = pickNextFieldQuestId(next.year, next.month, next.completedFieldQuestsCount || 0)
        const newQuest = createFieldQuestTemplate(nextQId, next.year, next.month, next.year * 100 + next.month)
        next.pendingFieldQuest = newQuest
        addLog(
          next,
          `[현장 시찰 보고] ${newQuest.title}`,
          `${newQuest.summary} (영주 순행을 직접 지휘하거나 현지 관리에게 위임할 수 있습니다.)`,
          newQuest.isJackpotOpportunity ? 'royal' : 'neutral',
        )
      }

      return next
    })
  }

  const planCounterAction = (intentId: string, actionId: string) => {
    setState((previous) => {
      const intents = previous.rivalIntents || []
      const intentIndex = intents.findIndex((i) => i.id === intentId)
      if (intentIndex < 0) return previous
      const intent = intents[intentIndex]
      const template = RIVAL_INTENT_TEMPLATES[intent.type]
      if (!template) return previous
      const action = template.counterActions.find((a) => a.id === actionId)
      if (!action) return previous

      const capCosts = action.costs.capacities || {}
      const resCosts = action.costs.resources || {}

      if (
        (capCosts.administration && previous.capacities.administration < capCosts.administration) ||
        (capCosts.diplomacy && previous.capacities.diplomacy < capCosts.diplomacy) ||
        (capCosts.command && previous.capacities.command < capCosts.command) ||
        (resCosts.treasury && previous.resources.treasury < resCosts.treasury) ||
        (resCosts.grain && previous.resources.grain < resCosts.grain) ||
        (resCosts.iron && previous.resources.iron < resCosts.iron) ||
        (resCosts.timber && previous.resources.timber < resCosts.timber)
      ) {
        return previous
      }

      const next = structuredClone(previous)
      if (capCosts.administration) next.capacities.administration -= capCosts.administration
      if (capCosts.diplomacy) next.capacities.diplomacy -= capCosts.diplomacy
      if (capCosts.command) next.capacities.command -= capCosts.command
      if (resCosts.treasury) next.resources.treasury -= resCosts.treasury
      if (resCosts.grain) next.resources.grain -= resCosts.grain
      if (resCosts.iron) next.resources.iron -= resCosts.iron
      if (resCosts.timber) next.resources.timber -= resCosts.timber

      const nextIntent = next.rivalIntents![intentIndex]
      nextIntent.chosenCounterActionId = actionId
      nextIntent.counterStatus = 'countered'

      addLog(
        next,
        `[선제 대응 하달] ${action.name}`,
        `${intent.title}에 대비하여 지침을 하달했습니다. (${action.outcomeHint}) 잔여 ${intent.monthsRemaining}개월 후 실행 시 위협이 무력화되거나 반전됩니다.`,
        'royal',
      )

      return next
    })
  }

  const claimDirectiveReward = (directiveId: string) => {
    setState((previous) => {
      const list = previous.directives || []
      const dirIndex = list.findIndex((d) => d.id === directiveId)
      if (dirIndex < 0) return previous
      const dir = list[dirIndex]
      if (!dir.isCompleted || dir.rewardClaimed) return previous

      const next = structuredClone(previous)
      const targetDir = next.directives![dirIndex]
      targetDir.rewardClaimed = true

      if (directiveId === 'dir_1_farm') {
        next.resources.treasury += 35
        next.resources.grain += 25
      } else if (directiveId === 'dir_2_trade') {
        next.resources.treasury += 45
        next.capacities.diplomacy += 1
      } else if (directiveId === 'dir_3_muster') {
        next.resources.iron += 20
        next.stability = clamp(next.stability + 3, 0, 100)
      } else if (directiveId === 'dir_4_treaty') {
        next.legitimacy = clamp(next.legitimacy + 5, 0, 100)
        next.royalFavor = clamp(next.royalFavor + 4, 0, 100)
        next.resources.treasury += 50
      } else if (directiveId === 'dir_5_counter') {
        next.stability = clamp(next.stability + 6, 0, 100)
        next.resources.treasury += 60
      }

      addLog(
        next,
        `[집무 지침 완수] ${dir.title}`,
        `군주 집무 지침을 달성하고 하사품을 수령했습니다. (${dir.rewardDesc})`,
        'good',
      )

      return next
    })
  }

  const chooseAmbition = (ambitionId: AmbitionVictoryId) => {
    setState((previous) => {
      const next = structuredClone(previous)
      if (!next.ambitionState) {
        next.ambitionState = {
          chosenAmbitionId: null,
          triumphAchieved: null,
          defeatTriggered: null,
          acknowledgedOutcome: false,
        }
      }
      next.ambitionState.chosenAmbitionId = ambitionId
      const ambitionDef = evaluateAmbitionGoals(next).find((g) => g.id === ambitionId)
      addLog(
        next,
        `[가문의 대망 선포] ${ambitionDef?.name || ambitionId}`,
        `에르덴 변경백령의 장기 국가적 대망으로 '${ambitionDef?.title || ambitionId}'을(를) 선언했습니다.`,
        'royal',
      )
      return next
    })
  }

  const acknowledgeOutcome = () => {
    setState((previous) => {
      const next = structuredClone(previous)
      if (next.ambitionState) {
        next.ambitionState.acknowledgedOutcome = true
      }
      return next
    })
  }

  const resolveWorldEvent = (choiceId: string) => {
    setState((previous) => {
      const event = previous.pendingWorldEvent
      if (!event) return previous
      const choice = event.choices.find((c) => c.id === choiceId)
      if (!choice) return previous

      const next = structuredClone(previous)
      const effects = choice.effects

      if (effects.treasury !== undefined) {
        next.resources.treasury = Math.max(0, next.resources.treasury + effects.treasury)
      }
      if (effects.grain !== undefined) {
        next.resources.grain = Math.max(0, next.resources.grain + effects.grain)
      }
      if (effects.iron !== undefined) {
        next.resources.iron = Math.max(0, next.resources.iron + effects.iron)
      }
      if (effects.timber !== undefined) {
        next.resources.timber = Math.max(0, next.resources.timber + effects.timber)
      }
      if (effects.stability !== undefined) {
        next.stability = clamp(next.stability + effects.stability, 0, 100)
      }
      if (effects.legitimacy !== undefined) {
        next.legitimacy = clamp(next.legitimacy + effects.legitimacy, 0, 100)
      }
      if (effects.autonomy !== undefined) {
        next.autonomy = clamp(next.autonomy + effects.autonomy, 0, 100)
      }
      if (effects.royalFavor !== undefined) {
        next.royalFavor = clamp(next.royalFavor + effects.royalFavor, 0, 100)
      }

      const neighbor = next.neighbors.find((n) => n.id === event.neighborId)
      if (neighbor) {
        if (effects.relation !== undefined) {
          neighbor.relation = clamp(neighbor.relation + effects.relation, -100, 100)
        }
        if (effects.neighborStrength !== undefined) {
          neighbor.strength = Math.max(10, neighbor.strength + effects.neighborStrength)
        }
        if (effects.tradeActive !== undefined) {
          neighbor.tradeActive = effects.tradeActive
        }
      }

      // Build concrete numerical chronicle record
      const changes: string[] = []
      if (effects.treasury) changes.push(`금화 ${effects.treasury > 0 ? '+' : ''}${effects.treasury}`)
      if (effects.grain) changes.push(`식량 ${effects.grain > 0 ? '+' : ''}${effects.grain}`)
      if (effects.iron) changes.push(`철 ${effects.iron > 0 ? '+' : ''}${effects.iron}`)
      if (effects.timber) changes.push(`목재 ${effects.timber > 0 ? '+' : ''}${effects.timber}`)
      if (effects.stability) changes.push(`안정도 ${effects.stability > 0 ? '+' : ''}${effects.stability}%`)
      if (effects.legitimacy) changes.push(`정통성 ${effects.legitimacy > 0 ? '+' : ''}${effects.legitimacy}%`)
      if (effects.autonomy) changes.push(`자치도 ${effects.autonomy > 0 ? '+' : ''}${effects.autonomy}%`)
      if (effects.royalFavor) changes.push(`왕실 총애 ${effects.royalFavor > 0 ? '+' : ''}${effects.royalFavor}%`)
      if (effects.relation && neighbor) changes.push(`${neighbor.name} 관계 ${effects.relation > 0 ? '+' : ''}${effects.relation}`)
      if (effects.neighborStrength && neighbor) changes.push(`${neighbor.name} 군세 ${effects.neighborStrength > 0 ? '+' : ''}${effects.neighborStrength * 15}`)
      if (effects.tradeActive !== undefined && neighbor) changes.push(`${neighbor.name} 교역로 ${effects.tradeActive ? '개설' : '중단'}`)

      const changeStr = changes.length > 0 ? ` (결과: ${changes.join(', ')})` : ''
      let tone: RealmLog['tone'] = 'neutral'
      if (effects.royalFavor && effects.royalFavor > 0) tone = 'royal'
      else if (effects.relation && effects.relation < 0) tone = 'danger'
      else if ((effects.relation && effects.relation > 0) || (effects.stability && effects.stability > 0)) tone = 'good'

      addLog(next, `[세력 대응] ${event.title}`, `${choice.label} - ${choice.description}${changeStr}`, tone)

      next.pendingWorldEvent = null
      return next
    })
  }

  const setCivicFocus = (focusId: CivicFocusId) => {
    setState((previous) => {
      if (previous.civicFocus === focusId) return previous
      const def = CIVIC_FOCUS_DEFINITIONS[focusId]
      if (!def) return previous
      const next = structuredClone(previous)
      next.civicFocus = focusId
      addLog(next, `[시정 집중 변경] ${def.name}`, `${def.shortDesc} (${def.effectDesc})`, 'neutral')
      return next
    })
  }

  const upgradeCivicBuilding = (buildingId: CivicBuildingId) => {
    setState((previous) => {
      const buildings = previous.civicBuildings || INITIAL_CIVIC_BUILDINGS
      const target = buildings[buildingId]
      if (!target || target.level >= target.maxLevel) return previous
      if (previous.capacities.administration < 1) return previous

      let discount = 0
      if (previous.realmTraits) {
        for (const t of previous.realmTraits) {
          if (t.effects.constructionDiscountRate) discount = Math.max(discount, t.effects.constructionDiscountRate)
        }
      }

      const goldCost = Math.round((target.baseCost.treasury + target.level * 35) * (1 - discount))
      const timberCost = Math.round((target.baseCost.timber + target.level * 15) * (1 - discount))
      const ironCost = Math.round((target.baseCost.iron + target.level * 10) * (1 - discount))

      if (
        previous.resources.treasury < goldCost ||
        previous.resources.timber < timberCost ||
        previous.resources.iron < ironCost
      ) {
        return previous
      }

      const next = structuredClone(previous)
      if (!next.civicBuildings) next.civicBuildings = structuredClone(INITIAL_CIVIC_BUILDINGS)
      next.resources.treasury -= goldCost
      next.resources.timber -= timberCost
      next.resources.iron -= ironCost
      next.capacities.administration -= 1
      next.civicBuildings[buildingId].level += 1

      addLog(
        next,
        `[시설 증축] ${target.name} Lv.${next.civicBuildings[buildingId].level}`,
        `국고 🪙${goldCost}, 목재 🪵${timberCost}, 철재 ⛓${ironCost}를 투입해 ${target.name}을(를) 증축했습니다. (${target.benefitText})`,
        'good',
      )
      return next
    })
  }

  const resolveFieldQuestChoice = (choiceId: string) => {
    setState((previous) => {
      if (!previous.pendingFieldQuest) return previous
      const quest = previous.pendingFieldQuest
      const currentStep = quest.steps[quest.currentStepId]
      if (!currentStep) return previous
      const choice = currentStep.choices.find((c) => c.id === choiceId)
      if (!choice) return previous

      const resCosts = choice.costs || {}
      const capCosts = choice.costsCapacities || {}
      if (
        (resCosts.treasury && previous.resources.treasury < resCosts.treasury) ||
        (resCosts.grain && previous.resources.grain < resCosts.grain) ||
        (resCosts.iron && previous.resources.iron < resCosts.iron) ||
        (resCosts.timber && previous.resources.timber < resCosts.timber) ||
        (capCosts.administration && previous.capacities.administration < capCosts.administration) ||
        (capCosts.diplomacy && previous.capacities.diplomacy < capCosts.diplomacy) ||
        (capCosts.command && previous.capacities.command < capCosts.command)
      ) {
        return previous
      }

      const next = structuredClone(previous)
      if (resCosts.treasury) next.resources.treasury -= resCosts.treasury
      if (resCosts.grain) next.resources.grain -= resCosts.grain
      if (resCosts.iron) next.resources.iron -= resCosts.iron
      if (resCosts.timber) next.resources.timber -= resCosts.timber
      if (capCosts.administration) next.capacities.administration -= capCosts.administration
      if (capCosts.diplomacy) next.capacities.diplomacy -= capCosts.diplomacy
      if (capCosts.command) next.capacities.command -= capCosts.command

      let isSuccess = true
      if (choice.riskDisclosure) {
        const roll = getDeterministicQuestRoll(previous.year, previous.month, choice.id + quest.seed)
        isSuccess = roll < choice.riskDisclosure.successRate
      }

      const appliedImpact = isSuccess ? choice.impact : choice.failureImpact

      if (appliedImpact) {
        if (appliedImpact.resources) {
          if (appliedImpact.resources.treasury) next.resources.treasury = Math.max(0, next.resources.treasury + appliedImpact.resources.treasury)
          if (appliedImpact.resources.grain) next.resources.grain = Math.max(0, next.resources.grain + appliedImpact.resources.grain)
          if (appliedImpact.resources.iron) next.resources.iron = Math.max(0, next.resources.iron + appliedImpact.resources.iron)
          if (appliedImpact.resources.timber) next.resources.timber = Math.max(0, next.resources.timber + appliedImpact.resources.timber)
        }
        if (appliedImpact.capacities) {
          if (appliedImpact.capacities.administration) next.capacities.administration += appliedImpact.capacities.administration
          if (appliedImpact.capacities.diplomacy) next.capacities.diplomacy += appliedImpact.capacities.diplomacy
          if (appliedImpact.capacities.command) next.capacities.command += appliedImpact.capacities.command
        }
        if (appliedImpact.stability) next.stability = clamp(next.stability + appliedImpact.stability, 0, 100)
        if (appliedImpact.legitimacy) next.legitimacy = clamp(next.legitimacy + appliedImpact.legitimacy, 0, 100)
        if (appliedImpact.manpower) next.manpower = Math.max(0, next.manpower + appliedImpact.manpower)
        if (appliedImpact.relationTargetId && appliedImpact.relationDelta) {
          const neighbor = next.neighbors.find((n) => n.id === appliedImpact.relationTargetId)
          if (neighbor) {
            neighbor.relation = clamp(neighbor.relation + appliedImpact.relationDelta, -100, 100)
          }
        }
        if (appliedImpact.traitAcquired) {
          if (!next.realmTraits) next.realmTraits = []
          next.realmTraits = [
            ...next.realmTraits.filter((t) => t.id !== appliedImpact.traitAcquired!.id),
            appliedImpact.traitAcquired,
          ]
        }
        addLog(next, appliedImpact.logTitle, appliedImpact.logDetail, appliedImpact.logTone)
      }

      if (choice.isTerminal) {
        next.pendingFieldQuest = null
        next.completedFieldQuestsCount = (next.completedFieldQuestsCount || 0) + 1
      } else if (choice.nextStepId && next.pendingFieldQuest) {
        next.pendingFieldQuest.currentStepId = choice.nextStepId
      }

      return next
    })
  }

  const skipFieldQuest = () => {
    setState((previous) => {
      if (!previous.pendingFieldQuest) return previous
      const questTitle = previous.pendingFieldQuest.title
      const next = structuredClone(previous)
      next.pendingFieldQuest = null
      addLog(
        next,
        `[현장 순행 위임] ${questTitle}`,
        `영주께서는 현장 순행을 현지 관리관에게 자율 위임하셨습니다. 일상 행정이 정상적으로 집행됩니다.`,
        'neutral',
      )
      return next
    })
  }

  const resetRealm = () => {
    if (!window.confirm('영지 경영 진행도를 처음부터 다시 시작하시겠습니까?')) return
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem('my_world_game_save_v2')
    localStorage.removeItem('my_world_game_save_v1')
    localStorage.setItem('my_world_legacy_migrated_v3', 'true')
    setState(cloneInitialState())
  }

  return {
    state,
    monthlyProjection,
    upgradeIndustry,
    enactPolicy,
    recruitSoldiers,
    callLevies,
    diplomaticAction,
    changeTradeContract,
    launchCampaign,
    selectCampaignOrder,
    withdrawCampaign,
    advanceMonth,
    resolveWorldEvent,
    resetRealm,
    changeGovernanceMode,
    signTreaty,
    breakTreaty,
    annexSubjectPeacefully,
    planCounterAction,
    claimDirectiveReward,
    chooseAmbition,
    acknowledgeOutcome,
    setCivicFocus,
    upgradeCivicBuilding,
    resolveFieldQuestChoice,
    skipFieldQuest,
  }

}

export type RealmHandle = ReturnType<typeof useRealmState>

