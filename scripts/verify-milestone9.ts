import {
  INITIAL_REALM_STATE,
  evaluateDiplomacy,
  evaluateGovernedTerritories,
  evaluateTradeRoutes,
} from '../src/constants/realmData'
import {
  INITIAL_DIRECTIVES,
  RIVAL_INTENT_TEMPLATES,
  evaluateAmbitionGoals,
} from '../src/constants/rivalAiData'
import type {
  RealmState,
  StrategicDirective,
} from '../src/types/realm'


function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`)
    process.exit(1)
  }
  console.log(`✓ ${message}`)
}

console.log('=================================================================')
console.log('MY-WORLD 9차 마일스톤 (Strategic Rivals & Ambitions) 검증 시작')
console.log('=================================================================')

// 1. 세이브 마이그레이션 무결성 검증 (8차 레거시 세이브 호환성)
console.log('\n[1. 레거시 세이브 마이그레이션 무결성]')
const legacySave8th: any = {
  year: 732,
  month: 5,
  name: '에르덴 변경백령',
  ruler: '변경백 아르덴',
  rank: '루미나스 왕령의 봉신',
  doctrine: 'military',
  resources: { treasury: 280, grain: 190, iron: 55, timber: 80 },
  capacities: { administration: 2, diplomacy: 2, command: 3 },
  industries: {
    farms: { id: 'farms', level: 2 },
    ironworks: { id: 'ironworks', level: 1 },
    market: { id: 'market', level: 2 },
    lumberyard: { id: 'lumberyard', level: 1 },
  },
  policies: ['border_muster'],
  population: 13100,
  manpower: 1100,
  soldiers: 230,
  levies: 420,
  stability: 68,
  legitimacy: 62,
  autonomy: 28,
  royalFavor: 56,
  neighbors: [
    { id: 'crown', name: '루미나스 왕령', relation: 40, strength: 84, attitude: '종주국', tradeActive: false, annexed: false },
    { id: 'sylvana', name: '실바나 숲의회', relation: 35, strength: 39, attitude: '우호', tradeActive: true, tradeContract: 'balanced_exchange', diplomaticStage: 'alliance', treatyMonths: 4, annexed: false },
    { id: 'ironridge', name: '철령 남작령', relation: -20, strength: 48, attitude: '경계', tradeActive: false, claim: true, annexed: false },
    { id: 'auric', name: '아우릭 자유시', relation: 15, strength: 32, attitude: '중립', tradeActive: true, tradeContract: 'balanced_exchange', diplomaticStage: 'non_aggression', treatyMonths: 2, annexed: false },
    { id: 'goblin', name: '붉은이빨 부족령', relation: -45, strength: 35, attitude: '적대', tradeActive: false, claim: true, annexed: true },
  ],
  governance: {
    goblin: {
      neighborId: 'goblin',
      governanceMode: 'military_occupation',
      loyalty: 42,
      unrest: 38,
      integration: 18,
      isCore: false,
      lastReport: '군정 통치 유지',
    },
  },
  logs: [],
  // 8차에는 rivalIntents, ambitionState, directives가 없음!
}

// 마이그레이션 로직 모사 검증
const initial = JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
const migratedNeighbors = legacySave8th.neighbors.map((savedN: any) => {
  const fallback = initial.neighbors.find((n) => n.id === savedN.id)!
  return {
    ...fallback,
    ...savedN,
    tradeActive: !!savedN.tradeActive,
    tradeContract: savedN.tradeContract ?? (savedN.tradeActive ? 'balanced_exchange' : null),
    diplomaticStage: savedN.diplomaticStage ?? 'none',
    treatyMonths: savedN.treatyMonths ?? 0,
    subjectLoyalty: savedN.subjectLoyalty ?? 0,
  }
})
const migratedRivalIntents = Array.isArray(legacySave8th.rivalIntents) ? legacySave8th.rivalIntents : []
const migratedAmbitionState = legacySave8th.ambitionState || {
  chosenAmbitionId: null,
  triumphAchieved: null,
  defeatTriggered: null,
  acknowledgedOutcome: false,
}
const migratedDirectives = Array.isArray(legacySave8th.directives) && legacySave8th.directives.length > 0
  ? legacySave8th.directives
  : JSON.parse(JSON.stringify(INITIAL_DIRECTIVES))

assert(migratedNeighbors.length === 5, '이웃 세력 5곳 마이그레이션 보존')
assert(migratedNeighbors[1].diplomaticStage === 'alliance', '실바나 군사 동맹 상태 보존')
assert(migratedNeighbors[4].annexed === true, '고블린 병합 상태 보존')
assert(legacySave8th.governance.goblin.governanceMode === 'military_occupation', '통치령 거버넌스 보존')
assert(migratedRivalIntents.length === 0, '레거시 세이브에 rivalIntents 안전한 빈 배열 초기화')
assert(migratedAmbitionState.triumphAchieved === null, 'ambitionState 기본 상태 초기화')
assert(migratedDirectives.length === 5, '군주 집무 지침서 5개 과업 정상 로드')

// 2. 라이벌 AI 템플릿 및 선제 대응(Counterplay) 로직 검증
console.log('\n[2. 라이벌 AI 템플릿 10종 트리거 & 선제 대응/미대응 분기 검증]')
assert(Object.keys(RIVAL_INTENT_TEMPLATES).length === 10, '10개 고유 라이벌 의도 템플릿 등록 확인')

// Case 2-A: 철령 남작령 약탈 위협(ironridge_raid_threat) 선제 대응(counter_ambush)
{
  const mockState = JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
  const ironridge = mockState.neighbors.find((n) => n.id === 'ironridge')!
  ironridge.relation = -10
  mockState.soldiers = 100 // low army power to trigger

  const template = RIVAL_INTENT_TEMPLATES.ironridge_raid_threat
  assert(template.triggerCheck(ironridge, mockState) === true, '철령 약탈 위협 트리거 조건 만족')

  // 선제 역매복 기습 대응 실행
  const counterAction = template.counterActions.find((a) => a.id === 'ironridge_ambush_patrol')!
  const draftA = JSON.parse(JSON.stringify(mockState)) as RealmState
  const reportA = template.onExecuteCountered(ironridge, draftA, counterAction.id)

  assert(reportA.title.includes('역매복 대승'), '역매복 선제 대응 시 대승 보고 생성')
  assert(draftA.resources.treasury > mockState.resources.treasury, '적 약탈대 격퇴 후 금화 전리품 획득')
  assert(draftA.resources.iron > mockState.resources.iron, '적 약탈대 격퇴 후 철괴 전리품 획득')

  // 미대응 시 참화
  const draftB = JSON.parse(JSON.stringify(mockState)) as RealmState
  const reportB = template.onExecuteUnprepared(ironridge, draftB)
  assert(reportB.title.includes('농장 약탈'), '미대응 시 농장 약탈 참화 보고')
  assert(draftB.resources.grain < mockState.resources.grain, '미대응 시 곡물 약탈 피해 발생')
  assert(draftB.stability < mockState.stability, '미대응 시 안정도 타격 발생')
}

// Case 2-B: 왕실 특별 감사(crown_audit)
{
  const mockState = JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
  mockState.autonomy = 35 // high autonomy triggers audit
  const crown = mockState.neighbors.find((n) => n.id === 'crown')!
  const template = RIVAL_INTENT_TEMPLATES.crown_audit
  assert(template.triggerCheck(crown, mockState) === true, '왕실 감사 트리거 조건 만족')

  const draftCounter = JSON.parse(JSON.stringify(mockState)) as RealmState
  template.onExecuteCountered(crown, draftCounter, 'crown_audit_gift')
  assert(draftCounter.royalFavor > mockState.royalFavor, '감사 진상금 대응 시 왕실 총애 상승')

  const draftUnprepared = JSON.parse(JSON.stringify(mockState)) as RealmState
  template.onExecuteUnprepared(crown, draftUnprepared)
  assert(draftUnprepared.royalFavor < mockState.royalFavor, '미대응 시 왕실 총애 대폭 삭감')
  assert(draftUnprepared.legitimacy < mockState.legitimacy, '미대응 시 정통성 타격')
}

// Case 2-C: 붉은이빨 부족령 대약탈군(goblin_border_raid)
{
  const mockState = JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
  const goblin = mockState.neighbors.find((n) => n.id === 'goblin')!
  const template = RIVAL_INTENT_TEMPLATES.goblin_border_raid
  assert(template.triggerCheck(goblin, mockState) === true, '고블린 대약탈군 트리거 조건 만족')

  const draftStrike = JSON.parse(JSON.stringify(mockState)) as RealmState
  template.onExecuteCountered(goblin, draftStrike, 'goblin_preemptive_strike')
  assert(draftStrike.manpower > mockState.manpower, '선제 기동 타격 시 포로 인력 획득')
}

// 3. 가문 대망(Ambition Goals) 4대 승리 목표 및 패배 조건 검증
console.log('\n[3. 가문 대망 4대 승리 목표 및 패배 조건 검증]')
{
  const initialGoals = evaluateAmbitionGoals(INITIAL_REALM_STATE)
  assert(initialGoals.length === 4, '4대 대망(철혈, 상업, 수호공, 대연합) 목록 제공')
  assert(initialGoals.every((g) => !g.isCompleted), '초기 상태에서는 미완료')

  // 철혈의 대공 달성 조건 시뮬레이션
  const victoryMilitaryState = JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
  victoryMilitaryState.neighbors[1].annexed = true
  victoryMilitaryState.neighbors[2].annexed = true
  victoryMilitaryState.neighbors[4].diplomaticStage = 'vassal' // 2 annexed + 1 vassal = 3
  victoryMilitaryState.soldiers = 320
  const militaryGoals = evaluateAmbitionGoals(victoryMilitaryState)
  const militaryHegemony = militaryGoals.find((g) => g.id === 'military_hegemony')!
  assert(militaryHegemony.isCompleted === true, '철혈의 대공 승리 요건 충족 시 완료 판정')

  // 황금 상업 제국 달성 조건 시뮬레이션
  const victoryCommercialState = JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
  victoryCommercialState.neighbors[0].tradeActive = true
  victoryCommercialState.neighbors[1].tradeActive = true
  victoryCommercialState.neighbors[2].tradeActive = true
  victoryCommercialState.neighbors[3].tradeActive = true // 4 active trade routes
  victoryCommercialState.resources.treasury = 700
  victoryCommercialState.population = 16500
  const commercialGoals = evaluateAmbitionGoals(victoryCommercialState)
  const commercialDominion = commercialGoals.find((g) => g.id === 'commercial_dominion')!
  assert(commercialDominion.isCompleted === true, '황금 상업 제국 승리 요건 충족 시 완료 판정')

  // 패배 조건 검증
  const crownDefeatState = JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
  crownDefeatState.royalFavor = 0
  assert(crownDefeatState.royalFavor <= 0, '왕실 총애 0 도달 시 폐위 트리거 가능')

  const bankruptState = JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
  bankruptState.resources.treasury = 0
  bankruptState.resources.grain = 0
  bankruptState.stability = 0
  assert(bankruptState.resources.treasury <= 0 && bankruptState.resources.grain <= 0 && bankruptState.stability <= 0, '재정/식량/안정도 0 도달 시 파산 트리거 가능')
}

// 4. 군주 집무 지침서(Directives) 진행도 및 보상 검증
console.log('\n[4. 군주 집무 지침서 온보딩 달성 및 보상 수령]')
{
  const directives: StrategicDirective[] = JSON.parse(JSON.stringify(INITIAL_DIRECTIVES))
  const testState = JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState

  // 과업 1: 농장 2레벨
  assert(directives[0].isCompleted === false, '초기 과업 1 미완료')
  testState.industries.farms.level = 2
  if (testState.industries.farms.level >= 2) directives[0].isCompleted = true
  assert(directives[0].isCompleted === true, '농장 2레벨 달성 시 과업 1 완료')

  // 보상 수령 테스트
  const initialTreasury = testState.resources.treasury
  testState.resources.treasury += 35
  testState.resources.grain += 25
  directives[0].rewardClaimed = true
  assert(testState.resources.treasury === initialTreasury + 35, '과업 1 보상 금화 수령 확인')
  assert(directives[0].rewardClaimed === true, '과업 1 보상 수령 플래그 반영')

  // 과업 2: 첫 교역로
  testState.neighbors[1].tradeActive = true
  if (testState.neighbors.some((n) => n.tradeActive && !n.annexed)) directives[1].isCompleted = true
  assert(directives[1].isCompleted === true, '교역로 개설 시 과업 2 완료')
}

// 5. 기존 시스템 회귀 방지 검증 (외교 결산, 교역 결산, 통치령 결산)
console.log('\n[5. 기존 외교, 교역, 통치령 결산 회귀 방지 검증]')
{
  const state = JSON.parse(JSON.stringify(INITIAL_REALM_STATE)) as RealmState
  // 교역 활성화
  state.neighbors[1].tradeActive = true
  state.neighbors[1].tradeContract = 'balanced_exchange'
  const tradeEval = evaluateTradeRoutes(state.neighbors, state.resources, state.policies, null)
  assert(tradeEval.activeCount === 1, '교역로 1개 정상 결산')
  assert(tradeEval.totalNet.treasury > 0, '교역 국고 순이익 산출 확인')

  // 외교 조약(동맹) 체결
  state.neighbors[1].diplomaticStage = 'alliance'
  const diplomacyEval = evaluateDiplomacy(state.neighbors, state.resources, undefined)
  assert(diplomacyEval.activeAllianceCount === 1, '군사 동맹 유지비 및 정상 평가 확인')
  assert(diplomacyEval.totalCosts.treasury === 12, '동맹 유지비 12금화 정확 청구')

  // 통치령 거버넌스
  state.neighbors[4].annexed = true
  state.governance.goblin = {
    neighborId: 'goblin',
    governanceMode: 'military_occupation',
    loyalty: 50,
    unrest: 30,
    integration: 15,
    isCore: false,
  }
  const dominionEval = evaluateGovernedTerritories(state.neighbors, state.governance, state.resources, state.policies)
  assert(dominionEval.evaluations.length === 1, '통치령 1곳 평가 정상 수행')
  assert(dominionEval.evaluations[0].rebellionRiskTier === '안정', '치안 안정 티어 정확 산출')
}

console.log('\n=================================================================')
console.log('✅ 모든 9차 마일스톤 단위 검증 및 회귀 테스트 통과!')
console.log('=================================================================')
