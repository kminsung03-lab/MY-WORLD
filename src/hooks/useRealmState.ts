import { useCallback, useEffect, useMemo, useState } from 'react'
import { CAMPAIGN_ORDERS, INDUSTRIES, INITIAL_REALM_STATE, POLICIES, calculateArmyPower } from '../constants/realmData'
import { generateWorldEvent, getDeterministicSeed } from '../constants/worldEvents'
import type { CampaignOrderId, Doctrine, IndustryId, PolicyId, RealmLog, RealmState } from '../types/realm'

const SAVE_KEY = 'my_world_realm_save_v1'

const cloneInitialState = (): RealmState => JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const policyDoctrine: Record<Exclude<Doctrine, 'unset'>, string> = {
  stewardship: '질서의 길',
  commerce: '번영의 길',
  military: '철혈의 길',
}

let logCounter = 0

export function useRealmState() {
  const [state, setState] = useState<RealmState>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const initial = cloneInitialState()
        return {
          ...initial,
          ...parsed,
          neighbors: (parsed.neighbors || initial.neighbors).map((savedN: any, idx: number) => {
            const fallback = initial.neighbors.find((n) => n.id === savedN.id) || initial.neighbors[idx] || initial.neighbors[0]
            return {
              ...fallback,
              ...savedN,
              lastAction: savedN.lastAction || undefined,
              lastActionDate: savedN.lastActionDate || undefined,
            }
          }),
          pendingWorldEvent: parsed.pendingWorldEvent || null,
          activeCampaign: parsed.activeCampaign || null,
        }
      }
    } catch (error) {
      console.error('Failed to load realm save', error)
    }
    return cloneInitialState()
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

          const armyPower = calculateArmyPower(next.soldiers, next.levies, next.policies.includes('standing_guard'))
          const powerRatio = Math.max(0.6, armyPower / Math.max(1, target.strength * 15))
          const seed = getDeterministicSeed(next.year, next.month, `${campaign.targetId}_${orderDef.id}`, next.soldiers)
          const variance = (seed % 7) - 3 // -3 ~ +3

          let deltaProgress = 0
          let deltaMorale = 0
          let deltaSupply = 0
          let lossS = 0
          let lossL = 0

          if (orderDef.id === 'assault') {
            deltaProgress = Math.min(45, Math.max(18, Math.round(27 + Math.min(10, (powerRatio - 1) * 8) + variance)))
            deltaMorale = Math.max(12, Math.round(18 + Math.min(10, (powerRatio - 1) * 8) + variance))
            deltaSupply = Math.max(15, Math.round(22 - variance))
            lossS = Math.max(4, Math.round(16 / powerRatio + Math.abs(variance)))
            lossL = Math.max(10, Math.round(34 / powerRatio + Math.abs(variance) * 2))
          } else if (orderDef.id === 'siege') {
            deltaProgress = Math.min(45, Math.max(8, Math.round(15 + Math.min(8, (powerRatio - 1) * 6) + variance)))
            deltaMorale = Math.max(20, Math.round(30 + Math.min(12, (powerRatio - 1) * 10) + variance))
            deltaSupply = Math.max(10, Math.round(16 - variance))
            lossS = Math.max(2, Math.round(7 / powerRatio + Math.abs(variance)))
            lossL = Math.max(4, Math.round(15 / powerRatio + Math.abs(variance)))
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

          const report = `${campaign.campaignTurn - 1}개월차 ${orderDef.name} 수행: 진군도 +${deltaProgress}% (누적 ${campaign.progress}%), 적 사기 -${deltaMorale}% (잔여 ${campaign.enemyMorale}%), 보급 ${deltaSupply < 0 ? `+${-deltaSupply}%` : `-${deltaSupply}%`} (잔여 ${campaign.supply}%), 전사 상비군 ${actualLossS}명·징집병 ${actualLossL}명.`
          campaign.lastReport = report
          addLog(next, `[전황 보고] ${target.name} 전선`, report, orderDef.id === 'resupply' ? 'neutral' : 'danger')

          if (campaign.progress >= 100 || campaign.enemyMorale <= 0) {
            target.annexed = true
            target.claim = false
            target.tradeActive = false
            next.population += target.strength * 95
            next.manpower += target.strength * 8
            next.autonomy = clamp(next.autonomy + 5, 0, 100)
            next.stability = clamp(next.stability - 4, 0, 100)
            next.royalFavor = clamp(next.royalFavor - 8, 0, 100)

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
    selectCampaignOrder,
    withdrawCampaign,
    advanceMonth,
    resolveWorldEvent,
    resetRealm,
  }
}

export type RealmHandle = ReturnType<typeof useRealmState>
