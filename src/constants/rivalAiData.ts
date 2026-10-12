import type {
  AmbitionGoal,
  NeighborRealm,
  RealmState,
  RivalCounterAction,
  RivalIntentType,
  StrategicDirective,
} from '../types/realm'
import { calculateArmyPower } from './realmData'

export interface RivalIntentTemplate {
  type: RivalIntentType
  neighborId: string
  title: string
  summary: string
  threatLevel: '기회' | '주의' | '경고' | '위기'
  defaultMonthsRemaining: number
  triggerCheck: (neighbor: NeighborRealm, state: RealmState) => boolean
  counterActions: RivalCounterAction[]
  onExecuteUnprepared: (neighbor: NeighborRealm, draft: RealmState) => { title: string; detail: string }
  onExecuteCountered: (neighbor: NeighborRealm, draft: RealmState, actionId: string) => { title: string; detail: string }
}

export const RIVAL_INTENT_TEMPLATES: Record<RivalIntentType, RivalIntentTemplate> = {
  crown_audit: {
    type: 'crown_audit',
    neighborId: 'crown',
    title: '왕실 사정국의 변경 특별 감사',
    summary: '여왕의 감사관들이 변경백의 군비 확장과 자치령 장부를 감사하려 국경 관문에 도달하고 있습니다.',
    threatLevel: '경고',
    defaultMonthsRemaining: 2,
    triggerCheck: (n, s) => !n.annexed && (s.autonomy >= 30 || s.soldiers >= 240 || s.royalFavor < 45),
    counterActions: [
      {
        id: 'crown_audit_gift',
        name: '왕실 진상금 및 환대 의전 준비',
        character: '왕실 총애 획득 · 정통성 보전 · 평화적 감사 통과',
        description: '사정국 감사관들을 위한 정중한 영접 연회와 왕실 진상금을 준비해 변경의 충정을 입증합니다.',
        costs: { capacities: { diplomacy: 1 }, resources: { treasury: 35 } },
        outcomeHint: '총애 +6 · 정통성 +3 · 감사관들이 영지의 번영을 여왕에게 보고',
      },
      {
        id: 'crown_audit_hide',
        name: '이중 장부 및 군사 기밀 은폐',
        character: '자치도 보존 · 국고 절약 · 왕실 의혹 잔존',
        description: '행정 관료를 동원해 군사 명부와 비밀 비축고를 위장하고 영지의 독자적 자치권을 사수합니다.',
        costs: { capacities: { administration: 1 }, resources: { treasury: 10 } },
        outcomeHint: '자치도 +4 · 총애 -3 · 감사를 요식행위로 종결',
      },
    ],
    onExecuteUnprepared: (n, s) => {
      s.royalFavor = Math.max(0, s.royalFavor - 12)
      s.legitimacy = Math.max(0, s.legitimacy - 8)
      s.stability = Math.max(0, s.stability - 5)
      n.relation = Math.max(-100, n.relation - 10)
      return {
        title: '[왕실 문책] 감사관 불시 검열 참화',
        detail: '아무런 대비 없이 들이닥친 왕실 사정국에 군비 은닉과 장부 부실이 적발되어 엄중한 문책을 받았습니다. (왕실 총애 -12, 정통성 -8, 안정도 -5, 관계도 -10)',
      }
    },
    onExecuteCountered: (n, s, actionId) => {
      if (actionId === 'crown_audit_gift') {
        s.royalFavor = Math.min(100, s.royalFavor + 6)
        s.legitimacy = Math.min(100, s.legitimacy + 3)
        n.relation = Math.min(100, n.relation + 8)
        return {
          title: '[감사 통과] 왕실 사정국의 찬사',
          detail: '정성 어린 진상과 투명한 의전 덕분에 사정국 감사관들이 변경백의 충직함을 여왕에게 높이 보고했습니다. (왕실 총애 +6, 정통성 +3, 관계도 +8)',
        }
      } else {
        s.autonomy = Math.min(100, s.autonomy + 4)
        s.royalFavor = Math.max(0, s.royalFavor - 3)
        return {
          title: '[기밀 사수] 감사관 시찰 요식행위 종결',
          detail: '면밀히 준비된 은폐 조치로 군사 기밀과 자치령 장부를 안전하게 사수했습니다. (자치도 +4, 왕실 총애 -3)',
        }
      }
    },
  },

  crown_tithe: {
    type: 'crown_tithe',
    neighborId: 'crown',
    title: '서부 전선 왕실 전비 징발 요구',
    summary: '왕국 서부 전선의 전비 확충을 위해 변경백령에 비상 전시 군비 분담금을 요구해 왔습니다.',
    threatLevel: '주의',
    defaultMonthsRemaining: 2,
    triggerCheck: (n, s) => !n.annexed && s.resources.treasury >= 120 && s.year >= 731,
    counterActions: [
      {
        id: 'crown_tithe_pay',
        name: '전비 분담금 전액 헌납 및 무구 수령',
        character: '왕실 총애 대폭 증가 · 왕실 철기 무구 하사',
        description: '국고의 금화를 아낌없이 헌납하여 종주국의 기대를 충족하고 왕실의 군수 보조를 약속받습니다.',
        costs: { resources: { treasury: 45 } },
        outcomeHint: '왕실 총애 +8 · 정통성 +4 · 왕실 제련 철 +15 하사',
      },
      {
        id: 'crown_tithe_petition',
        name: '변경 곤궁 탄원서 및 소액 성의 전달',
        character: '재정 절약 · 외교적 체면 유지',
        description: '외교 사절을 보내 변경의 방벽 보수 필요성을 역설하고 소액의 성의금만 전달합니다.',
        costs: { capacities: { diplomacy: 1 }, resources: { treasury: 15 } },
        outcomeHint: '왕실 총애 유지 · 정통성 +1 · 국고 지출 최소화',
      },
    ],
    onExecuteUnprepared: (_n, s) => {
      const seized = Math.min(s.resources.treasury, 40)
      s.resources.treasury -= seized
      s.royalFavor = Math.max(0, s.royalFavor - 6)
      return {
        title: '[강제 징수] 왕실 사절의 강제 집행',
        detail: `사전 조치 없이 시간을 끈 결과 왕실 사절이 국고에서 금화 ${seized}을(를) 강제 징수하고 총애가 삭감되었습니다. (총애 -6)`,
      }
    },
    onExecuteCountered: (_n, s, actionId) => {
      if (actionId === 'crown_tithe_pay') {
        s.royalFavor = Math.min(100, s.royalFavor + 8)
        s.legitimacy = Math.min(100, s.legitimacy + 4)
        s.resources.iron += 15
        return {
          title: '[왕실 포상] 전비 헌납과 철기 하사',
          detail: '신속한 전비 헌납에 감동한 여왕이 감사의 서신과 함께 왕실 제련 철 15 상자를 하사했습니다. (총애 +8, 정통성 +4, 철 +15)',
        }
      } else {
        s.legitimacy = Math.min(100, s.legitimacy + 1)
        return {
          title: '[탄원 수용] 변경 전비 징발 유예',
          detail: '외교 사절의 뛰어난 설득으로 종주국이 변경의 특수성을 인정하고 징발을 공식 유예했습니다. (정통성 +1)',
        }
      }
    },
  },

  sylvana_nature_pact: {
    type: 'sylvana_nature_pact',
    neighborId: 'sylvana',
    title: '실바나 숲의회의 벌채 항의',
    summary: '에르덴의 벌목 확장에 분노한 숲의회 정령사들이 국경 삼림 훼손에 대해 엄중히 항의하고 있습니다.',
    threatLevel: '주의',
    defaultMonthsRemaining: 2,
    triggerCheck: (n, s) => !n.annexed && s.industries.lumberyard.level >= 2 && n.relation < 50,
    counterActions: [
      {
        id: 'sylvana_replant',
        name: '친환경 조림령 및 정령목 보호구역 지정',
        character: '숲과의 공존 · 관계 대폭 개선 · 약초 유입',
        description: '벌목 구역 주변에 어린 묘목을 심고 정령목 자생지를 보호구역으로 선포합니다.',
        costs: { capacities: { administration: 1 }, resources: { treasury: 20, timber: 15 } },
        outcomeHint: '실바나 관계 +20 · 식량 +25 · 안정도 +3',
      },
      {
        id: 'sylvana_druid_pact',
        name: '드루이드 의회와의 상호 통상 협약',
        character: '외교적 해법 · 고대 약초 안정 공급',
        description: '사절을 보내 목재 대신 변경의 식량과 철물을 제공하는 상호 절충안을 제의합니다.',
        costs: { capacities: { diplomacy: 1 }, resources: { treasury: 25 } },
        outcomeHint: '실바나 관계 +15 · 식량 +15 · 외교적 신뢰 확보',
      },
    ],
    onExecuteUnprepared: (n, s) => {
      n.relation = Math.max(-100, n.relation - 22)
      s.resources.timber = Math.max(0, s.resources.timber - 20)
      s.stability = Math.max(0, s.stability - 4)
      return {
        title: '[삼림 분쟁] 실바나의 국경 봉쇄',
        detail: '항의를 방치한 결과 성난 드루이드들이 덩굴 장벽으로 벌목로를 가로막고 관계가 얼어붙었습니다. (실바나 관계 -22, 목재 -20, 안정도 -4)',
      }
    },
    onExecuteCountered: (n, s, actionId) => {
      if (actionId === 'sylvana_replant') {
        n.relation = Math.min(100, n.relation + 20)
        s.resources.grain += 25
        s.stability = Math.min(100, s.stability + 3)
        return {
          title: '[수림 화해] 정령사들의 축복',
          detail: '에르덴의 조림 노력에 감복한 정령사들이 국경 삼림에 숲의 축복을 내려 약초와 열매를 선사했습니다. (관계 +20, 식량 +25, 안정도 +3)',
        }
      } else {
        n.relation = Math.min(100, n.relation + 15)
        s.resources.grain += 15
        return {
          title: '[외교 타결] 드루이드 상호 교류 협정',
          detail: '대화와 사절 파견을 통해 불필요한 마찰을 피하고 호혜적인 상호 교류의 기틀을 마련했습니다. (관계 +15, 식량 +15)',
        }
      }
    },
  },

  sylvana_herbal_exchange: {
    type: 'sylvana_herbal_exchange',
    neighborId: 'sylvana',
    title: '실바나의 고대 영초 친선 교환 제안',
    summary: '숲의회가 에르덴의 변경 시장에 고대 정령목 영초와 씨앗을 공급하는 특별 교류를 제안했습니다.',
    threatLevel: '기회',
    defaultMonthsRemaining: 2,
    triggerCheck: (n) => !n.annexed && n.relation >= 15,
    counterActions: [
      {
        id: 'sylvana_accept_exchange',
        name: '정령초 교역단 영접 및 특산품 맞교환',
        character: '대량 식량 획득 · 안정도 상승 · 우호 증진',
        description: '환대 행사와 함께 에르덴의 특산 금속을 제공하고 진귀한 정령초를 대량 수령합니다.',
        costs: { capacities: { diplomacy: 1 }, resources: { treasury: 20, iron: 8 } },
        outcomeHint: '식량 +40 · 안정도 +4 · 관계도 +15',
      },
    ],
    onExecuteUnprepared: () => ({
      title: '[기회 만료] 실바나 사절단 귀환',
      detail: '대응 시한 동안 교환이 성사되지 않아 실바나 사절단이 고대 숲으로 조용히 돌아갔습니다.',
    }),
    onExecuteCountered: (n, s) => {
      n.relation = Math.min(100, n.relation + 15)
      s.resources.grain += 40
      s.stability = Math.min(100, s.stability + 4)
      return {
        title: '[영초 교환 성사] 영지 전역의 풍요',
        detail: '실바나의 희귀 영초가 영지 전역의 의원과 백성들에게 보급되어 민심이 크게 안정되었습니다. (식량 +40, 안정도 +4, 관계 +15)',
      }
    },
  },

  ironridge_border_fortify: {
    type: 'ironridge_border_fortify',
    neighborId: 'ironridge',
    title: '철령 남작령의 국경 무력 시위',
    summary: '남작 볼프람이 북부 산악 요새에 중장갑 보병대를 집결시키며 에르덴 국경을 압박하고 있습니다.',
    threatLevel: '경고',
    defaultMonthsRemaining: 2,
    triggerCheck: (n) => !n.annexed && n.diplomaticStage !== 'alliance' && n.diplomaticStage !== 'vassal' && n.relation < 25,
    counterActions: [
      {
        id: 'ironridge_fort_muster',
        name: '국경 맞불 훈련 및 방벽 보강',
        character: '무력 억제 · 군사 사기 고양 · 도발 무산',
        description: '에르덴 상비군과 징집병을 국경 방벽에 전진 배치해 철령 군세의 경거망동을 원천 봉쇄합니다.',
        costs: { capacities: { command: 1 }, resources: { grain: 20, iron: 10 } },
        outcomeHint: '철령 도발 완전 차단 · 안정도 +2 · 군사적 위신 상승',
      },
      {
        id: 'ironridge_diplomatic_parley',
        name: '국경 완충지대 비무장 회담 제안',
        character: '평화적 긴장 완화 · 외교적 신뢰 확보',
        description: '사절을 급파하여 국경 비무장 완충 조약을 제의하고 남작에게 양질의 포도주를 선물합니다.',
        costs: { capacities: { diplomacy: 1 }, resources: { treasury: 25 } },
        outcomeHint: '철령 관계 +18 · 무력 도발 철회',
      },
    ],
    onExecuteUnprepared: (n, s) => {
      n.strength = Math.min(100, n.strength + 5)
      s.stability = Math.max(0, s.stability - 4)
      n.relation = Math.max(-100, n.relation - 8)
      return {
        title: '[위세 실추] 철령의 국경 전진 배치 완료',
        detail: '아무런 대응이 없자 철령 군세가 국경 고지를 선점하고 군세를 불렸습니다. (철령 군세 +5, 안정도 -4, 관계 -8)',
      }
    },
    onExecuteCountered: (n, s, actionId) => {
      if (actionId === 'ironridge_fort_muster') {
        s.stability = Math.min(100, s.stability + 3)
        s.legitimacy = Math.min(100, s.legitimacy + 2)
        return {
          title: '[도발 분쇄] 완벽한 국경 방위 태세',
          detail: '에르덴 철벽 수비대의 위세에 눌린 볼프람 남작이 국경 전진을 포기하고 부대를 철수시켰습니다. (안정도 +3, 정통성 +2)',
        }
      } else {
        n.relation = Math.min(100, n.relation + 18)
        return {
          title: '[긴장 해소] 완충지 회담 타결',
          detail: '비무장 완충 조약 회담이 성사되어 북부 국경의 군사적 긴장이 평화롭게 가라앉았습니다. (관계 +18)',
        }
      }
    },
  },

  ironridge_raid_threat: {
    type: 'ironridge_raid_threat',
    neighborId: 'ironridge',
    title: '철령 기병대의 국경 수확지 습격 획책',
    summary: '철령의 기회주의적인 산악 기병대가 에르덴 동북부 농경지의 추수 곡물을 노리고 기습을 획책하고 있습니다!',
    threatLevel: '위기',
    defaultMonthsRemaining: 2,
    triggerCheck: (n, s) => {
      const armyP = calculateArmyPower(s.soldiers, s.levies, s.policies.includes('standing_guard'))
      return !n.annexed && n.relation < 0 && armyP < n.strength * 18
    },
    counterActions: [
      {
        id: 'ironridge_ambush_patrol',
        name: '정예 상비군 역매복 기습망 전개',
        character: '적 약탈대 전멸 · 노획 전리품 획득 · 적 군세 타격',
        description: '약탈 예상 경로인 골짜기 목에 상비군 복병을 매복시켜 습격대를 일망타진합니다.',
        costs: { capacities: { command: 1 }, resources: { treasury: 15, iron: 12 } },
        outcomeHint: '철령 군세 -4 · 노획 금화 +35 · 노획 철 +16 · 안정도 +4',
      },
      {
        id: 'ironridge_appease_iron',
        name: '철괴 통상권 제공을 통한 유화책',
        character: '약탈 취소 · 관계 개선 · 무력 충돌 회피',
        description: '남작이 탐내는 철령 제철소용 철괴를 공식 무역으로 제공하여 무력 약탈을 사전에 차단합니다.',
        costs: { capacities: { diplomacy: 1 }, resources: { iron: 20 } },
        outcomeHint: '약탈 취소 · 철령 관계 +14 · 평화 유지',
      },
    ],
    onExecuteUnprepared: (_n, s) => {
      s.resources.grain = Math.max(0, s.resources.grain - 45)
      s.resources.treasury = Math.max(0, s.resources.treasury - 25)
      s.stability = Math.max(0, s.stability - 7)
      return {
        title: '[농장 약탈] 북부 농경지 기습 참화',
        detail: '방비가 허술한 틈을 타 들이닥친 철령 기병대가 농가와 창고를 약탈하고 달아났습니다! (식량 -45, 금화 -25, 안정도 -7)',
      }
    },
    onExecuteCountered: (n, s, actionId) => {
      if (actionId === 'ironridge_ambush_patrol') {
        n.strength = Math.max(15, n.strength - 4)
        s.resources.treasury += 35
        s.resources.iron += 16
        s.stability = Math.min(100, s.stability + 4)
        return {
          title: '[역매복 대승] 철령 약탈대 궤멸',
          detail: '완벽한 매복 작전으로 철령 산악 기병대를 전멸시키고 무구와 군자금을 전리품으로 노획했습니다! (철령 군세 -4, 금화 +35, 철 +16, 안정도 +4)',
        }
      } else {
        n.relation = Math.min(100, n.relation + 14)
        return {
          title: '[약탈 철회] 철괴 통상 유화 성공',
          detail: '합리적인 철괴 공급 제안을 받은 볼프람 남작이 약탈 계획을 철회하고 정상 통상으로 복귀했습니다. (관계 +14)',
        }
      }
    },
  },

  auric_tariff_war: {
    type: 'auric_tariff_war',
    neighborId: 'auric',
    title: '아우릭 상무회의 보복 관세 통보',
    summary: '아우릭의 대상인들이 에르덴의 시장 지배력을 견제하기 위해 통상 관세를 일방적으로 인상하려 합니다.',
    threatLevel: '경고',
    defaultMonthsRemaining: 2,
    triggerCheck: (n, s) => !n.annexed && s.industries.market.level >= 2 && n.diplomaticStage !== 'alliance',
    counterActions: [
      {
        id: 'auric_free_zone',
        name: '자유 통상 특례 및 항만 사용권 제공',
        character: '교역 호황 · 국고 세입 증대 · 상인 신뢰',
        description: '아우릭 상단에 변경 시장 특별 점포권과 통행세를 감면해주어 거상들을 우리 편으로 만듭니다.',
        costs: { capacities: { diplomacy: 1 }, resources: { treasury: 30 } },
        outcomeHint: '아우릭 관계 +20 · 국고 즉시 +45 · 교역 번영',
      },
      {
        id: 'auric_counter_tariff',
        name: '자체 관문 검문소 설치 및 맞불 관세',
        character: '자치권 수호 · 즉시 통행세 징수 · 관계 악화',
        description: '에르덴 통과 상단에 강력한 자체 관세를 부과하여 영지의 재정 주권을 선포합니다.',
        costs: { capacities: { administration: 1 }, resources: { timber: 15 } },
        outcomeHint: '국고 +35 · 자치도 +3 · 아우릭 관계 -12',
      },
    ],
    onExecuteUnprepared: (n, s) => {
      s.resources.treasury = Math.max(0, s.resources.treasury - 40)
      n.relation = Math.max(-100, n.relation - 12)
      return {
        title: '[관세 폭탄] 통상로 마비와 세입 손실',
        detail: '아우릭의 기습 관세 인상으로 대상단들이 발길을 돌려 국고 수입에 큰 타격을 입었습니다. (금화 -40, 관계 -12)',
      }
    },
    onExecuteCountered: (n, s, actionId) => {
      if (actionId === 'auric_free_zone') {
        n.relation = Math.min(100, n.relation + 20)
        s.resources.treasury += 45
        return {
          title: '[통상 번영] 거상들의 투자 유치',
          detail: '특례 조치에 환호한 아우릭 대상인들이 에르덴 시장으로 몰려와 국고 수입이 폭증했습니다. (금화 +45, 관계 +20)',
        }
      } else {
        s.resources.treasury += 35
        s.autonomy = Math.min(100, s.autonomy + 3)
        n.relation = Math.max(-100, n.relation - 12)
        return {
          title: '[재정 주권 선포] 독자 통행세 징수',
          detail: '자체 관문 검문소를 통해 상단들로부터 짭짤한 통행세를 징수하고 자치도를 높였습니다. (금화 +35, 자치도 +3, 관계 -12)',
        }
      }
    },
  },

  auric_investment_offer: {
    type: 'auric_investment_offer',
    neighborId: 'auric',
    title: '아우릭 금융조합의 대규모 개발 차관 제안',
    summary: '아우릭의 대은행가가 에르덴의 산업 개발을 위한 파격적인 저리 차관과 투자를 제안했습니다.',
    threatLevel: '기회',
    defaultMonthsRemaining: 2,
    triggerCheck: (n) => !n.annexed && n.relation >= 10,
    counterActions: [
      {
        id: 'auric_take_loan',
        name: '개발 투자 차관 정식 수용',
        character: '즉시 거액 국고 확보 · 산업 기반 확장 가속',
        description: '차관을 정식 체결하여 영지 국고를 크게 불리고 새로운 개발 자금을 확보합니다.',
        costs: { capacities: { diplomacy: 1 } },
        outcomeHint: '국고 즉시 +110 · 안정도 +2 · 아우릭 관계 +10',
      },
    ],
    onExecuteUnprepared: () => ({
      title: '[투자 철회] 금융조합 사절 철수',
      detail: '대응 기한이 지나 아우릭 은행가들이 다른 영지로 투자 자금을 돌렸습니다.',
    }),
    onExecuteCountered: (n, s) => {
      s.resources.treasury += 110
      s.stability = Math.min(100, s.stability + 2)
      n.relation = Math.min(100, n.relation + 10)
      return {
        title: '[차관 유치 성공] 에르덴 개발 금고 충원',
        detail: '아우릭 금융조합의 막대한 금화가 영지 금고로 유입되어 새로운 도약의 발판을 마련했습니다. (금화 +110, 안정도 +2, 관계 +10)',
      }
    },
  },

  goblin_border_raid: {
    type: 'goblin_border_raid',
    neighborId: 'goblin',
    title: '붉은이빨 부족령의 대약탈군 집결',
    summary: '대족장 우르가쉬가 황야의 오크·고블린 전사들을 결집해 에르덴 변경 마을을 초토화하려 하고 있습니다!',
    threatLevel: '위기',
    defaultMonthsRemaining: 2,
    triggerCheck: (n) => !n.annexed && n.diplomaticStage !== 'vassal' && n.relation < 15,
    counterActions: [
      {
        id: 'goblin_preemptive_strike',
        name: '선제 기동 타격 및 군막 야습',
        character: '적 약탈군 궤멸 · 포로 인력 획득 · 적 국력 삭감',
        description: '정예 상비군을 은밀히 출격시켜 집결 중인 부족 군막을 기습 강타합니다.',
        costs: { capacities: { command: 1 }, resources: { grain: 25, iron: 10 } },
        outcomeHint: '고블린 군세 -6 · 인력 +130 획득 · 국고 노획 +25 · 위협 완전 소멸',
      },
      {
        id: 'goblin_fortify_walls',
        name: '국경 목책 증축 및 농민 소개령',
        character: '안전한 방어 · 주민 피해 최소화',
        description: '농민들을 성벽 안으로 피난시키고 참호와 목책을 급조해 수성 태세를 갖춥니다.',
        costs: { capacities: { administration: 1 }, resources: { timber: 25 } },
        outcomeHint: '약탈 피해 완전 방어 · 안정도 +3',
      },
    ],
    onExecuteUnprepared: (_n, s) => {
      s.resources.grain = Math.max(0, s.resources.grain - 60)
      s.resources.treasury = Math.max(0, s.resources.treasury - 35)
      s.population = Math.max(1000, s.population - 250)
      s.stability = Math.max(0, s.stability - 9)
      return {
        title: '[대약탈 참화] 황야 부족의 잿더미 습격',
        detail: '대비하지 못한 촌락들이 불타고 곡물과 가축이 약탈당했습니다! (식량 -60, 금화 -35, 인구 -250, 안정도 -9)',
      }
    },
    onExecuteCountered: (n, s, actionId) => {
      if (actionId === 'goblin_preemptive_strike') {
        n.strength = Math.max(15, n.strength - 6)
        s.manpower += 130
        s.resources.treasury += 25
        s.stability = Math.min(100, s.stability + 4)
        return {
          title: '[선제 타격 대첩] 붉은이빨 집결지 궤멸',
          detail: '기습 야습으로 집결 중이던 적 약탈군을 섬멸하고 포로들을 노역 인력으로 확보했습니다! (적 군세 -6, 인력 +130, 금화 +25, 안정도 +4)',
        }
      } else {
        s.stability = Math.min(100, s.stability + 3)
        return {
          title: '[철벽 방어] 목책 방어선 사수',
          detail: '견고한 참호와 목책 방어선에 가로막힌 부족 전사들이 헛걸음치고 황야로 퇴각했습니다. (안정도 +3)',
        }
      }
    },
  },

  goblin_tribute_demand: {
    type: 'goblin_tribute_demand',
    neighborId: 'goblin',
    title: '붉은이빨 부족의 조공 갈취 으름장',
    summary: '부족의 흉포한 사절이 식량을 바치지 않으면 국경 벌목꾼들을 사냥하겠다고 협박하고 있습니다.',
    threatLevel: '주의',
    defaultMonthsRemaining: 2,
    triggerCheck: (n) => !n.annexed && n.diplomaticStage !== 'vassal' && n.relation < 0,
    counterActions: [
      {
        id: 'goblin_throw_scraps',
        name: '남는 식량 찌꺼기로 달래기',
        character: '식량 소모 · 마찰 유예',
        description: '약간의 묵은 식량을 던져주어 당장의 충돌을 피하고 시간을 법니다.',
        costs: { resources: { grain: 25 } },
        outcomeHint: '위협 무마 · 고블린 관계 +8',
      },
      {
        id: 'goblin_behead_emissary',
        name: '사절 추방 및 결사항전 선언',
        character: '정통성 상승 · 영지 사기 고양 · 관계 악화',
        description: '협박을 단호히 거절하고 무장 수비대의 칼끝을 겨눠 사절을 쫓아냅니다.',
        costs: { capacities: { command: 1 } },
        outcomeHint: '정통성 +4 · 군사 사기 진작 · 고블린 관계 -15',
      },
    ],
    onExecuteUnprepared: (_n, s) => {
      s.resources.grain = Math.max(0, s.resources.grain - 30)
      s.stability = Math.max(0, s.stability - 4)
      return {
        title: '[국경 소요] 국경 벌목지 습격 피해',
        detail: '방비 없이 방치하자 부족 전사들이 국경 삼림을 습격해 식량을 빼앗아갔습니다. (식량 -30, 안정도 -4)',
      }
    },
    onExecuteCountered: (n, s, actionId) => {
      if (actionId === 'goblin_throw_scraps') {
        n.relation = Math.min(100, n.relation + 8)
        return {
          title: '[위협 유예] 식량 공여로 충돌 회피',
          detail: '식량을 챙긴 부족 사절이 만족하며 물러갔습니다. (고블린 관계 +8)',
        }
      } else {
        s.legitimacy = Math.min(100, s.legitimacy + 4)
        n.relation = Math.max(-100, n.relation - 15)
        return {
          title: '[불굴의 기개] 오만한 사절 축출',
          detail: '변경백의 단호한 결의에 백성들과 군사들의 사기가 크게 치솟았습니다! (정통성 +4, 고블린 관계 -15)',
        }
      }
    },
  },
}

export function evaluateAmbitionGoals(state: RealmState): AmbitionGoal[] {
  const armyPower = calculateArmyPower(state.soldiers, state.levies, state.policies.includes('standing_guard'))
  const annexedCount = state.neighbors.filter((n) => n.annexed).length
  const vassalCount = state.neighbors.filter((n) => n.diplomaticStage === 'vassal').length
  const dominatedCount = annexedCount + vassalCount

  const activeTradeCount = state.neighbors.filter((n) => n.tradeActive && !n.annexed).length
  const activeAlliances = state.neighbors.filter((n) => n.diplomaticStage === 'alliance' && !n.annexed).length
  const peacefulAnnexedCount = Object.values(state.governance).filter((g) => g.governanceMode === 'local_autonomy').length

  const allPeace = state.neighbors
    .filter((n) => !n.annexed && n.id !== 'crown')
    .every((n) => (n.diplomaticStage && n.diplomaticStage !== 'none') || n.relation >= 25)

  // 1. Military Hegemony
  const reqMilitary = [
    { label: '병합 및 봉신 영지', current: dominatedCount, target: 3, unit: '개 세력', isMet: dominatedCount >= 3 },
    { label: '상비 정예군', current: state.soldiers, target: 300, unit: '명', isMet: state.soldiers >= 300 },
    { label: '종합 군사력', current: armyPower, target: 650, unit: '전투력', isMet: armyPower >= 650 },
  ]
  const militaryMet = reqMilitary.every((r) => r.isMet)

  // 2. Commercial Dominion
  const reqCommercial = [
    { label: '가용 활성 교역로', current: activeTradeCount, target: 4, unit: '개소', isMet: activeTradeCount >= 4 },
    { label: '국고 비축량', current: state.resources.treasury, target: 650, unit: '🪙', isMet: state.resources.treasury >= 650 },
    { label: '영지 총 인구', current: state.population, target: 16000, unit: '명', isMet: state.population >= 16000 },
  ]
  const commercialMet = reqCommercial.every((r) => r.isMet)

  // 3. Royal Grand Duke
  const reqRoyal = [
    { label: '왕실 궁정 총애', current: state.royalFavor, target: 80, unit: '%', isMet: state.royalFavor >= 80 },
    { label: '군주 통치 정통성', current: state.legitimacy, target: 75, unit: '%', isMet: state.legitimacy >= 75 },
    { label: '전 국경 평화 안정', current: allPeace ? 1 : 0, target: 1, unit: '달성', isMet: allPeace },
  ]
  const royalMet = reqRoyal.every((r) => r.isMet)

  // 4. Grand Coalition
  const reqCoalition = [
    { label: '상호 방위 군사동맹', current: activeAlliances, target: 2, unit: '개국', isMet: activeAlliances >= 2 },
    { label: '평화 자치 병합령', current: peacefulAnnexedCount, target: 1, unit: '개소', isMet: peacefulAnnexedCount >= 1 },
    { label: '영지 민심 안정도', current: state.stability, target: 75, unit: '%', isMet: state.stability >= 75 },
  ]
  const coalitionMet = reqCoalition.every((r) => r.isMet)

  return [
    {
      id: 'military_hegemony',
      name: '철혈의 대공 (Military Hegemony)',
      title: '무력과 정벌로 대륙의 질서를 확립하는 군사 패권',
      icon: '⚔️',
      doctrineBranch: 'military',
      description: '인접 3개 세력을 굴복 또는 합병하고 300명 이상의 상비군을 양성해 대륙 서부의 절대 강자로 군림합니다.',
      requirements: reqMilitary,
      isCompleted: militaryMet,
    },
    {
      id: 'commercial_dominion',
      name: '황금 상업 제국 (Commercial Dominion)',
      title: '거대한 교역망과 금융으로 대륙을 쥐락펴락하는 번영',
      icon: '🪙',
      doctrineBranch: 'commerce',
      description: '대륙 전역과 4개 이상의 교역로를 잇고 국고 650과 인구 16,000을 돌파하여 경제 제국을 세웁니다.',
      requirements: reqCommercial,
      isCompleted: commercialMet,
    },
    {
      id: 'royal_grand_duke',
      name: '제국의 최고 수호공 (Grand Duke)',
      title: '왕실의 절대적 신뢰 속에서 평화로운 번영을 꽃피운 충신',
      icon: '👑',
      doctrineBranch: 'stewardship',
      description: '왕실 총애 80%와 정통성 75%를 획득하고 모든 인접국과 평화를 정착시켜 왕국의 으뜸 공신에 오릅니다.',
      requirements: reqRoyal,
      isCompleted: royalMet,
    },
    {
      id: 'grand_coalition',
      name: '대륙 연합 맹주 (Grand Coalition Sovereign)',
      title: '신뢰와 외교로 세력을 규합한 자유 동맹의 영수',
      icon: '🕊️',
      doctrineBranch: 'all',
      description: '2개국 이상의 군사 동맹과 평화적 병합 자치령을 확보하고 안정도 75%를 이룩해 연합의 영수가 됩니다.',
      requirements: reqCoalition,
      isCompleted: coalitionMet,
    },
  ]
}

export const INITIAL_DIRECTIVES: StrategicDirective[] = [
  {
    id: 'dir_1_farm',
    step: 1,
    title: '기반 개간: 하곡 농장 확충',
    description: '영지의 인구를 먹여 살리고 군량 기반을 확보하기 위해 농장을 2단계 이상으로 확장하십시오.',
    targetHint: '하곡 농장 2레벨 달성',
    isCompleted: false,
    rewardClaimed: false,
    rewardDesc: '금화 +35 · 식량 +25',
  },
  {
    id: 'dir_2_trade',
    step: 2,
    title: '대외 개방: 첫 교역로 개설',
    description: '세 갈래길 시장을 건설하고 우호 세력(실바나 또는 아우릭)과 첫 무역 협정을 체결하십시오.',
    targetHint: '활성 교역로 1개 이상 개설',
    isCompleted: false,
    rewardClaimed: false,
    rewardDesc: '금화 +45 · 외교력 즉시 충원',
  },
  {
    id: 'dir_3_muster',
    step: 3,
    title: '국경 방비: 상비 수비대 편성',
    description: '북부와 동부의 위협에 맞서 상비군을 220명 이상으로 증편하십시오.',
    targetHint: '상비군 220명 이상 확보',
    isCompleted: false,
    rewardClaimed: false,
    rewardDesc: '철 +20 · 안정도 +3',
  },
  {
    id: 'dir_4_treaty',
    step: 4,
    title: '외교적 결실: 첫 공식 조약 체결',
    description: '인접 세력과 불가침 조약 또는 군사 동맹을 성사시켜 외교적 안정을 다지십시오.',
    targetHint: '불가침 조약 또는 동맹 1개 체결',
    isCompleted: false,
    rewardClaimed: false,
    rewardDesc: '정통성 +5 · 왕실 총애 +4 · 금화 +50',
  },
  {
    id: 'dir_5_counter',
    step: 5,
    title: '위기 극복: 라이벌 책략 능동 대응',
    description: '인접 세력의 위협이나 왕실 감찰 책략에 대해 사전 대응책을 수립하여 완벽히 막아내십시오.',
    targetHint: '라이벌 책략 1회 이상 선제 대응 완료',
    isCompleted: false,
    rewardClaimed: false,
    rewardDesc: '안정도 +6 · 금화 +60',
  },
]
