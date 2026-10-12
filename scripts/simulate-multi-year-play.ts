import {
  INITIAL_REALM_STATE,
  calculateArmyPower,
  evaluateDiplomacy,
  evaluateGovernedTerritories,
  evaluateTradeRoutes,
} from '../src/constants/realmData'
import {
  RIVAL_INTENT_TEMPLATES,
} from '../src/constants/rivalAiData'
import { getDeterministicSeed } from '../src/constants/worldEvents'
import type {
  RealmState,
  RivalIntent,
  RivalIntentType,
} from '../src/types/realm'


function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`)
    process.exit(1)
  }
  console.log(`✓ ${msg}`)
}

console.log('======================================================================')
console.log('MY-WORLD 9차: 실제 게임플레이 24개월(2년) 다월 시뮬레이션 검증')
console.log('======================================================================')

let state: RealmState = JSON.parse(JSON.stringify(INITIAL_REALM_STATE))

// Helper function to simulate monthly turn advancement identical to useRealmState
function simulateAdvanceMonth(s: RealmState) {
  const farm = s.industries.farms.level
  const ironworks = s.industries.ironworks.level
  const market = s.industries.market.level
  const lumber = s.industries.lumberyard.level
  const taxBonus = s.policies.includes('land_register') ? 1.15 : 1
  const baseGrossIncome = Math.round((34 + farm * 6 + ironworks * 5 + market * 18 + lumber * 4) * taxBonus)
  const militaryUpkeep = Math.ceil(s.soldiers / 30) + Math.ceil(s.levies / 180) + (s.policies.includes('standing_guard') ? 8 : 0)

  const tradeEval = evaluateTradeRoutes(s.neighbors, s.resources, s.policies, null)
  const diplomacyEval = evaluateDiplomacy(s.neighbors, s.resources, undefined)
  const dominionEval = evaluateGovernedTerritories(s.neighbors, s.governance, s.resources, s.policies)

  s.resources.treasury = Math.max(0, s.resources.treasury + baseGrossIncome + tradeEval.totalNet.treasury + diplomacyEval.totalNet.treasury + dominionEval.totalNet.treasury - militaryUpkeep)
  s.resources.grain = Math.max(0, s.resources.grain + farm * 18 - Math.ceil((s.population + s.soldiers) / 850) + tradeEval.totalNet.grain + diplomacyEval.totalNet.grain + dominionEval.totalNet.grain)
  s.resources.iron += ironworks * 7 + tradeEval.totalNet.iron + diplomacyEval.totalNet.iron + dominionEval.totalNet.iron
  s.resources.timber += lumber * 10 + tradeEval.totalNet.timber + diplomacyEval.totalNet.timber + dominionEval.totalNet.timber

  s.month += 1
  if (s.month > 12) {
    s.month = 1
    s.year += 1
  }

  s.capacities = { administration: 3, diplomacy: 3, command: 3 }
  const growth = s.resources.grain > 40 ? 85 + farm * 8 : -45
  s.population = Math.max(1000, s.population + growth)
  s.manpower = Math.max(0, s.manpower + Math.max(25, Math.round(growth * 0.4)) + diplomacyEval.totalManpowerYield)

  // Rival AI resolution & spawn
  if (!s.rivalIntents) s.rivalIntents = []
  const remainingIntents: RivalIntent[] = []

  for (const intent of s.rivalIntents) {
    intent.monthsRemaining -= 1
    const neighbor = s.neighbors.find((n) => n.id === intent.neighborId)
    const template = RIVAL_INTENT_TEMPLATES[intent.type]

    if (!neighbor || neighbor.annexed || !template) continue

    if (intent.monthsRemaining <= 0) {
      if (intent.counterStatus === 'countered' && intent.chosenCounterActionId) {
        template.onExecuteCountered(neighbor, s, intent.chosenCounterActionId)
        const dir5 = s.directives?.find((d) => d.id === 'dir_5_counter')
        if (dir5) dir5.isCompleted = true
      } else {
        template.onExecuteUnprepared(neighbor, s)
      }
    } else {
      remainingIntents.push(intent)
    }
  }

  // Spawn new intent if room
  if (remainingIntents.length < 2) {
    const activeNeighborIds = new Set(remainingIntents.map((i) => i.neighborId))
    const candidates = s.neighbors.filter((n) => !n.annexed && !activeNeighborIds.has(n.id))
    const allTypes = Object.keys(RIVAL_INTENT_TEMPLATES) as RivalIntentType[]
    const seed = getDeterministicSeed(s.year, s.month, 'rival_spawn', s.resources.treasury)
    const possible: RivalIntentType[] = []

    for (const type of allTypes) {
      const t = RIVAL_INTENT_TEMPLATES[type]
      const n = candidates.find((c) => c.id === t.neighborId)
      if (n && t.triggerCheck(n, s)) possible.push(type)
    }

    if (possible.length > 0) {
      const chosenType = possible[seed % possible.length]
      const t = RIVAL_INTENT_TEMPLATES[chosenType]
      remainingIntents.push({
        id: `intent_${s.year}_${s.month}_${t.neighborId}_${chosenType}`,
        neighborId: t.neighborId,
        type: chosenType,
        title: t.title,
        summary: t.summary,
        threatLevel: t.threatLevel,
        monthsRemaining: t.defaultMonthsRemaining,
        chosenCounterActionId: null,
        counterStatus: 'unprepared',
      })
    }
  }

  s.rivalIntents = remainingIntents

  // Directives update
  if (s.directives) {
    for (const d of s.directives) {
      if (d.isCompleted) continue
      if (d.id === 'dir_1_farm' && s.industries.farms.level >= 2) d.isCompleted = true
      else if (d.id === 'dir_2_trade' && s.neighbors.some((n) => n.tradeActive && !n.annexed)) d.isCompleted = true
      else if (d.id === 'dir_3_muster' && s.soldiers >= 220) d.isCompleted = true
      else if (d.id === 'dir_4_treaty' && s.neighbors.some((n) => !n.annexed && n.diplomaticStage && n.diplomaticStage !== 'none')) d.isCompleted = true
    }
  }
}

// Year 731 Month 3: 시작
assert(state.year === 731 && state.month === 3, '초기 게임 시작 왕력 731년 3월')

// Step 1: 과업 1 (농장 증축)
state.resources.treasury -= (70 + 1 * 45) // 115
state.resources.timber -= (12 + 1 * 6) // 18
state.industries.farms.level = 2
simulateAdvanceMonth(state) // 731년 4월
const dir1 = state.directives!.find((d) => d.id === 'dir_1_farm')!
assert(dir1.isCompleted === true, '과업 1(농장 2레벨) 달성')
dir1.rewardClaimed = true
state.resources.treasury += 35
state.resources.grain += 25
console.log(`[731년 4월] 과업 1 완료 및 보상 수령 (금화: ${state.resources.treasury}, 식량: ${state.resources.grain})`)

// Step 2: 과업 2 (첫 교역로 개설: 실바나 숲의회)
const sylvana = state.neighbors.find((n) => n.id === 'sylvana')!
sylvana.tradeActive = true
sylvana.tradeContract = 'balanced_exchange'
simulateAdvanceMonth(state) // 731년 5월
const dir2 = state.directives!.find((d) => d.id === 'dir_2_trade')!
assert(dir2.isCompleted === true, '과업 2(첫 교역로) 달성')
dir2.rewardClaimed = true
state.resources.treasury += 45
console.log(`[731년 5월] 과업 2 완료 및 보상 수령 (금화: ${state.resources.treasury})`)

// Step 3: 과업 3 (상비군 증편: 220명 이상)
state.soldiers = 230
state.manpower -= 60
simulateAdvanceMonth(state) // 731년 6월
const dir3 = state.directives!.find((d) => d.id === 'dir_3_muster')!
assert(dir3.isCompleted === true, '과업 3(상비군 220명) 달성')
dir3.rewardClaimed = true
state.resources.iron += 20
console.log(`[731년 6월] 과업 3 완료 및 보상 수령 (철: ${state.resources.iron})`)

// Step 4: 과업 4 (불가침 조약 체결)
sylvana.diplomaticStage = 'non_aggression'
sylvana.treatyMonths = 1
simulateAdvanceMonth(state) // 731년 7월
const dir4 = state.directives!.find((d) => d.id === 'dir_4_treaty')!
assert(dir4.isCompleted === true, '과업 4(불가침 조약) 달성')
dir4.rewardClaimed = true
state.resources.treasury += 50
console.log(`[731년 7월] 과업 4 완료 및 보상 수령`)

// Step 5: 라이벌 AI 책략 스폰 및 플레이어의 선제 대응 테스트
console.log(`\n[731년 8월~12월: 라이벌 AI 책략 스폰 및 대응 시뮬레이션]`)
for (let i = 0; i < 4; i++) {
  simulateAdvanceMonth(state)
}
console.log(`현재 활성 책략 수: ${state.rivalIntents?.length || 0}`)
assert((state.rivalIntents?.length || 0) > 0, '다월 진행 후 인접 세력 라이벌 책략 정상 발생')

const activeIntent = state.rivalIntents![0]
console.log(`포착된 첩보: [${activeIntent.threatLevel}] ${activeIntent.title} (발동까지 ${activeIntent.monthsRemaining}개월)`)

// 플레이어의 선제 대응 하달
const template = RIVAL_INTENT_TEMPLATES[activeIntent.type]
const chosenAction = template.counterActions[0]
activeIntent.chosenCounterActionId = chosenAction.id
activeIntent.counterStatus = 'countered'
console.log(`플레이어 선제 지침 하달: ${chosenAction.name} (${chosenAction.outcomeHint})`)

// 잔여 개월 수만큼 진행하여 최종 발동 검증
const monthsWait = activeIntent.monthsRemaining
for (let i = 0; i < monthsWait; i++) {
  simulateAdvanceMonth(state)
}

const dir5 = state.directives!.find((d) => d.id === 'dir_5_counter')!
assert(dir5.isCompleted === true, '과업 5(라이벌 책략 선제 대응 성공) 완료!')
dir5.rewardClaimed = true
state.resources.treasury += 60
console.log(`[과업 5 완수] 모든 군주 집무 지침서 5개 과업 100% 클리어!`)

// 24개월(2년) 완주 확인 (플레이어가 발생하는 책략에 능동적으로 대응하는 정상 플레이 궤적)
while (state.year < 733 || (state.year === 733 && state.month < 3)) {
  for (const intent of state.rivalIntents || []) {
    if (intent.counterStatus !== 'countered') {
      const t = RIVAL_INTENT_TEMPLATES[intent.type]
      intent.chosenCounterActionId = t.counterActions[0].id
      intent.counterStatus = 'countered'
    }
  }
  simulateAdvanceMonth(state)
}
assert(state.year >= 733, '2년 이상 장기 플레이 안정적 완주')
assert(state.resources.treasury > 0, '재정 안정 유지')
assert(state.resources.grain > 0, '식량 보급 유지')
assert(state.stability >= 50, '민심 안정도 50% 이상 유지')


console.log(`\n최종 시뮬레이션 결과: 왕력 ${state.year}년 ${state.month}월`)
console.log(`인구: ${state.population.toLocaleString()}명 · 국고: 🪙${state.resources.treasury} · 식량: 🌾${state.resources.grain} · 군세: ${calculateArmyPower(state.soldiers, state.levies, false)}`)
console.log('======================================================================')
console.log('✅ 24개월 다월 플레이 시뮬레이션 및 분기 검증 완료!')
console.log('======================================================================')
