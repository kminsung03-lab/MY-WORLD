import { useCallback, useEffect, useMemo, useState } from 'react'
import { INDUSTRIES, INITIAL_REALM_STATE, POLICIES } from '../constants/realmData'
import type { Doctrine, IndustryId, PolicyId, RealmLog, RealmState } from '../types/realm'

const SAVE_KEY = 'my_world_realm_save_v1'

const cloneInitialState = (): RealmState => JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const policyDoctrine: Record<Exclude<Doctrine, 'unset'>, string> = {
  stewardship: '질서의 길',
  commerce: '번영의 길',
  military: '철혈의 길',
}

export function useRealmState() {
  const [state, setState] = useState<RealmState>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY)
      if (saved) return { ...cloneInitialState(), ...JSON.parse(saved) }
    } catch (error) {
      console.error('Failed to load realm save', error)
    }
    return cloneInitialState()
  })

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  }, [state])

  const addLog = useCallback((draft: RealmState, title: string, detail: string, tone: RealmLog['tone'] = 'neutral') => {
    draft.logs = [
      { id: `${Date.now()}-${Math.random()}`, date: `${draft.year}년 ${draft.month}월`, title, detail, tone },
      ...draft.logs.slice(0, 11),
    ]
  }, [])

  const monthlyProjection = useMemo(() => {
    const farm = state.industries.farms.level
    const ironworks = state.industries.ironworks.level
    const market = state.industries.market.level
    const lumber = state.industries.lumberyard.level
    const activeTrades = state.neighbors.filter((neighbor) => neighbor.tradeActive && !neighbor.annexed).length
    const taxBonus = state.policies.includes('land_register') ? 1.15 : 1
    const tradeBase = state.policies.includes('merchant_charter') ? 18 : 12
    const freePort = state.policies.includes('free_port') ? 12 : 0
    const grossIncome = Math.round((34 + farm * 6 + ironworks * 5 + market * 18 + lumber * 4) * taxBonus + activeTrades * (tradeBase + freePort))
    const militaryUpkeep = Math.ceil(state.soldiers / 30) + Math.ceil(state.levies / 180) + (state.policies.includes('standing_guard') ? 8 : 0)
    return {
      treasury: grossIncome - militaryUpkeep,
      grossIncome,
      militaryUpkeep,
      grain: farm * 18 - Math.ceil((state.population + state.soldiers) / 850),
      iron: ironworks * 7,
      timber: lumber * 10,
      activeTrades,
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

  const diplomaticAction = (neighborId: string, action: 'improve' | 'trade' | 'pressure') => {
    setState((previous) => {
      const index = previous.neighbors.findIndex((neighbor) => neighbor.id === neighborId)
      if (index < 0) return previous
      const target = previous.neighbors[index]
      if (target.annexed) return previous
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
        neighbor.relation = clamp(neighbor.relation + 6, -100, 100)
        addLog(next, `${target.name} 교역로 개설`, `${target.specialty} 상단이 국경을 오가기 시작했습니다. 매달 교역 수입이 발생합니다.`, 'good')
      } else {
        if (target.id === 'crown' || target.claim || previous.capacities.command < 1 || previous.legitimacy < 45) return previous
        next.capacities.command -= 1
        neighbor.claim = true
        neighbor.relation = clamp(neighbor.relation - 22, -100, 100)
        next.royalFavor = clamp(next.royalFavor - 4, 0, 100)
        addLog(next, `${target.name}에 대한 명분 조작`, '옛 문서와 국경 분쟁을 근거로 영유권을 공표했습니다. 상대가 강하게 반발합니다.', 'danger')
      }
      return next
    })
  }

  const launchCampaign = (neighborId: string) => {
    setState((previous) => {
      const index = previous.neighbors.findIndex((neighbor) => neighbor.id === neighborId)
      if (index < 0) return previous
      const target = previous.neighbors[index]
      const armyPower = Math.round(previous.soldiers * (previous.policies.includes('standing_guard') ? 2.75 : 2.2) + previous.levies * 0.65)
      const requiredPower = target.strength * 15
      if (target.id === 'crown' || target.annexed || !target.claim || armyPower < requiredPower || previous.capacities.command < 2 || previous.resources.treasury < 80 || previous.resources.grain < 60) return previous
      const next = structuredClone(previous)
      next.capacities.command -= 2
      next.resources.treasury -= 80
      next.resources.grain -= 60
      next.soldiers = Math.max(40, next.soldiers - Math.ceil(target.strength * 0.7))
      next.levies = Math.max(80, next.levies - Math.ceil(target.strength * 1.4))
      next.neighbors[index].annexed = true
      next.neighbors[index].tradeActive = false
      next.population += target.strength * 95
      next.manpower += target.strength * 8
      next.autonomy = clamp(next.autonomy + 5, 0, 100)
      next.stability = clamp(next.stability - 4, 0, 100)
      next.royalFavor = clamp(next.royalFavor - 8, 0, 100)
      addLog(next, `${target.name} 병합`, '원정군이 적의 거점을 함락했습니다. 영지는 넓어졌지만 왕실과 주민 모두 당신의 다음 행보를 주시합니다.', 'danger')
      return next
    })
  }

  const advanceMonth = () => {
    setState((previous) => {
      const next = structuredClone(previous)
      const hasBureau = previous.policies.includes('royal_bureau')
      const hasCharter = previous.policies.includes('merchant_charter')
      const hasMuster = previous.policies.includes('border_muster')
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
        administration: 3 + (hasBureau ? 1 : 0),
        diplomacy: 3 + (hasCharter ? 1 : 0),
        command: 3 + (hasMuster ? 1 : 0),
      }
      const growth = previous.resources.grain > 40 ? 85 + previous.industries.farms.level * 8 : -45
      next.population = Math.max(1000, previous.population + growth)
      next.manpower = Math.max(0, previous.manpower + Math.max(25, Math.round(growth * 0.4)))
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
      return next
    })
  }

  const resetRealm = () => {
    if (!window.confirm('영지 경영 진행도를 처음부터 다시 시작하시겠습니까?')) return
    localStorage.removeItem(SAVE_KEY)
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
    launchCampaign,
    advanceMonth,
    resetRealm,
  }
}
