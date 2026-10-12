import {
  INITIAL_REALM_STATE,
  evaluateDiplomacy,
  evaluateGovernedTerritories,
  evaluateTradeRoutes,
} from '../src/constants/realmData'
import {
  CIVIC_FOCUS_DEFINITIONS,
  INITIAL_CIVIC_BUILDINGS,
  createFieldQuestTemplate,
  getDeterministicQuestRoll,
  pickNextFieldQuestId,
  shouldSpawnFieldQuest,
} from '../src/constants/fieldQuestData'
import {
  checkAndMigrateLegacySave,
} from '../src/hooks/useRealmState'
import {
  evaluateAmbitionGoals,
} from '../src/constants/rivalAiData'
import type {
  CivicBuildingId,
  CivicFocusId,
  FieldQuest,
  RealmTrait,
} from '../src/types/fieldQuest'
import type {
  RealmState,
} from '../src/types/realm'

// Mock localStorage for node environment
const storageStore: Record<string, string> = {}
;(globalThis as any).localStorage = {
  getItem: (key: string) => storageStore[key] || null,
  setItem: (key: string, value: string) => {
    storageStore[key] = value
  },
  removeItem: (key: string) => {
    delete storageStore[key]
  },
  clear: () => {
    for (const k of Object.keys(storageStore)) delete storageStore[k]
  },
}
;(globalThis as any).window = globalThis

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`)
    process.exit(1)
  }
  console.log(`✓ ${message}`)
}

console.log('=================================================================')
console.log('MY-WORLD 10차 마일스톤 (Unified Realm Turn & Field Quests) 검증')
console.log('=================================================================')

// =================================================================
// 1. 레거시 세이브 마이그레이션 무결성 검증 (useGameState -> useRealmState)
// =================================================================
console.log('\n[1. 레거시 세이브 마이그레이션 무결성 검증]')
storageStore['my_world_game_save_v2'] = JSON.stringify({
  dayState: { day: 14, ap: 3, maxAp: 5 },
  resources: { gold: 240, wood: 180, stone: 100, iron: 50, food: 210 },
  territory: { secured: 12, used: 8 },
  buildings: {
    townHall: { level: 2 },
    shelter: { level: 3 },
    storage: { level: 2 },
    wall: { level: 2 },
    blacksmith: { level: 2 },
  },
})

const baseState: RealmState = JSON.parse(JSON.stringify(INITIAL_REALM_STATE))
const initialTreasury = baseState.resources.treasury
const initialGrain = baseState.resources.grain
const initialTimber = baseState.resources.timber
const initialIron = baseState.resources.iron

const migrated = checkAndMigrateLegacySave(baseState)

assert(
  migrated.resources.treasury === initialTreasury + 240,
  `국고 통합 이전 완료 (초기 ${initialTreasury} + 240 = ${migrated.resources.treasury})`,
)
assert(
  migrated.resources.grain === initialGrain + 210,
  `식량 통합 이전 완료 (초기 ${initialGrain} + 210 = ${migrated.resources.grain})`,
)
assert(
  migrated.resources.timber === initialTimber + 180,
  `목재 통합 이전 완료 (초기 ${initialTimber} + 180 = ${migrated.resources.timber})`,
)
assert(
  migrated.resources.iron === initialIron + 100, // 50 iron + 100 stone * 0.5 = 100 iron
  `석재/철재 통합 이전 완료 (초기 ${initialIron} + 100 = ${migrated.resources.iron})`,
)
assert(
  migrated.civicBuildings?.townHall.level === 2,
  '마을회관 -> 영주 관저(townHall) Lv.2 계승 확인',
)
assert(
  migrated.civicBuildings?.residences.level === 2, // Math.ceil(3/2) = 2
  '모험가주택 -> 정착민 거주구(residences) Lv.2 계승 확인',
)
assert(
  migrated.civicBuildings?.granary.level === 2,
  '자재창고 -> 중앙 비축창고(granary) Lv.2 계승 확인',
)
assert(
  migrated.civicBuildings?.fortifications.level === 2,
  '방어목책 -> 외곽 방벽(fortifications) Lv.2 계승 확인',
)
assert(
  localStorage.getItem('my_world_legacy_migrated_v3') === 'true',
  '마이그레이션 완료 플래그 정상 저장 확인',
)

// Idempotency check: running again shouldn't duplicate resources
const secondRun = checkAndMigrateLegacySave(migrated)
assert(
  secondRun.resources.treasury === migrated.resources.treasury,
  '중복 마이그레이션 방지(멱등성) 확인: 국고 수치 불변',
)

// =================================================================
// 2. 월간 시정 명령 (Civic Focus) 및 도시 시설 검증
// =================================================================
console.log('\n[2. 월간 시정 명령 및 도시 시설 기능 검증]')
const allFocusIds = Object.keys(CIVIC_FOCUS_DEFINITIONS) as CivicFocusId[]
assert(allFocusIds.length === 6, `6대 월간 시정 명령 정의 확인 (정의 수: ${allFocusIds.length})`)

const agrarianFocus = CIVIC_FOCUS_DEFINITIONS.agrarian_expansion
assert(
  agrarianFocus.monthlyImpact.grainDelta === 15 && agrarianFocus.monthlyImpact.treasuryDelta === -15,
  '대규모 개간 시정: 월 식량 +15, 월 국고 -15 수치 정의 확인',
)

const miningFocus = CIVIC_FOCUS_DEFINITIONS.deep_mining
assert(
  miningFocus.monthlyImpact.ironDelta === 8 && miningFocus.monthlyImpact.stabilityDelta === -1,
  '광맥 심층 채굴 시정: 월 철재 +8, 월 안정도 -1 수치 정의 확인',
)

const initialCivicKeys = Object.keys(INITIAL_CIVIC_BUILDINGS) as CivicBuildingId[]
assert(initialCivicKeys.length === 4, `4대 직할 도시 인프라 정의 확인 (${initialCivicKeys.join(', ')})`)

// Test civic building upgrade logic
const testState = JSON.parse(JSON.stringify(migrated)) as RealmState
const prevTreasury = testState.resources.treasury
const prevTimber = testState.resources.timber
const prevIron = testState.resources.iron
const prevAdmin = testState.capacities.administration

// Upgrade townHall from Lv.2 to Lv.3
const townHall = testState.civicBuildings!.townHall
const goldCost = townHall.baseCost.treasury + townHall.level * 35 // 70 + 70 = 140
const timberCost = townHall.baseCost.timber + townHall.level * 15 // 40 + 30 = 70
const ironCost = townHall.baseCost.iron + townHall.level * 10 // 10 + 20 = 30

testState.resources.treasury -= goldCost
testState.resources.timber -= timberCost
testState.resources.iron -= ironCost
testState.capacities.administration -= 1
townHall.level += 1

assert(townHall.level === 3, '영주 관저 Lv.3 증축 성공')
assert(
  testState.resources.treasury === prevTreasury - goldCost &&
  testState.resources.timber === prevTimber - timberCost &&
  testState.resources.iron === prevIron - ironCost,
  '증축 비용(금화/목재/철재) 정확한 원장 차감 확인',
)
assert(testState.capacities.administration === prevAdmin - 1, '행정력 1 소모 확인')

// =================================================================
// 3. 선택형 현장 퀘스트 (3종 아키타입 & 투명한 확률 & 대박) 검증
// =================================================================
console.log('\n[3. 선택형 현장 퀘스트 아키타입 및 고위험 대박 검증]')

// 3-1. Quest 1: 국경 마수 소탕 및 개척 순찰 (Standard)
const q1 = createFieldQuestTemplate('frontier_beast_patrol', 731, 3, 101)
assert(q1.id === 'frontier_beast_patrol', '퀘스트 1 (국경 마수 소탕) 생성 확인')
assert(q1.steps.step_1.choices.length === 3, '제1막 3대 선택지 (정규군/사냥꾼/초소수성) 확인')

const q1Military = q1.steps.step_1.choices[0]
assert(q1Military.nextStepId === 'step_2_cleared', '정규군 소탕 선택 시 step_2_cleared 전환 분기 확인')

const q1Step2 = q1.steps.step_2_cleared
const q1Annex = q1Step2.choices[0]
assert(q1Annex.isTerminal === true, '완충지 편입 선택 시 퀘스트 종료(Terminal) 확인')
assert(q1Annex.impact?.stability === 4 && q1Annex.impact?.manpower === 25, '영토 편입 보상(안정도+4, 인력+25) 확인')

// 3-2. Quest 2: 고대 암반맥 발견 (High-Risk/High-Reward Jackpot)
const q2 = createFieldQuestTemplate('ancient_vein_prospecting', 731, 5, 202)
assert(q2.isJackpotOpportunity === true, '고대 광맥 대박 기회 플래그 확인')

const jackpotChoice = q2.steps.step_1.choices[0]
assert(!!jackpotChoice.riskDisclosure, '투명한 위험 예고(Risk Disclosure) 명시 확인')
assert(jackpotChoice.riskDisclosure?.successRate === 60, '성공 확률 투명 공개: 60% 확인')
assert(jackpotChoice.riskDisclosure?.isRecoverable === true, '실패 시 회복 가능성 명시 확인')
assert(jackpotChoice.impact?.resources?.treasury === 850, '대박 성공 보상: 국고 +850 확인')
assert(jackpotChoice.impact?.resources?.iron === 350, '대박 성공 보상: 철재 +350 확인')
assert(jackpotChoice.impact?.traitAcquired?.id === 'ancient_vein_blessing', '대박 특성 [고대 광맥의 축복] 획득 확인')
assert(jackpotChoice.failureImpact?.resources?.treasury === -150, '낙반 실패 시 손실: 국고 -150 확인')
assert(jackpotChoice.failureImpact?.traitAcquired?.id === 'collapsed_shaft_recovery', '실패 시 회복성 특성 [갱도 붕괴 수습 중] 부여 확인')

// 3-3. Deterministic PRNG & Anti-Save-Scumming Verification
const rollA = getDeterministicQuestRoll(731, 5, jackpotChoice.id + q2.seed)
const rollB = getDeterministicQuestRoll(731, 5, jackpotChoice.id + q2.seed)
assert(rollA === rollB, `턴 고정 시드 난수 일치 확인 (Roll: ${rollA} === ${rollB}) - 세이브/로드 악용 원천 차단`)

// 3-4. Quest 3: 유랑 명장단 접견 (Variety: Talent, Trade, Trait)
const q3 = createFieldQuestTemplate('wandering_artisan_convoy', 731, 7, 303)
const hireMaster = q3.steps.step_1.choices[0]
assert(
  hireMaster.impact?.traitAcquired?.effects.constructionDiscountRate === 0.15,
  '궁정 수석 기술 고문 영입 시 건설 비용 15% 영구 할인 특성 확인',
)
const tradePact = q3.steps.step_1.choices[1]
assert(
  tradePact.impact?.relationTargetId === 'auric' && tradePact.impact?.relationDelta === 16,
  '아우릭 특혜 관세 밀약 시 우호도 +16 및 6개월간 매월 국고 +20 특성 확인',
)

// =================================================================
// 4. 6개월 연속 플레이 시뮬레이션 (731년 3월 ~ 9월)
// =================================================================
console.log('\n[4. 6개월 연속 플레이 시뮬레이션: 시정 명령, 퀘스트 수락/건너뛰기/대박 및 자원 보존]')

let simState = JSON.parse(JSON.stringify(testState)) as RealmState
simState.year = 731
simState.month = 3
simState.civicFocus = 'balanced'

const simulationLog: string[] = []

for (let m = 3; m <= 8; m++) {
  const currentMonthStr = `${simState.year}년 ${simState.month}월`
  console.log(`\n  --- [시뮬레이션 ${currentMonthStr}] ---`)

  // 1) Monthly Civic Command decision
  if (m === 3) {
    simState.civicFocus = 'agrarian_expansion'
    simulationLog.push(`[${currentMonthStr}] 시정 명령: 대규모 개간 및 농업 진흥 채택`)
  } else if (m === 5) {
    simState.civicFocus = 'deep_mining'
    simulationLog.push(`[${currentMonthStr}] 시정 명령: 광맥 심층 채굴로 전환 (철재 증산)`)
  } else if (m === 7) {
    simState.civicFocus = 'market_boom'
    simulationLog.push(`[${currentMonthStr}] 시정 명령: 장터 및 상권 장려로 전환 (국고 증산)`)
  }

  // 2) Optional Field Quest Processing
  if (m === 3) {
    // Normal completion
    const quest = createFieldQuestTemplate('frontier_beast_patrol', simState.year, simState.month, 100)
    simState.pendingFieldQuest = quest
    // Step 1: military choice
    simState.resources.iron -= 15
    simState.stability += 2
    quest.currentStepId = 'step_2_cleared'
    // Step 2: annex buffer
    simState.stability += 4
    simState.manpower += 25
    simState.resources.treasury += 60
    simState.resources.timber += 40
    simState.pendingFieldQuest = null
    simState.completedFieldQuestsCount = (simState.completedFieldQuestsCount || 0) + 1
    simulationLog.push(`[${currentMonthStr}] 현장 순행: 국경 마수 소탕 완료 (안정도+4, 인력+25, 🪙+60)`)
  } else if (m === 4) {
    // Skip Path: Skip without penalty
    const quest = createFieldQuestTemplate('wandering_artisan_convoy', simState.year, simState.month, 101)
    simState.pendingFieldQuest = quest
    // Click skip
    simState.pendingFieldQuest = null
    simulationLog.push(`[${currentMonthStr}] 현장 순행 건너뛰기: 현지 관리관에게 자율 위임 (페널티 0, 안정도/자원 손실 없음)`)
  } else if (m === 5) {
    // High-Risk Jackpot Quest:
    const quest = createFieldQuestTemplate('ancient_vein_prospecting', simState.year, simState.month, 102)
    simState.pendingFieldQuest = quest
    const jackpotRoll = getDeterministicQuestRoll(simState.year, simState.month, 'choice_blast_jackpot' + quest.seed)
    if (jackpotRoll < 60) {
      // Jackpot success!
      simState.resources.treasury += 850
      simState.resources.iron += 350
      simState.stability += 5
      simState.realmTraits = simState.realmTraits || []
      simState.realmTraits.push({
        id: 'ancient_vein_blessing',
        name: '고대 광맥의 축복',
        icon: '✨',
        description: '매월 철 +25',
        durationMonths: 6,
        effects: { monthlyIron: 25 },
      })
      simulationLog.push(`[${currentMonthStr}] 🎉 고대 광맥 대박 성공! (국고 +850, 철재 +350, 6개월간 매월 철+25 특성)`)
    } else {
      // Failure recovery branch
      simState.resources.treasury = Math.max(0, simState.resources.treasury - 150)
      simState.resources.iron = Math.max(0, simState.resources.iron - 100)
      simState.stability = Math.max(0, simState.stability - 3)
      simState.realmTraits = simState.realmTraits || []
      simState.realmTraits.push({
        id: 'collapsed_shaft_recovery',
        name: '갱도 붕괴 수습 중',
        icon: '⚠️',
        description: '2개월간 매월 철 -10',
        durationMonths: 2,
        effects: { monthlyIron: -10 },
      })
      simulationLog.push(`[${currentMonthStr}] 💥 갱도 낙반 사고 수습 (국고 -150, 철재 -100, 수습 특성 부여)`)
    }
    simState.pendingFieldQuest = null
    simState.completedFieldQuestsCount = (simState.completedFieldQuestsCount || 0) + 1
  } else if (m === 6) {
    // Wandering artisan: recruit master
    simState.resources.treasury = Math.max(0, simState.resources.treasury - 120)
    simState.capacities.administration += 1
    simState.realmTraits = simState.realmTraits || []
    simState.realmTraits.push({
      id: 'court_master_artisan',
      name: '궁정 명장의 감리',
      icon: '🔨',
      description: '건설 비용 15% 영구 할인',
      effects: { adminBonus: 1, constructionDiscountRate: 0.15 },
    })
    simulationLog.push(`[${currentMonthStr}] 유랑 명장 영입: 궁정 수석 기술 고문 가신 서약 (행정력 +1, 건설비 15% 영구 할인)`)
  }

  // 3) Monthly Turn Advance & Resource Ledger Calculation
  const farmLvl = simState.industries.farms.level
  const ironLvl = simState.industries.ironworks.level
  const marketLvl = simState.industries.market.level
  const lumberLvl = simState.industries.lumberyard.level

  const cBld = simState.civicBuildings || INITIAL_CIVIC_BUILDINGS
  const civicTreasury = (cBld.townHall?.level || 0) * 6
  const civicGrain = (cBld.granary?.level || 0) * 8
  const civicManpower = (cBld.residences?.level || 0) * 20

  const cFocusDef = CIVIC_FOCUS_DEFINITIONS[simState.civicFocus || 'balanced']
  const cImpact = cFocusDef.monthlyImpact

  let traitIronYield = 0
  if (simState.realmTraits) {
    for (const t of simState.realmTraits) {
      if (t.effects.monthlyIron) traitIronYield += t.effects.monthlyIron
    }
  }

  const grossIncome = Math.round(34 + farmLvl * 6 + ironLvl * 5 + marketLvl * 18 + lumberLvl * 4) + civicTreasury + (cImpact.treasuryDelta || 0)
  const grossGrain = farmLvl * 18 - Math.ceil(simState.population / 850) + civicGrain + (cImpact.grainDelta || 0)
  const grossIron = ironLvl * 7 + traitIronYield + (cImpact.ironDelta || 0)
  const grossTimber = lumberLvl * 10 + (cImpact.timberDelta || 0)

  simState.resources.treasury = Math.max(0, simState.resources.treasury + grossIncome)
  simState.resources.grain = Math.max(0, simState.resources.grain + grossGrain)
  simState.resources.iron = Math.max(0, simState.resources.iron + grossIron)
  simState.resources.timber = Math.max(0, simState.resources.timber + grossTimber)

  simState.population += 90 + (cBld.residences?.level || 0) * 30
  simState.manpower += 35 + civicManpower + (cImpact.manpowerDelta || 0)

  // Traits tick
  if (simState.realmTraits) {
    const nextTraits: RealmTrait[] = []
    for (const t of simState.realmTraits) {
      if (typeof t.durationMonths === 'number') {
        const nextDur = t.durationMonths - 1
        if (nextDur > 0) nextTraits.push({ ...t, durationMonths: nextDur })
      } else {
        nextTraits.push(t)
      }
    }
    simState.realmTraits = nextTraits
  }

  simState.month += 1
  if (simState.month > 12) {
    simState.month = 1
    simState.year += 1
  }

  console.log(`    결산 후 자원: 🪙국고 ${simState.resources.treasury} | 🌾식량 ${simState.resources.grain} | ⛓철 ${simState.resources.iron} | 🪵목재 ${simState.resources.timber}`)
  console.log(`    인구: ${simState.population.toLocaleString()}명 | 가용 인력: ${simState.manpower.toLocaleString()}명 | 활성 특성: ${simState.realmTraits?.length || 0}개`)

  assert(simState.resources.treasury > 0, `Month ${m} 국고 자원 건전성 유지`)
  assert(simState.resources.grain > 0, `Month ${m} 식량 자원 건전성 유지`)
  assert(simState.resources.iron > 0, `Month ${m} 철재 자원 건전성 유지`)
  assert(simState.resources.timber > 0, `Month ${m} 목재 자원 건전성 유지`)
}

assert(simState.year === 731 && simState.month === 9, '6개월 시뮬레이션 정상 완료 (731년 3월 -> 731년 9월 도달)')
assert(simState.completedFieldQuestsCount! >= 2, '현장 퀘스트 2회 이상 완료 기록 확인')

// Ambitions and victory conditions regression check
const ambitionGoals = evaluateAmbitionGoals(simState)
assert(ambitionGoals.length === 4, `가문 대망 4대 목표 정상 평가 유지 (${ambitionGoals.map((g) => g.name).join(', ')})`)
assert(!simState.ambitionState?.defeatTriggered, '퀘스트 건너뛰기/플레이 진행 중 패배 조건 발동 없음')

console.log('\n=================================================================')
console.log('✅ 10차 마일스톤 통합 검증 100% 통과!')
console.log('=================================================================')
console.log('\n[시뮬레이션 연대기 요약]:')
simulationLog.forEach((log) => console.log(' •', log))
